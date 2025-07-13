import { ipcMain } from 'electron';
import db from '../../../db.js';
import fs from 'fs';
import { dialog } from 'electron';

export function setupSalesHandlers() {
  ipcMain.handle('completeSale', async (event, cartItems, remark = '') => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        try {
          // Create sales record
          const saleDate = new Date().toISOString();
          db.run('INSERT INTO sales (date, remark) VALUES (?, ?)', [saleDate, remark], function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            const saleId = this.lastID;
            let completedItems = 0;
            let totalAmount = 0;
            
            // Process each cart item
            cartItems.forEach((item) => {
              // Insert sale item
              db.get('SELECT cost_price, sale_price FROM products WHERE id = ?', [item.id], (err, row) => {
                const costPrice = row ? row.cost_price : 0;
                const salePrice = row ? row.sale_price : 0;
                db.run(
                  'INSERT INTO sale_items (sale_id, product_id, quantity, price, cost_price) VALUES (?, ?, ?, ?, ?)',
                  [saleId, item.id, item.qty, salePrice, costPrice],
                  function(err) {
                    if (err) {
                      db.run('ROLLBACK');
                      return reject(err);
                    }
                    // Update product stock
                    db.run(
                      'UPDATE products SET stockOnHand = stockOnHand - ? WHERE id = ?',
                      [item.qty, item.id],
                      function(err) {
                        if (err) {
                          db.run('ROLLBACK');
                          return reject(err);
                        }
                        totalAmount += item.qty * item.price;
                        completedItems++;
                        // If all items processed, commit transaction
                        if (completedItems === cartItems.length) {
                          db.run('COMMIT');
                          resolve({ saleId, totalAmount, saleDate });
                        }
                      }
                    );
                  }
                );
              });
            });
          });
        } catch (error) {
          db.run('ROLLBACK');
          reject(error);
        }
      });
    });
  });

  ipcMain.handle('getSalesHistory', async (event, { filterType, filterValue, limit = 50 }) => {
    // filterType: 'day' | 'month' | undefined
    // filterValue: 'YYYY-MM-DD' or 'YYYY-MM' or undefined
    let where = '';
    let params = [];
    if (filterType === 'day' && filterValue) {
      where = 'WHERE DATE(s.date) = ?';
      params.push(filterValue);
    } else if (filterType === 'month' && filterValue) {
      where = "WHERE strftime('%Y-%m', s.date) = ?";
      params.push(filterValue);
    }
    params.push(limit);
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          s.id,
          s.date,
          s.remark,
          COUNT(si.id) as item_count,
          SUM(si.quantity * si.price) as total_amount,
          SUM((si.price - si.cost_price) * si.quantity) as profit
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        ${where}
        GROUP BY s.id, s.date
        ORDER BY s.date DESC
        LIMIT ?
      `, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  });

  ipcMain.handle('getSaleDetails', async (event, saleId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          si.id,
          s.date,
          s.remark,
          p.name as product_name,
          p.description,
          si.quantity,
          si.price as sale_price,
          p.cost_price,
          (si.price - p.cost_price) as profit_per_item,
          (si.quantity * si.price) as item_total,
          ((si.price - p.cost_price) * si.quantity) as item_profit
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        JOIN products p ON si.product_id = p.id
        WHERE s.id = ?
        ORDER BY si.id
      `, [saleId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  });

  ipcMain.handle('deleteSale', async (event, saleId) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM sale_items WHERE sale_id = ?', [saleId], function(err) {
          if (err) return reject(err);
          db.run('DELETE FROM sales WHERE id = ?', [saleId], function(err2) {
            if (err2) return reject(err2);
            resolve({ success: true, saleId });
          });
        });
      });
    });
  });

  ipcMain.handle('deleteSaleItem', async (event, saleItemId) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM sale_items WHERE id = ?', [saleItemId], function(err) {
        if (err) return reject(err);
        resolve({ success: true, saleItemId });
      });
    });
  });

  // CSV export handler
  ipcMain.handle('exportSalesCSV', async (event, { month }) => {
    // month: 'YYYY-MM'
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          s.date,
          p.name as product_name,
          si.quantity,
          p.cost_price,
          si.price as sale_price,
          (si.price - p.cost_price) as profit_per_item,
          ((si.price - p.cost_price) * si.quantity) as total_profit
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        JOIN products p ON si.product_id = p.id
        WHERE strftime('%Y-%m', s.date) = ?
        ORDER BY s.date ASC
      `, [month], async (err, rows) => {
        if (err) return reject(err);
        if (!rows.length) return resolve({ success: false, message: 'No sales found for this month.' });
        // Build CSV
        const header = 'Date,Product,Quantity,Cost Price,Sale Price,Profit per Item,Total Profit\n';
        const csv = header + rows.map(r => [
          r.date,
          r.product_name,
          r.quantity,
          r.cost_price,
          r.sale_price,
          r.profit_per_item,
          r.total_profit
        ].join(',')).join('\n');
        // Ask user for save location
        const { filePath } = await dialog.showSaveDialog({
          title: 'Export Sales CSV',
          defaultPath: `sales-${month}.csv`,
          filters: [{ name: 'CSV Files', extensions: ['csv'] }]
        });
        if (!filePath) return resolve({ success: false, message: 'Export cancelled.' });
        fs.writeFile(filePath, csv, (err) => {
          if (err) return reject(err);
          resolve({ success: true, message: 'Exported successfully.' });
        });
      });
    });
  });
} 