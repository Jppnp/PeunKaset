import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import './App.css';

function BarcodeSVG({ sku }) {
  const svgRef = useRef(null);
  useEffect(() => {
    if (svgRef.current && sku) {
      JsBarcode(svgRef.current, sku, { format: 'CODE128', width: 2, height: 40, displayValue: false });
    }
  }, [sku]);
  return <svg ref={svgRef}></svg>;
}

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '' });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const loadProducts = async () => {
    const dbProducts = await window.api.getProducts();
    setProducts(dbProducts);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingIndex !== null && editingId !== null) {
      await window.api.editProduct(editingId, form);
    } else {
      await window.api.addProduct(form);
    }
    setForm({ name: '', description: '', price: '', stock: '' });
    setEditingIndex(null);
    setEditingId(null);
    loadProducts();
  };

  const handleEdit = (idx) => {
    setForm({
      name: products[idx].name,
      description: products[idx].description,
      price: products[idx].price,
      stock: products[idx].stockOnHand,
    });
    setEditingIndex(idx);
    setEditingId(products[idx].id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?')) {
      await window.api.deleteProduct(id);
      loadProducts();
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>จัดการสินค้า</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input name="name" placeholder="ชื่อสินค้า" value={form.name} onChange={handleChange} required />{' '}
        <input name="description" placeholder="รายละเอียด" value={form.description} onChange={handleChange} />{' '}
        <input name="price" type="number" placeholder="ราคา" value={form.price} onChange={handleChange} required min="0" step="0.01" />{' '}
        <input name="stock" type="number" placeholder="จำนวนคงเหลือ" value={form.stock} onChange={handleChange} required min="0" step="1" />{' '}
        <button type="submit">{editingIndex !== null ? 'อัปเดตสินค้า' : 'เพิ่มสินค้า'}</button>
      </form>
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
          {products.map((p, idx) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.description}</td>
              <td>{p.price}</td>
              <td>{p.stockOnHand}</td>
              <td>{p.sku}</td>
              <td><BarcodeSVG sku={p.sku} /></td>
              <td>
                <button onClick={() => handleEdit(idx)}>แก้ไข</button>{' '}
                <button onClick={() => handleDelete(p.id)}>ลบ</button>{' '}
                <button onClick={() => window.api.printLabel(p)}>พิมพ์ฉลาก</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function POS() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const found = await window.api.searchProducts(query);
      setResults(found);
      setShowDropdown(true);
      setLoading(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

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
    setQuery('');
    setShowDropdown(false);
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

  const cartTotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <div style={{ padding: 24 }}>
      <h2>หน้าขายสินค้า (POS)</h2>
      <div style={{ position: 'relative', width: 320 }}>
        <input
          type="text"
          placeholder="ค้นหาด้วยชื่อสินค้า, รายละเอียด หรือยิงบาร์โค้ด..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ width: 320, fontSize: 18, marginBottom: 16 }}
          autoFocus
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        {loading && <div style={{ position: 'absolute', left: 0, top: 40 }}>กำลังค้นหา...</div>}
        {showDropdown && results.length > 0 && (
          <ul style={{
            position: 'absolute',
            left: 0,
            top: 40,
            width: '100%',
            background: 'white',
            border: '1px solid #ccc',
            maxHeight: 200,
            overflowY: 'auto',
            zIndex: 10,
            listStyle: 'none',
            margin: 0,
            padding: 0
          }}>
            {results.map((p) => (
              <li
                key={p.id}
                style={{ padding: 8, cursor: 'pointer', borderBottom: '1px solid #eee' }}
                onMouseDown={() => handleAddToCart(p)}
              >
                <div><b>{p.name}</b> <span style={{ color: '#888' }}>({p.sku})</span></div>
                <div style={{ fontSize: 13, color: '#666' }}>{p.description}</div>
                <div style={{ fontSize: 14, color: '#333' }}>ราคา: {p.price} บาท | คงเหลือ: {p.stockOnHand}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
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
              <td>{item.price}</td>
              <td>
                <button onClick={() => handleQtyChange(item.id, -1)}>-</button>
                {' '}{item.qty}{' '}
                <button onClick={() => handleQtyChange(item.id, 1)}>+</button>
              </td>
              <td>{(item.qty * item.price).toFixed(2)}</td>
              <td><button onClick={() => handleRemove(item.id)}>ลบ</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 16, fontWeight: 'bold', fontSize: 20 }}>
        ยอดรวม: {cartTotal.toFixed(2)} บาท
      </div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState('pos');
  return (
    <div>
      <nav style={{ marginBottom: 24 }}>
        <button onClick={() => setScreen('pos')}>ขายสินค้า</button>{' '}
        <button onClick={() => setScreen('products')}>จัดการสินค้า</button>
      </nav>
      {screen === 'pos' ? <POS /> : <ProductManagement />}
    </div>
  );
}

export default App;
