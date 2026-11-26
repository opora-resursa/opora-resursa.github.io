import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export interface ToastData {
  id: number;
  message: string;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print fixed bottom-5 left-5 right-5 sm:left-auto sm:max-w-sm z-[60] rounded-2xl px-4 py-3 text-white flex items-center gap-3 animate-fade-in"
      style={{
        background: 'var(--grad-violet-deep)',
        boxShadow: 'var(--shadow-modal)',
        border: '1px solid var(--violet-border)',
      }}
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#CBE2F7]" aria-hidden="true" />
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
