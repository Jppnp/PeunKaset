import React from 'react';
import { formatCurrency } from '../common/Button';

function SaleDetails({ saleDetails, selectedSale }) {
  if (!selectedSale || saleDetails.length === 0) {
    return null;
  }

  const totalAmount = saleDetails.reduce((sum, item) => sum + item.item_total, 0);

  return (
    <div style={{ flex: 1 }}>
      <h3>รายละเอียด Sale #{selectedSale}</h3>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>สินค้า</th>
            <th>SKU</th>
            <th>จำนวน</th>
            <th>ราคา</th>
            <th>รวม</th>
          </tr>
        </thead>
        <tbody>
          {saleDetails.map((item, index) => (
            <tr key={index}>
              <td>{item.product_name}</td>
              <td>{item.sku}</td>
              <td>{item.quantity}</td>
              <td>{formatCurrency(item.price)}</td>
              <td>{formatCurrency(item.item_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 16, fontWeight: 'bold' }}>
        ยอดรวม: {formatCurrency(totalAmount)} บาท
      </div>
    </div>
  );
}

export default SaleDetails; 