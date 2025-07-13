import React from 'react';
import { formatCurrency } from '../common/Button';

function SaleDetails({ saleDetails, saleId, onDeleteSaleItem }) {
  if (!saleId) {
    return null;
  }
  if (saleDetails.length === 0) {
    return (
      <div style={{ flex: 1, color: '#f44336', fontWeight: 'bold', padding: 24 }}>
        ไม่สามารถแสดงรายละเอียดรายการขายนี้ได้ เนื่องจากสินค้าทั้งหมดในรายการนี้ถูกลบออกจากระบบแล้ว
      </div>
    );
  }

  const totalAmount = saleDetails.reduce((sum, item) => sum + item.item_total, 0);

  return (
    <div style={{ flex: 1 }}>
      <h3>รายละเอียด Sale #{saleId}</h3>
      {saleDetails[0]?.remark && (
        <div style={{ marginBottom: 8, color: '#444', fontStyle: 'italic' }}>
          หมายเหตุ: {saleDetails[0].remark}
        </div>
      )}
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>สินค้า</th>
            <th>จำนวน</th>
            <th>ราคา</th>
            <th>รวม</th>
            <th>การกระทำ</th>
          </tr>
        </thead>
        <tbody>
          {saleDetails.map((item, index) => (
            <tr key={index}>
              <td>{item.product_name}</td>
              <td>{item.quantity}</td>
              <td>{formatCurrency(item.sale_price ?? item.price)}</td>
              <td>{formatCurrency(item.item_total)}</td>
              <td>
                <button
                  onClick={() => onDeleteSaleItem(item.id, saleId)}
                  style={{ color: 'white', background: '#f44336', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}
                >
                  ลบ
                </button>
              </td>
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