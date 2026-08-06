import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch favorites from backend
    // For now, use localStorage mock
    const stored = localStorage.getItem('vexastore_favorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {}
    }
    setLoading(false);
  }, []);

  const removeFavorite = (id) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem('vexastore_favorites', JSON.stringify(updated));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} /> Back
      </Link>
      <h1 className="text-2xl font-bold text-white">Your Favorites</h1>
      {favorites.length > 0 ? (
        <div className="space-y-3">
          {favorites.map((app) => (
            <div key={app.id} className="glass-card p-4 flex items-center justify-between">
              <Link to={`/app/${app.slug}`} className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-dark-bg border border-dark-border">
                    <img src={app.icon_url || ''} alt={app.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{app.name}</p>
                    <p className="text-xs text-slate-400">{app.developer}</p>
                  </div>
                </div>
              </Link>
              <button onClick={() => removeFavorite(app.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400">
                <Heart size={18} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-slate-400">
          <Heart size={48} className="mx-auto text-slate-600/30 mb-4" />
          <p className="text-lg font-medium">No favorites yet</p>
          <p className="text-sm mt-1">Browse apps and tap the heart to save them</p>
          <Link to="/" className="text-cyan-400 hover:underline mt-3 inline-block">Browse Apps</Link>
        </div>
      )}
    </div>
  );
}
