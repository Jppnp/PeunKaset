import { ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import db from '../../../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../../store.db');

export function setupBackupHandlers() {
  ipcMain.handle('backupData', async () => {
    const { dialog } = await import('electron');
    const fs = await import('fs');
    
    try {
      const result = await dialog.showSaveDialog({
        title: 'เลือกตำแหน่งสำหรับไฟล์สำรองข้อมูล',
        defaultPath: `puenkaset_backup_${new Date().toISOString().split('T')[0]}.db`,
        filters: [
          { name: 'Database Files', extensions: ['db'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        // Close database connection temporarily
        db.close();
        
        // Copy database file
        fs.copyFileSync(dbPath, result.filePath);
        
        // Reopen database connection
        const newDb = new sqlite3.Database(dbPath);
        Object.assign(db, newDb);
        
        return { success: true, filePath: result.filePath };
      }
      return { success: false, canceled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('restoreData', async () => {
    const { dialog } = await import('electron');
    const fs = await import('fs');
    
    try {
      const result = await dialog.showOpenDialog({
        title: 'เลือกไฟล์สำรองข้อมูลเพื่อกู้คืน',
        filters: [
          { name: 'Database Files', extensions: ['db'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const backupPath = result.filePaths[0];
        
        // Verify it's a valid SQLite database
        try {
          const testDb = new sqlite3.Database(backupPath);
          testDb.get("SELECT name FROM sqlite_master WHERE type='table' AND name='products'", (err, row) => {
            testDb.close();
            if (err || !row) {
              throw new Error('ไฟล์ที่เลือกไม่ใช่ฐานข้อมูลที่ถูกต้อง');
            }
          });
        } catch (error) {
          return { success: false, error: error.message };
        }
        
        // Close current database connection
        db.close();
        
        // Create backup of current database before restore
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const currentBackupPath = dbPath + `.backup.${timestamp}`;
        fs.copyFileSync(dbPath, currentBackupPath);
        
        // Restore from backup
        fs.copyFileSync(backupPath, dbPath);
        
        // Reopen database connection
        const newDb = new sqlite3.Database(dbPath);
        Object.assign(db, newDb);
        
        return { success: true, filePath: backupPath };
      }
      return { success: false, canceled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
} 