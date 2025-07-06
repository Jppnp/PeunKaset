import { ipcMain } from 'electron';
import db from '../../../db.js';

export function setupSalesHandlers() {
  ipcMain.handle('completeSale', async (event, cartItems) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        try {
          // Create sales record
          const saleDate = new Date().toISOString();
          db.run('INSERT INTO sales (date) VALUES (?)', [saleDate], function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            const saleId = this.lastID;
            let completedItems = 0;
            let totalAmount = 0;
            
            // Process each cart item
            cartItems.forEach((item, index) => {
              // Insert sale item
              db.run(
                'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [saleId, item.id, item.qty, item.price],
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
        } catch (error) {
          db.run('ROLLBACK');
          reject(error);
        }
      });
    });
  });

  ipcMain.handle('getSalesHistory', async (event, limit = 50) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          s.id,
          s.date,
          COUNT(si.id) as item_count,
          SUM(si.quantity * si.price) as total_amount
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        GROUP BY s.id, s.date
        ORDER BY s.date DESC
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  });

  ipcMain.handle('getSaleDetails', async (event, saleId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          s.id,
          s.date,
          p.name as product_name,
          p.sku,
          si.quantity,
          si.price,
          (si.quantity * si.price) as item_total
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
} 