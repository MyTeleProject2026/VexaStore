export default function StatsCard({ label, value, icon: Icon, trend, className = '' }) {
  return (
    <div className={`glass-card p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
            <Icon size={20} className="text-cyan-400" />
          </div>
        )}
      </div>
    </div>
  );
}
