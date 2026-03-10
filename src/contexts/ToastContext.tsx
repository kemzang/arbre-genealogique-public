import React from 'react';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ToastContainer';
import { ToastContext } from './ToastContext';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      <ToastContainer toasts={toast.toasts} onClose={toast.hideToast} />
      {children}
    </ToastContext.Provider>
  );
}

