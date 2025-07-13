import React, { useState } from 'react';
import ProductSearch from './ProductSearch';
import Cart from './Cart';

function POS() {
  const [cart, setCart] = useState([]);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [remark, setRemark] = useState('');
  const [notification, setNotification] = useState('');

  const handleAddToCart = (product) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.id === product.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].qty += 1;
        return updated;
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleQtyChange = (id, delta) => {
    setCart((prev) => prev
      .map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item)
      .filter(item => item.qty > 0)
    );
  };

  const handleRemove = (id) => {
    setCart((prev) => prev.filter(item => item.id !== id));
  };

  const handlePreviewReceipt = async (saleData, cartItems) => {
    await window.api.previewReceipt(saleData, cartItems);
  };

  const handleRequestCompleteSale = async () => {
    if (cart.length === 0) {
      alert('ไม่มีสินค้าในตะกร้า');
      return;
    }
    const cartTotal = cart.reduce((sum, item) => sum + item.qty * (item.sale_price ?? item.price), 0);
    if (window.confirm(`ยืนยันการขายสินค้า\nยอดรวม: ${cartTotal.toLocaleString()} บาท`)) {
      try {
        const saleData = await window.api.completeSale(cart, remark);
        let saleDetails = [];
        if (printReceipt) {
          saleDetails = await window.api.getSaleDetails(saleData.saleId);
          const cartItems = saleDetails.map(item => ({
            name: item.product_name,
            qty: item.quantity,
            description: item.description,
            price: item.sale_price ?? item.price
          }));
          await window.api.printReceipt({ ...saleData, remark }, cartItems);
        }
        setCart([]);
        setRemark('');
        setNotification(`ขายสินค้าสำเร็จ! Sale #${saleData.saleId} ยอดรวม: ${saleData.totalAmount.toLocaleString()} บาท`);
        setTimeout(() => setNotification(''), 3000);
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการขายสินค้า: ' + error.message);
      }
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {notification && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#333', color: '#fff', padding: 16, borderRadius: 8, zIndex: 1000 }}>
          {notification}
        </div>
      )}
      <h2>หน้าขายสินค้า (POS)</h2>
      <ProductSearch onAddToCart={handleAddToCart} />
      <div style={{ margin: '16px 0' }}>
        <label>
          หมายเหตุ:
          <input
            type="text"
            value={remark}
            onChange={e => setRemark(e.target.value)}
            style={{ marginLeft: 8, width: 300, fontSize: 16, padding: 4 }}
            placeholder="ระบุหมายเหตุสำหรับการขายนี้ (ถ้ามี)"
          />
        </label>
      </div>
      <Cart
        cart={cart}
        onQtyChange={handleQtyChange}
        onRemove={handleRemove}
        onRequestCompleteSale={handleRequestCompleteSale}
        onPreviewReceipt={handlePreviewReceipt}
        printReceipt={printReceipt}
        setPrintReceipt={setPrintReceipt}
      />
    </div>
  );
}

export default POS; 