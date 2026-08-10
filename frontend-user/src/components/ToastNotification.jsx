import { X } from 'lucide-react';

const COLORS = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
};

export default function ToastNotification({ message, type = 'info', onClose }) {
  const colorClass = COLORS[type] || COLORS.info;

  return (
    <div
      className={`
        glass-card px-4 py-3 flex items-center justify-between gap-3
        ${colorClass}
        animate-slideUp
      `}
    >
      <span className="text-sm flex-1 break-words">{message}</span>
      <button
        onClick={onClose}
        className="text-slate-500 hover:text-white transition p-1 rounded-full hover:bg-white/5"
      >
        <X size={18} />
      </button>
    </div>
  );
}
