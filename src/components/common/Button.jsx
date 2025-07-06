import React from 'react';

// Utility function to format numbers with commas
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-US');
}

// Utility function to format currency with commas
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '0.00';
  return Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false, 
  type = 'button',
  style = {},
  ...props 
}) {
  const baseStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    ...style
  };

  const variants = {
    primary: {
      backgroundColor: disabled ? '#ccc' : '#4CAF50',
      color: 'white'
    },
    secondary: {
      backgroundColor: disabled ? '#ccc' : '#2196F3',
      color: 'white'
    },
    warning: {
      backgroundColor: disabled ? '#ccc' : '#FF9800',
      color: 'white'
    },
    danger: {
      backgroundColor: disabled ? '#ccc' : '#f44336',
      color: 'white'
    },
    outline: {
      backgroundColor: 'transparent',
      color: disabled ? '#ccc' : '#4CAF50',
      border: `1px solid ${disabled ? '#ccc' : '#4CAF50'}`
    }
  };

  const buttonStyle = {
    ...baseStyle,
    ...variants[variant]
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button; 