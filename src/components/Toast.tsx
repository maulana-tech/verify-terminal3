"use client";

import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

function ToastItem({
  toast,
  onRemove,
}: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setVisible(true), 20);
    // Auto-dismiss
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 350);
    }, toast.duration ?? 4000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(timerRef.current);
    };
  }, [toast, onRemove]);

  const icons = {
    success: <CheckCircle className="h-4 w-4 text-verified shrink-0 mt-0.5" />,
    error: <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />,
    info: <Info className="h-4 w-4 text-gold/80 shrink-0 mt-0.5" />,
  };

  const borders = {
    success: "border-verified/30",
    error: "border-red-900/40",
    info: "border-gold/25",
  };

  return (
    <div
      className={`flex items-start space-x-3 w-80 bg-[#0a0a0c] border ${borders[toast.type]} shadow-2xl p-4 transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      }`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold font-mono uppercase tracking-wider text-bone">
          {toast.title}
        </div>
        {toast.message && (
          <p className="text-[10px] text-stone font-light leading-relaxed mt-0.5">
            {toast.message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          setTimeout(() => onRemove(toast.id), 350);
        }}
        className="text-stone/40 hover:text-gold transition-colors cursor-pointer shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...opts, id }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-20 right-4 z-[200] flex flex-col space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
