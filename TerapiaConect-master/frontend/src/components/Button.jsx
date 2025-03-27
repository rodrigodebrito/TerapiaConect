import React from 'react';
import PropTypes from 'prop-types';
import './Button.css';

/**
 * Componente Button reutilizável que suporta diferentes variantes
 */
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium', 
  type = 'button',
  disabled = false,
  fullWidth = false,
  className = '',
  ...props 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        btn 
        btn-${variant} 
        btn-${size} 
        ${fullWidth ? 'btn-full-width' : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string
};

export default Button; 