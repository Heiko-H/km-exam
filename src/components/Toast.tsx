import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface ToastMessage {
  id: number;
  message: string;
}

const ToastContext = createContext<((message: string) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const nextId = useRef(0);

  const showToast = useCallback((message: string) => {
    nextId.current += 1;
    setToast({ id: nextId.current, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && <div aria-atomic="true" aria-live="polite" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-slate-600 bg-panel px-4 py-3 text-center text-sm font-medium text-white shadow-xl print:hidden" role="status">{toast.message}</div>}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) throw new Error('useToast must be used within ToastProvider');
  return showToast;
}