import React, { useState } from 'react';
import ProductSearch from './ProductSearch';
import Cart from './Cart';

function POS() {
  const [cart, setCart] = useState([]);
  const [printReceipt, setPrintReceipt] = useState(true);

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

  const handleCompleteSale = (saleData) => {
    setCart([]);
  };

  const handlePreviewReceipt = async (saleData, cartItems) => {
    await window.api.previewReceipt(saleData, cartItems);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>หน้าขายสินค้า (POS)</h2>
      <ProductSearch onAddToCart={handleAddToCart} />
      <Cart
        cart={cart}
        onQtyChange={handleQtyChange}
        onRemove={handleRemove}
        onCompleteSale={handleCompleteSale}
        onPreviewReceipt={handlePreviewReceipt}
        printReceipt={printReceipt}
        setPrintReceipt={setPrintReceipt}
      />
    </div>
  );
}

export default POS; 