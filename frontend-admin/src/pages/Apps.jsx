import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Eye,
  Smartphone,
  Apple,
  Window,
  Linux,
} from 'lucide-react';

const OS_ICONS = {
  ios: Apple,
  android: Smartphone,
  windows: Window,
  macos: Apple,
  linux: Linux,
};

export default function Apps() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const { showSuccess, showError } = useNotification();
  
  useEffect(() => {
    loadApps();
  }, []);
  
  async function loadApps() {
    try {
      setLoading(true);
      const res = await api.getApps();
      setApps(res.data?.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  
  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this app?')) return;
    try {
      setDeleting(id);
      await api.deleteApp(id);
      showSuccess('App deleted successfully');
      loadApps();
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  }
  
  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(search.toLowerCase()) ||
    app.description?.toLowerCase().includes(search.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Apps</h1>
          <p className="text-text-secondary">Manage all apps on VexaStore</p>
        </div>
        <Link to="/apps/add" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add App
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search apps..."
          className="input-field pl-10"
        />
      </div>

      {/* Apps Grid */}
      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredApps.map((app) => (
            <div key={app.id} className="glass-card p-4 hover:border-accent-primary/30 transition">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-bg border border-dark-border flex-shrink-0">
                  {app.icon_url ? (
                    <img src={`${import.meta.env.VITE_API_BASE_URL}${app.icon_url}`} alt={app.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-accent-primary">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{app.name}</h3>
                  <p className="text-xs text-text-secondary truncate">{app.developer || 'VexaTrade'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-text-secondary">{app.total_downloads || 0} downloads</span>
                    <span className="text-xs text-text-secondary">•</span>
                    <span className="text-xs text-text-secondary">{app.version_count || 0} versions</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {app.versions?.slice(0, 3).map((v) => {
                      const Icon = OS_ICONS[v.os] || Smartphone;
                      return <Icon key={v.id} size={14} className="text-text-secondary" title={v.os} />;
                    })}
                    {(app.versions?.length || 0) > 3 && (
                      <span className="text-xs text-text-secondary">+{app.versions.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-dark-border">
                <Link to={`/apps/${app.id}/versions`} className="p-2 rounded-lg hover:bg-dark-bg/50 text-text-secondary hover:text-white transition" title="Versions">
                  <Package size={16} />
                </Link>
                <Link to={`/apps/edit/${app.id}`} className="p-2 rounded-lg hover:bg-dark-bg/50 text-text-secondary hover:text-white transition" title="Edit">
                  <Edit size={16} />
                </Link>
                <Link to={`/app/${app.slug}`} target="_blank" className="p-2 rounded-lg hover:bg-dark-bg/50 text-text-secondary hover:text-white transition" title="View">
                  <Eye size={16} />
                </Link>
                <button
                  onClick={() => handleDelete(app.id)}
                  disabled={deleting === app.id}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition disabled:opacity-50"
                  title="Delete"
                >
                  {deleting === app.id ? (
                    <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block"></span>
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-text-secondary">
          <Package size={48} className="mx-auto text-text-secondary/30 mb-4" />
          <p>No apps found. {search ? 'Try a different search.' : 'Add your first app!'}</p>
          {!search && (
            <Link to="/apps/add" className="text-accent-primary hover:underline mt-2 inline-block">
              Add App →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}