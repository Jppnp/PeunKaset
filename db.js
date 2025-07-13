import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from 'electron';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app || !app.isPackaged;
const dbPath = isDev ? path.join(__dirname, 'store.db') : path.join(process.resourcesPath, 'store.db');
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
const initSQL = `
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  cost_price REAL NOT NULL DEFAULT 0,
  sale_price REAL NOT NULL DEFAULT 0,
  stockOnHand INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  remark TEXT
);
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  cost_price REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`;

db.exec(initSQL, (err) => {
  if (err) {
    console.error('Failed to initialize database:', err);
  } else {
    // Remove all migration logic related to price field
    console.log('Database initialized');
    // Migration: add remark to sales if missing
    db.all("PRAGMA table_info(sales);", (err, columns) => {
      if (err) return;
      const colNames = columns.map(c => c.name);
      if (!colNames.includes('remark')) {
        db.run("ALTER TABLE sales ADD COLUMN remark TEXT;");
      }
    });
  }
});

export default db; 