import { Smartphone, Phone, Monitor, Terminal, AppWindow } from 'lucide-react';
const OS_OPTIONS = [
  { value: 'ios', label: 'iOS', icon: Phone },
  { value: 'android', label: 'Android', icon: Smartphone },
  { value: 'windows', label: 'Windows', icon: Monitor },
  { value: 'macos', label: 'macOS', icon: Laptop },
  { value: 'linux', label: 'Linux', icon: Terminal },
  { value: '', label: 'All', icon: AppWindow },
];

export default function OSFilter({ selected, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {OS_OPTIONS.map((os) => {
        const Icon = os.icon;
        const isActive = selected === os.value;
        return (
          <button
            key={os.value || 'all'}
            onClick={() => onChange(os.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
              isActive
                ? 'bg-accent-primary text-black'
                : 'bg-dark-card border border-dark-border text-text-secondary hover:bg-dark-card/80'
            }`}
          >
            <Icon size={16} />
            {os.label}
          </button>
        );
      })}
    </div>
  );
}
