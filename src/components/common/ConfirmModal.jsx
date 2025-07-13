import React from 'react';

function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.3)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff',
        padding: 32,
        borderRadius: 8,
        minWidth: 320,
        boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: 24, fontSize: 18 }}>{message}</div>
        <button
          onClick={onConfirm}
          style={{
            background: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '8px 24px',
            marginRight: 16,
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          ตกลง
        </button>
        <button
          onClick={onCancel}
          style={{
            background: '#f44336',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '8px 24px',
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}

export default ConfirmModal; 