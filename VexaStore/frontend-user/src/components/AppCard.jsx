import { Link } from 'react-router-dom';
import { Download, Star } from 'lucide-react';

export default function AppCard({ app }) {
  const rating = Number(app.rating || 0);
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  
  return (
    <Link to={`/app/${app.slug}`} className="block group">
      <div className="glass-card p-4 hover:border-accent-primary/30 transition-all duration-300">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-dark-bg border border-dark-border flex-shrink-0">
            {app.icon_url ? (
              <img src={`${import.meta.env.VITE_API_BASE_URL}${app.icon_url}`} alt={app.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-accent-primary">
                {app.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white truncate">{app.name}</h3>
            <p className="text-sm text-text-secondary truncate">{app.developer || 'VexaTrade'}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-text-secondary">•</span>
              <span className="text-xs text-text-secondary">{app.total_downloads || 0} downloads</span>
              <span className="text-xs text-text-secondary">•</span>
              <span className="text-xs text-text-secondary">{app.latest_version || 'v1.0'}</span>
            </div>
            <p className="text-sm text-text-secondary line-clamp-2 mt-1">{app.description}</p>
          </div>

          <div className="flex-shrink-0 self-center">
            <Download size={20} className="text-accent-primary group-hover:scale-110 transition" />
          </div>
        </div>
      </div>
    </Link>
  );
}