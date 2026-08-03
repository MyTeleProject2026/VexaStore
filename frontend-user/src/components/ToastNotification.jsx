import { X } from 'lucide-react';

export default function ToastNotification({ message, type = 'info', onClose }) {
  const colors = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    error: 'border-red-500/30 bg-red-500/10 text-red-300',
    info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  };

  return (
    <div className={`glass-card px-4 py-3 flex items-center justify-between gap-3 ${colors[type] || colors.info}`}>
      <span className="text-sm flex-1">{message}</span>
      <button onClick={onClose} className="text-text-secondary hover:text-white transition">
        <X size={18} />
      </button>
    </div>
  );
}
