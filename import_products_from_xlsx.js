import xlsx from 'xlsx';
import sqlite3 from 'sqlite3';
import path from 'path';

// Open the database
const db = new sqlite3.Database(path.join(process.cwd(), 'store.db'));

// Read the Excel file
const workbook = xlsx.readFile('data.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

const insert = db.prepare(
  'INSERT INTO products (name, description, cost_price, sale_price, stockOnHand) VALUES (?, ?, ?, ?, ?)'
);

for (const row of rows) {
  // The columns are: Item, Code, Description, sale_price, cost_price
  const name = (row['Code'] || '').toString().trim();
  const description = (row['Description'] || '').toString().trim();
  const cost_price = parseFloat(row['cost_price']) || 0;
  const sale_price = parseFloat(row['sale_price']) || 0;
  insert.run(name, description, cost_price, sale_price, 10);
}

insert.finalize();
db.close();
console.log('Import complete!'); 