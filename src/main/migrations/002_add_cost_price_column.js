export default {
  version: '1.0.2',
  description: 'Add cost_price column to products table',
  dependencies: ['1.0.1'], // Requires previous migration
  
  up: async (db) => {
    return new Promise((resolve, reject) => {
      db.run("ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0", (err) => {
        if (err) {
          // Check if column already exists
          if (err.message.includes('duplicate column name')) {
            console.log('Cost price column already exists, skipping...');
            resolve();
          } else {
            reject(err);
          }
        } else {
          console.log('Added cost_price column to products table');
          resolve();
        }
      });
    });
  },
  
  down: async () => {
    // SQLite doesn't support DROP COLUMN directly
    // This would require recreating the table without the column
    return new Promise((resolve) => {
      console.log('Rollback for cost_price column not implemented (SQLite limitation)');
      resolve();
    });
  },
  
  validate: async (db) => {
    // Verify migration was applied correctly
    return new Promise((resolve, reject) => {
      // Check if cost_price column exists
      db.all("PRAGMA table_info(products)", (err, columns) => {
        if (err) {
          reject(err);
        } else {
          const hasCostPriceColumn = columns.some(col => col.name === 'cost_price');
          resolve(hasCostPriceColumn);
        }
      });
    });
  }
};