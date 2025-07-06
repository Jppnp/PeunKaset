import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import './db.js';

// Import handler modules
import { setupProductHandlers } from './src/main/handlers/productHandlers.js';
import { setupSalesHandlers } from './src/main/handlers/salesHandlers.js';
import { setupPrintHandlers } from './src/main/handlers/printHandlers.js';
import { setupBackupHandlers } from './src/main/handlers/backupHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile('dist/index.html');
  }
}

// Setup all IPC handlers
function setupHandlers() {
  setupProductHandlers();
  setupSalesHandlers();
  setupPrintHandlers();
  setupBackupHandlers();
}

app.whenReady().then(() => {
  setupHandlers();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 