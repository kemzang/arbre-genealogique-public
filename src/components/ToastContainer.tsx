import React from 'react';
import { Toast, type ToastType } from './Toast';

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            top: `${20 + index * 80}px`,
            right: '20px',
            zIndex: 10000
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onClose(toast.id)}
          />
        </div>
      ))}
    </>
  );
};
