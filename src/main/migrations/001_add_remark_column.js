export default {
  version: '1.0.1',
  description: 'Add remark column to sales table',
  dependencies: [], // Previous migrations required
  
  up: async (db) => {
    return new Promise((resolve, reject) => {
      db.run("ALTER TABLE sales ADD COLUMN remark TEXT", (err) => {
        if (err) {
          // Check if column already exists
          if (err.message.includes('duplicate column name')) {
            console.log('Remark column already exists, skipping...');
            resolve();
          } else {
            reject(err);
          }
        } else {
          console.log('Added remark column to sales table');
          resolve();
        }
      });
    });
  },
  
  down: async () => {
    // SQLite doesn't support DROP COLUMN directly
    // This would require recreating the table without the column
    return new Promise((resolve) => {
      console.log('Rollback for remark column not implemented (SQLite limitation)');
      resolve();
    });
  },
  
  validate: async (db) => {
    // Verify migration was applied correctly
    return new Promise((resolve, reject) => {
      // Check if remark column exists
      db.all("PRAGMA table_info(sales)", (err, columns) => {
        if (err) {
          reject(err);
        } else {
          const hasRemarkColumn = columns.some(col => col.name === 'remark');
          resolve(hasRemarkColumn);
        }
      });
    });
  }
};