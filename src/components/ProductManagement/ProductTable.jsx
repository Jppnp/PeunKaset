import React from 'react';
import BarcodeSVG from '../common/BarcodeSVG';
import Button from '../common/Button';
import { formatCurrency } from '../common/Button';

function ProductTable({ products, onEdit, onDelete, onPrintLabel }) {
  return (
    <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>ชื่อสินค้า</th>
          <th>รายละเอียด</th>
          <th>ราคา</th>
          <th>จำนวนคงเหลือ</th>
          <th>รหัสสินค้า (SKU)</th>
          <th>บาร์โค้ด</th>
          <th>การกระทำ</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product, idx) => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.description}</td>
            <td>{formatCurrency(product.price)}</td>
            <td>{product.stockOnHand}</td>
            <td>{product.sku}</td>
            <td><BarcodeSVG sku={product.sku} /></td>
            <td>
              <Button 
                onClick={() => onEdit(idx)} 
                variant="secondary"
                style={{ marginRight: '4px', fontSize: '12px', padding: '4px 8px' }}
              >
                แก้ไข
              </Button>
              <Button 
                onClick={() => onDelete(product.id)} 
                variant="danger"
                style={{ marginRight: '4px', fontSize: '12px', padding: '4px 8px' }}
              >
                ลบ
              </Button>
              <Button 
                onClick={() => onPrintLabel(product)} 
                variant="warning"
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                พิมพ์ฉลาก
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ProductTable; 