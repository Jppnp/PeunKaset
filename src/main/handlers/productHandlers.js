import { ipcMain } from 'electron';
import db from '../../../db.js';

// Generate a unique SKU (simple example: timestamp-based)
function generateSKU() {
  return 'SKU-' + Date.now();
}

export function setupProductHandlers() {
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
} 