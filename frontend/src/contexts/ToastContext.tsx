import { createContext, useCallback, useContext, useState } from 'react';

interface Toast {
  id: string;
  message: string;
  action?: { label: string; onAction: () => void };
  duration?: number;
}

interface ToastContextValue {
  showToast: (msg: string, opts?: { action?: { label: string; onAction: () => void }; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, opts?: { action?: { label: string; onAction: () => void }; duration?: number }) => {
      const id = crypto.randomUUID();
      const t: Toast = { id, message, action: opts?.action, duration: opts?.duration ?? 4000 };
      setToasts((prev) => [...prev, t]);
      if (t.duration && !t.action) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== id));
        }, t.duration);
      }
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-600 shadow-lg"
          >
            <span className="text-sm">{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action!.onAction();
                  dismiss(t.id);
                }}
                className="text-sm font-medium text-[#646cff] hover:text-[#535bf2]"
              >
                {t.action.label}
              </button>
            )}
            <button type="button" onClick={() => dismiss(t.id)} className="text-neutral-400 hover:text-neutral-200">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
