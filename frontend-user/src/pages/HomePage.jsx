import { useState, useEffect } from 'react';
import { appApi } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import AppCard from '../components/AppCard';
import FeaturedApps from '../components/FeaturedApps';
import OSFilter from '../components/OSFilter';
import StatsCard from '../components/StatsCard';
import { Download, Smartphone, Laptop, TrendingUp, Award, Zap, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  const filteredApps = selectedOS
    ? apps.filter(app => app.versions?.some(v => v.os === selectedOS))
    : apps;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 text-sm">Loading VexaStore...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a0e1a] to-[#050812] border border-white/5 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-400 mb-4">
            <Zap size={14} />
            <span>VexaTrade Blockchain Ecosystem</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Discover <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Apps</span> for Every Platform
          </h1>
          <p className="text-slate-400 max-w-xl text-base md:text-lg mb-6">
            Download verified apps from the VexaTrade ecosystem. iOS, Android, Windows, macOS, Linux — all in one secure blockchain-powered store.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/search" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-semibold hover:scale-[1.02] transition">
              Browse Apps <ArrowRight size={18} />
            </Link>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Shield size={14} className="text-emerald-400" /> Secure</span>
              <span className="flex items-center gap-1"><Zap size={14} className="text-cyan-400" /> Fast</span>
              <span className="flex items-center gap-1"><Sparkles size={14} className="text-purple-400" /> Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard label="Total Apps" value={apps.length} icon={Download} className="border border-white/5 hover:border-cyan-500/20 transition" />
        <StatsCard label="Categories" value={categories.length} icon={Award} className="border border-white/5 hover:border-cyan-500/20 transition" />
        <StatsCard label="Platforms" value="5" icon={Laptop} className="border border-white/5 hover:border-cyan-500/20 transition" />
        <StatsCard label="Downloads" value={(apps.reduce((acc, a) => acc + (a.total_downloads || 0), 0)).toLocaleString()} icon={TrendingUp} className="border border-white/5 hover:border-cyan-500/20 transition" />
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles size={20} className="text-cyan-400" />
              Featured Apps
            </h2>
            <Link to="/search" className="text-sm text-slate-500 hover:text-cyan-400 transition flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <FeaturedApps apps={featured} />
        </section>
      )}

      {/* All Apps */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Download size={20} className="text-emerald-400" />
            All Apps
          </h2>
          <OSFilter selected={selectedOS} onChange={setSelectedOS} />
        </div>
        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredApps.map((app) => <AppCard key={app.id} app={app} />)}
          </div>
        ) : (
          <div className="glass-card p-12 text-center text-slate-500 border border-white/5 rounded-3xl">
            <Smartphone size={48} className="mx-auto text-slate-600/30 mb-4" />
            <p className="text-lg font-medium text-slate-400">No apps found</p>
            <p className="text-sm mt-1">Try selecting a different platform or check back later.</p>
          </div>
        )}
      </section>
    </div>
  );
}
