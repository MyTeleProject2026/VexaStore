import { useState, useEffect } from 'react';
import { appApi } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import AppCard from '../components/AppCard';
import FeaturedApps from '../components/FeaturedApps';
import OSFilter from '../components/OSFilter';
import StatsCard from '../components/StatsCard';
import { Download, Smartphone, Laptop, TrendingUp, Award } from 'lucide-react';

export default function HomePage() {
  const [apps, setApps] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState('');
  const { showError } = useNotification();
  
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    try {
      setLoading(true);
      const [appsRes, featuredRes, categoriesRes] = await Promise.all([
        appApi.getApps({ limit: 20 }),
        appApi.getApps({ featured: true, limit: 10 }),
        appApi.getCategories(),
      ]);
      setApps(appsRes.data?.data || []);
      setFeatured(featuredRes.data?.data || []);
      setCategories(categoriesRes.data?.data || []);
    } catch (err) {
      showError('Failed to load apps');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  
  const filteredApps = selectedOS ?
    apps.filter(app => app.versions?.some(v => v.os === selectedOS)) :
    apps;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="glass-card p-6 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Welcome to <span className="gradient-text">VexaStore</span>
        </h1>
        <p className="text-text-secondary mt-2 max-w-2xl mx-auto md:mx-0">
          Download apps from the VexaTrade ecosystem. iOS, Android, Windows, macOS, Linux — all in one secure blockchain-powered store.
        </p>
        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
          <span className="px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-sm">🔒 Secure</span>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">⚡ Fast</span>
          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm">🌐 Blockchain</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard label="Total Apps" value={apps.length} icon={Download} />
        <StatsCard label="Categories" value={categories.length} icon={Award} />
        <StatsCard label="Platforms" value="5" icon={Laptop} />
        <StatsCard label="Downloads" value={(apps.reduce((acc, a) => acc + (a.total_downloads || 0), 0)).toLocaleString()} icon={TrendingUp} />
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award size={20} className="text-accent-primary" />
            Featured Apps
          </h2>
          <FeaturedApps apps={featured} />
        </section>
      )}

      {/* OS Filter */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-white">All Apps</h2>
          <OSFilter selected={selectedOS} onChange={setSelectedOS} />
        </div>
        <div className="space-y-3">
          {filteredApps.length > 0 ? (
            filteredApps.map((app) => <AppCard key={app.id} app={app} />)
          ) : (
            <div className="glass-card p-8 text-center text-text-secondary">
              <p>No apps found for this platform.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}