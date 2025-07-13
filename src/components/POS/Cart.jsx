import React from 'react';
import Button from '../common/Button';
import { formatCurrency } from '../common/Button';

function Cart({ cart, onQtyChange, onRemove, onRequestCompleteSale, onPreviewReceipt, printReceipt, setPrintReceipt }) {
  const cartTotal = cart.reduce((sum, item) => sum + item.qty * (item.sale_price ?? item.price), 0);

  return (
    <div>
      <h3 style={{ marginTop: 32 }}>ตะกร้าสินค้า</h3>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr>
            <th>ชื่อสินค้า</th>
            <th>ราคา</th>
            <th>จำนวน</th>
            <th>รวม</th>
            <th>การกระทำ</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{formatCurrency(item.sale_price ?? item.price)}</td>
              <td>
                <Button 
                  onClick={() => onQtyChange(item.id, -1)}
                  variant="outline"
                  style={{ padding: '2px 6px', fontSize: '12px' }}
                >
                  -
                </Button>
                {' '}{item.qty}{' '}
                <Button 
                  onClick={() => onQtyChange(item.id, 1)}
                  variant="outline"
                  style={{ padding: '2px 6px', fontSize: '12px' }}
                >
                  +
                </Button>
              </td>
              <td>{formatCurrency(item.qty * (item.sale_price ?? item.price))}</td>
              <td>
                <Button 
                  onClick={() => onRemove(item.id)}
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
      <div style={{ marginTop: 16, fontWeight: 'bold', fontSize: 20 }}>
        ยอดรวม: {formatCurrency(cartTotal)} บาท
      </div>
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={printReceipt}
            onChange={(e) => setPrintReceipt(e.target.checked)}
          />
          พิมพ์ใบเสร็จรับเงิน
        </label>
        {cart.length > 0 && (
          <Button 
            onClick={() => {
              const mockSaleData = {
                saleId: 'PREVIEW',
                totalAmount: cartTotal,
                saleDate: new Date().toISOString()
              };
              onPreviewReceipt(mockSaleData, cart);
            }}
            variant="secondary"
            style={{ 
              marginLeft: 16,
              fontSize: 14, 
              padding: '6px 12px'
            }}
          >
            ดูตัวอย่างใบเสร็จ
          </Button>
        )}
      </div>
      <div style={{ marginTop: 16 }}>
        <Button 
          onClick={onRequestCompleteSale}
          disabled={cart.length === 0}
          variant="primary"
          style={{ 
            fontSize: 18, 
            padding: '12px 24px'
          }}
        >
          ขายสินค้า
        </Button>
      </div>
    </div>
  );
}

export default Cart; 