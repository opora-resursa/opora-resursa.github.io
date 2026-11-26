import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastData {
  id: number;
  message: string;
  tone?: 'success' | 'error';
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const isError = toast.tone === 'error';

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print fixed bottom-5 left-5 right-5 sm:left-auto sm:max-w-sm z-[60] rounded-2xl px-4 py-3 text-white flex items-center gap-3 animate-fade-in"
      style={{
        background: isError
          ? 'linear-gradient(138deg, #4B1D3B 0%, #7A4469 100%)'
          : 'var(--grad-violet-deep)',
        boxShadow: 'var(--shadow-modal)',
        border: isError
          ? '1px solid var(--plum-border)'
          : '1px solid var(--violet-border)',
      }}
    >
      {isError ? (
        <AlertCircle className="h-5 w-5 shrink-0 text-[#F5C2D7]" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#CBE2F7]" aria-hidden="true" />
      )}
      <p className="text-[14px] leading-snug text-[#FAF6EE] flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Закрыть уведомление"
        className="ml-1 rounded-lg p-1 text-white/90 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
