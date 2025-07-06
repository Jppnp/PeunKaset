import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../common/Button';

function ProductSearch({ onAddToCart }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
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
    onAddToCart(product);
    setQuery('');
    setShowDropdown(false);
  };

  return (
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
          {results.map((product) => (
            <li
              key={product.id}
              style={{ padding: 8, cursor: 'pointer', borderBottom: '1px solid #eee' }}
              onMouseDown={() => handleAddToCart(product)}
            >
              <div><b>{product.name}</b> <span style={{ color: '#888' }}>({product.sku})</span></div>
              <div style={{ fontSize: 13, color: '#666' }}>{product.description}</div>
              <div style={{ fontSize: 14, color: '#333' }}>ราคา: {formatCurrency(product.price)} บาท | คงเหลือ: {product.stockOnHand}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProductSearch; 