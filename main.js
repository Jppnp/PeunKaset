import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import './db.js';
import { ipcMain } from 'electron';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate a unique SKU (simple example: timestamp-based)
function generateSKU() {
  return 'SKU-' + Date.now();
}

ipcMain.handle('addProduct', async (event, product) => {
  return new Promise((resolve, reject) => {
    const sku = generateSKU();
    db.run(
      'INSERT INTO products (sku, name, description, price, stockOnHand) VALUES (?, ?, ?, ?, ?)',
      [sku, product.name, product.description, product.price, product.stock],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, sku, ...product });
      }
    );
  });
});

ipcMain.handle('editProduct', async (event, id, product) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE products SET name = ?, description = ?, price = ?, stockOnHand = ? WHERE id = ?',
      [product.name, product.description, product.price, product.stock, id],
      function (err) {
        if (err) return reject(err);
        resolve({ id, ...product });
      }
    );
  });
});

ipcMain.handle('getProducts', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
});

ipcMain.handle('deleteProduct', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
      if (err) return reject(err);
      resolve({ id });
    });
  });
});

ipcMain.handle('searchProducts', async (event, query) => {
  return new Promise((resolve, reject) => {
    if (!query || query.trim() === '') {
      db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
      return;
    }
    const q = `%${query.trim()}%`;
    db.all(
      `SELECT *,
        CASE WHEN sku = ? THEN 1 ELSE 0 END AS isExactSku,
        CASE WHEN LOWER(name) = LOWER(?) THEN 1 ELSE 0 END AS isExactName
      FROM products
      WHERE sku = ? OR LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?)
      ORDER BY isExactSku DESC, isExactName DESC, name ASC`,
      [query, query, query, q, q],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
});

ipcMain.handle('printLabel', async (event, product) => {
  const { BrowserWindow } = await import('electron');
  const labelWin = new BrowserWindow({
    width: 300,
    height: 180,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const labelHTML = `
    <html>
      <body style="font-family:sans-serif;text-align:center;padding:0;margin:0;">
        <div style="font-size:18px;font-weight:bold;">${product.name}</div>
        <div style="font-size:16px;">Price: ${product.price}</div>
        <svg id="barcode"></svg>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.12.0/dist/JsBarcode.all.min.js"></script>
        <script>
          JsBarcode(document.getElementById('barcode'), '${product.sku}', {format:'CODE128', width:2, height:40, displayValue:false});
        </script>
      </body>
    </html>
  `;

  await labelWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(labelHTML));
  labelWin.webContents.on('did-finish-load', () => {
    labelWin.webContents.print({ silent: false }, () => {
      labelWin.close();
    });
  });
});

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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Placeholder for IPC and DB setup 