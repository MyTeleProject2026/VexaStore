import { useNotification } from '../hooks/useNotification';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col items-center gap-2 p-4 pointer-events-none safe-bottom">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        const colorClass = COLORS[toast.type] || COLORS.info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full max-w-md glass-card ${colorClass} flex items-center gap-3 px-4 py-3 animate-slideUp`}
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="flex-1 text-sm font-medium break-words">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-secondary hover:text-white transition p-1 rounded-full hover:bg-white/5"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
