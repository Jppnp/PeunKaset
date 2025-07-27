import React from 'react';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatters';

function ProductTable({ products, onEdit, onDelete }) {
  return (
    <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>ชื่อสินค้า</th>
          <th>รายละเอียด</th>
          <th>ราคาทุน</th>
          <th>ราคาขาย</th>
          <th>จำนวนคงเหลือ</th>
          <th>การกระทำ</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.description}</td>
            <td>{formatCurrency(product.cost_price)}</td>
            <td>{formatCurrency(product.sale_price)}</td>
            <td>{product.stockOnHand}</td>
            <td>
              <Button 
                onClick={() => onEdit(product.id)} 
                variant="secondary"
                style={{ marginRight: '4px', fontSize: '12px', padding: '4px 8px' }}
              >
                แก้ไข
              </Button>
              <Button 
                onClick={() => onDelete(product.id)} 
                variant="danger"
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                ลบ
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ProductTable; 