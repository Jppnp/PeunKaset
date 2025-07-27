import React from 'react';


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