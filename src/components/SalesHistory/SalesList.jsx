import React from 'react';
import Button from '../common/Button';
import { formatCurrency } from '../common/Button';

function SalesList({ sales, selectedSale, onSelectSale, onPreviewReceipt }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('th-TH');
  };

  return (
    <div style={{ flex: 1 }}>
      <h3>รายการขายล่าสุด</h3>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Sale #</th>
            <th>วันที่</th>
            <th>จำนวนสินค้า</th>
            <th>ยอดรวม</th>
            <th>การกระทำ</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} style={{ backgroundColor: selectedSale === sale.id ? '#e3f2fd' : 'white' }}>
              <td>{sale.id}</td>
              <td>{formatDate(sale.date)}</td>
              <td>{sale.item_count}</td>
              <td>{formatCurrency(sale.total_amount || 0)}</td>
              <td>
                <Button 
                  onClick={() => onSelectSale(sale.id)}
                  variant="secondary"
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  ดูรายละเอียด
                </Button>
                <br />
                <Button 
                  onClick={() => onPreviewReceipt(sale)}
                  variant="warning"
                  style={{ 
                    fontSize: 11, 
                    padding: '4px 8px', 
                    marginTop: 4
                  }}
                >
                  ดูใบเสร็จ
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SalesList; 