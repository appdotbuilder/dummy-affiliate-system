import { createContext, useContext, useState, ReactNode } from 'react';
import type { Toast, ToastContextValue } from './toast-utils';

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    const newToast = { id, message, type };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const toast = {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toastItem) => (
          <div
            key={toastItem.id}
            className={`
              px-4 py-3 rounded-md shadow-lg max-w-sm transform transition-all duration-300 ease-in-out
              ${toastItem.type === 'success' ? 'bg-green-500 text-white' : ''}
              ${toastItem.type === 'error' ? 'bg-red-500 text-white' : ''}
              ${toastItem.type === 'info' ? 'bg-blue-500 text-white' : ''}
              animate-fade-in
            `}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{toastItem.message}</span>
              <button
                onClick={() => removeToast(toastItem.id)}
                className="ml-2 text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}