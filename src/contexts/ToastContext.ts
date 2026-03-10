import { createContext } from 'react';
import { type useToast } from '../hooks/useToast';

type ToastContextType = ReturnType<typeof useToast>;

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
