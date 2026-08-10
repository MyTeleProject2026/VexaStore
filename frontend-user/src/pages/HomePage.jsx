// frontend-user/src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Download, Smartphone, Phone, Monitor, Laptop, Terminal,
  TrendingUp, Zap, Shield, Sparkles, ArrowRight,
} from 'lucide-react';
import { appApi } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import AppCard from '../components/AppCard';
import FeaturedApps from '../components/FeaturedApps';
import OSFilter from '../components/OSFilter';
import StatsCard from '../components/StatsCard';
import NewsSection from '../components/NewsSection';

export default function HomePage() {
  const [apps, setApps] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState('');
  const { showError } = useNotification();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [appsRes, featuredRes, newsRes] = await Promise.all([
        appApi.getApps({ limit: 20 }),
        appApi.getFeatured(),
        appApi.getNews(),
      ]);
      setApps(appsRes.data?.data || []);
      setFeatured(featuredRes.data?.data || []);
      setNews(newsRes.data?.data || []);
    } catch (err) {
      showError('Failed to load data');
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
        <div className="spinner" />
        <p className="mt-4 text-slate-500 text-sm">Loading VexaStore...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a0e1a] to-[#050812] border border-white/5 p-5 md:p-8">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[10px] font-medium text-cyan-400 mb-3">
            <Zap size={12} />
            <span>VexaTrade Ecosystem</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">
            Discover <span className="gradient-text">Apps</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mb-4">
            Download verified apps from the VexaTrade ecosystem.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/search" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-semibold text-sm hover:scale-[1.02] transition">
              Browse Apps <ArrowRight size={16} />
            </Link>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><Shield size={12} className="text-emerald-400" /> Secure</span>
              <span className="flex items-center gap-1"><Zap size={12} className="text-cyan-400" /> Fast</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quick Categories ─── */}
      <div className="grid grid-cols-5 gap-2">
        <Link to="/category/ios" className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-[#0a0e1a]/50 border border-white/5 hover:border-cyan-500/20 transition">
          <Phone size={24} className="text-blue-400" />
          <span className="text-[10px] text-slate-400">iOS</span>
        </Link>
        <Link to="/category/android" className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-[#0a0e1a]/50 border border-white/5 hover:border-cyan-500/20 transition">
          <Smartphone size={24} className="text-green-400" />
          <span className="text-[10px] text-slate-400">Android</span>
        </Link>
        <Link to="/category/windows" className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-[#0a0e1a]/50 border border-white/5 hover:border-cyan-500/20 transition">
          <Monitor size={24} className="text-cyan-400" />
          <span className="text-[10px] text-slate-400">Windows</span>
        </Link>
        <Link to="/category/macos" className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-[#0a0e1a]/50 border border-white/5 hover:border-cyan-500/20 transition">
          <Laptop size={24} className="text-purple-400" />
          <span className="text-[10px] text-slate-400">macOS</span>
        </Link>
        <Link to="/category/linux" className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-[#0a0e1a]/50 border border-white/5 hover:border-cyan-500/20 transition">
          <Terminal size={24} className="text-amber-400" />
          <span className="text-[10px] text-slate-400">Linux</span>
        </Link>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard label="Total Apps" value={apps.length} icon={Download} className="border border-white/5 hover:border-cyan-500/20 transition p-3" />
        <StatsCard label="Platforms" value="5" icon={Laptop} className="border border-white/5 hover:border-cyan-500/20 transition p-3" />
      </div>

      {/* ─── News Section ─── */}
      {news.length > 0 && <NewsSection news={news} />}

      {/* ─── Featured ─── */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-cyan-400" />
              Featured
            </h2>
            <Link to="/search" className="text-xs text-slate-500 hover:text-cyan-400 transition flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <FeaturedApps apps={featured} />
        </section>
      )}

      {/* ─── Top Downloads ─── */}
      {apps.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              Top Downloads
            </h2>
          </div>
          <div className="space-y-2">
            {apps.slice(0, 3).map((app, index) => (
              <Link key={app.id} to={`/app/${app.slug}`} className="flex items-center gap-3 p-3 rounded-2xl bg-[#0a0e1a]/50 border border-white/5 hover:border-cyan-500/20 transition">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  #{index + 1}
                </div>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#050812] border border-white/5 flex-shrink-0">
                  {app.icon_url ? (
                    <img src={`${import.meta.env.VITE_API_BASE_URL}${app.icon_url}`} alt={app.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-cyan-400">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{app.name}</p>
                  <p className="text-xs text-slate-500 truncate">{app.developer || 'VexaTrade'}</p>
                </div>
                <div className="text-xs text-slate-500">
                  <Download size={14} className="inline mr-1" />
                  {app.total_downloads || 0}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── All Apps ─── */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download size={18} className="text-emerald-400" />
            All Apps
          </h2>
          <OSFilter selected={selectedOS} onChange={setSelectedOS} className="flex-wrap" />
        </div>
        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredApps.map((app) => <AppCard key={app.id} app={app} />)}
          </div>
        ) : (
          <div className="glass-card p-8 text-center text-slate-500">
            <Smartphone size={40} className="mx-auto text-slate-600/30 mb-3" />
            <p className="text-base font-medium text-slate-400">No apps found</p>
            <p className="text-xs mt-1">Try selecting a different platform</p>
          </div>
        )}
      </section>
    </div>
  );
}
