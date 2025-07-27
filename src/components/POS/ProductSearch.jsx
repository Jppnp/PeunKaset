import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../../utils/formatters';

function ProductSearch({ onAddToCart }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef();
  const inputRef = useRef();
  const itemRefs = useRef([]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      setLoading(false);
      setHighlightedIndex(-1);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const found = await window.api.searchProducts(query);
      setResults(found);
      setShowDropdown(true);
      setLoading(false);
      setHighlightedIndex(found.length > 0 ? 0 : -1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleAddToCart = (product) => {
    onAddToCart({ ...product, price: product.sale_price });
    setQuery('');
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(idx => (idx + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(idx => (idx - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleAddToCart(results[highlightedIndex]);
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: 320 }}>
      <input
        ref={inputRef}
        type="text"
        placeholder="ค้นหาด้วยชื่อสินค้า หรือรายละเอียด..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ width: 320, fontSize: 18, marginBottom: 16 }}
        autoFocus
        onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        onKeyDown={handleKeyDown}
      />
      {loading && <div style={{ position: 'absolute', left: 0, top: 40 }}>กำลังค้นหา...</div>}
      {showDropdown && results.length > 0 && (
        <ul
          style={{
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
          }}
        >
          {results.map((product, idx) => (
            <li
              key={product.id}
              ref={el => itemRefs.current[idx] = el}
              style={{
                padding: 8,
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                background: idx === highlightedIndex ? '#e3f2fd' : 'white',
              }}
              onMouseDown={() => handleAddToCart(product)}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              <div><b>{product.name}</b></div>
              <div style={{ fontSize: 13, color: '#666' }}>{product.description}</div>
              <div style={{ fontSize: 15, color: '#333' }}>
                ราคาขาย: <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: 18 }}>{formatCurrency(product.sale_price)}</span> บาท
                <span style={{ fontSize: 13, color: '#333', fontWeight: 'normal', marginLeft: 8 }}>
                  | คงเหลือ: {product.stockOnHand}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProductSearch; 