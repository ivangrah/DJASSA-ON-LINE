import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

/** Toast minimaliste Djassa : pastille noire, point rouge, file d'attente */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, opts = {}) => {
    const type = typeof opts === 'string' ? opts : (opts.type ?? 'info');
    const description = typeof opts === 'string' ? null : (opts.description ?? null);
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-2), { id, message, type, description }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4800);
  }, []);

  const toast = useMemo(() => ({
    success: (msg, opts = {}) => push(msg, { ...opts, type: 'success' }),
    error: (msg, opts = {}) => push(msg, { ...opts, type: 'error' }),
    info: (msg, opts = {}) => push(msg, { ...opts, type: 'info' }),
  }), [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex w-full max-w-md flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`flex w-full items-start gap-2.5 rounded-[5px] border-solid border-[0.5px] px-4 py-3 text-sm font-DM-Sans shadow-card ${t.type === 'error' ? 'bg-[#780000] border-[#780000] text-white' : 'bg-djassa-black border-[rgba(255,255,255,0.12)] text-white'}`}
          >
            {t.type === 'success' && <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />}
            {t.type === 'error' && <XCircle size={18} className="mt-0.5 shrink-0 text-white" />}
            {t.type === 'info' && <Info size={18} className="mt-0.5 shrink-0 text-djassa-red-soft" />}
            <div className="flex-1">
              <p className="font-medium">{t.message}</p>
              {t.description && <p className="mt-0.5 text-[11px] text-white/80">{t.description}</p>}
            </div>
            <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} aria-label="Fermer" className="mt-0.5">
              <X size={16} className="text-white/60 hover:text-white" />
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
