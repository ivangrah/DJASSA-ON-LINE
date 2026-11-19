import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

/** Toast minimaliste Djassa : pastille noire, point rouge, file d'attente */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const toast = useMemo(() => ({
    success: (msg) => push(msg, 'success'),
    error: (msg) => push(msg, 'error'),
    info: (msg) => push(msg, 'info'),
  }), [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex w-full max-w-md flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="flex w-full items-center gap-2.5 rounded-2xl bg-djassa-black px-4 py-3 text-sm font-inter font-medium text-white shadow-card"
          >
            {t.type === 'success' && <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />}
            {t.type === 'error' && <XCircle size={18} className="shrink-0 text-djassa-red" />}
            {t.type === 'info' && <Info size={18} className="shrink-0 text-djassa-red-soft" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} aria-label="Fermer">
              <X size={16} className="text-white/50 hover:text-white" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans <ToastProvider>');
  return ctx;
}
