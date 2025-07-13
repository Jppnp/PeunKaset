import { ipcMain } from 'electron';
import db from '../../../db.js';

export function setupProductHandlers() {
  ipcMain.handle('addProduct', async (event, product) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO products (name, description, cost_price, sale_price, stockOnHand) VALUES (?, ?, ?, ?, ?)',
        [product.name, product.description, product.cost_price, product.sale_price, product.stock],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, ...product });
        }
      );
    });
  });

  ipcMain.handle('editProduct', async (event, id, product) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE products SET name = ?, description = ?, cost_price = ?, sale_price = ?, stockOnHand = ? WHERE id = ?',
        [product.name, product.description, product.cost_price, product.sale_price, product.stock, id],
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
        `SELECT * FROM products WHERE LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) ORDER BY name ASC`,
        [q, q],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  });
} 