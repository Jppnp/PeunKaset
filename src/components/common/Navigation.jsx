import React from 'react';

function Navigation({ currentScreen, onScreenChange }) {
  const navItems = [
    { id: 'pos', label: 'ขายสินค้า' },
    { id: 'products', label: 'จัดการสินค้า' },
    { id: 'sales', label: 'ประวัติการขาย' },
    { id: 'settings', label: 'ตั้งค่า' }
  ];

  return (
    <nav style={{ marginBottom: 24 }}>
      {navItems.map(item => (
        <button 
          key={item.id}
          onClick={() => onScreenChange(item.id)}
          style={{
            padding: '8px 16px',
            marginRight: '8px',
            backgroundColor: currentScreen === item.id ? '#4CAF50' : '#f0f0f0',
            color: currentScreen === item.id ? 'white' : '#333',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export default Navigation; 