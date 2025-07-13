import React from 'react';

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      background: '#333',
      color: '#fff',
      padding: 16,
      borderRadius: 8,
      zIndex: 1000,
      minWidth: 200,
      textAlign: 'center'
    }}>
      {message}
      <button onClick={onClose} style={{
        marginLeft: 16,
        background: 'transparent',
        color: '#fff',
        border: 'none',
        fontSize: 18,
        cursor: 'pointer'
      }}>×</button>
    </div>
  );
}

export default Toast; 