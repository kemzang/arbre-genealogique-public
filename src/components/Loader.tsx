import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ 
  size = 'medium', 
  text,
  fullScreen = false 
}) => {
  const sizes = {
    small: 20,
    medium: 40,
    large: 60
  };

  const loaderSize = sizes[size];

  const loaderStyle: React.CSSProperties = {
    width: loaderSize,
    height: loaderSize,
    border: `${loaderSize / 10}px solid rgba(50, 108, 88, 0.1)`,
    borderTop: `${loaderSize / 10}px solid #326C58`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const containerStyle: React.CSSProperties = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px'
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={containerStyle}>
        <div style={loaderStyle}></div>
        {text && (
          <p style={{
            color: fullScreen ? 'white' : '#326C58',
            fontSize: size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px',
            fontWeight: 500,
            margin: 0
          }}>
            {text}
          </p>
        )}
      </div>
    </>
  );
};

// Loader inline pour les boutons
export const ButtonLoader: React.FC = () => (
  <span style={{
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginRight: '8px',
    verticalAlign: 'middle'
  }} />
);
