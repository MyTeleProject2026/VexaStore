import { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import {
  Package,
  Download,
  TrendingUp,
  Smartphone,
  Laptop,
  Apple,
  Window,
  Linux,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
const OS_ICONS = {
  ios: Apple,
  android: Smartphone,
  windows: Window,
  macos: Apple,
  linux: Linux,
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    by_os: [],
    top_apps: [],
    daily: [],
  });
  const [period, setPeriod] = useState('30d');
  const { showError } = useNotification();
  
  useEffect(() => {
    loadStats();
  }, [period]);
  
  async function loadStats() {
    try {
      setLoading(true);
      const res = await api.getDownloadStats(period);
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const totalDownloads = stats.total || 0;
  const osData = stats.by_os || [];
  const topApps = stats.top_apps || [];
  const dailyData = stats.daily || [];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-text-secondary">Overview of VexaStore downloads and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl bg-dark-card border border-dark-border px-4 py-2 text-white text-sm outline-none focus:border-accent-primary"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={loadStats}
            className="p-2 rounded-xl border border-dark-border text-text-secondary hover:text-white hover:border-accent-primary/30 transition"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-text-secondary">Total Downloads</p>
          <p className="text-2xl font-bold text-white mt-1">{totalDownloads.toLocaleString()}</p>
          <p className="text-xs text-emerald-400 mt-1">+12.5% this period</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-text-secondary">Apps</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.top_apps?.length || 0}</p>
          <p className="text-xs text-text-secondary mt-1">Active apps</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-text-secondary">Avg Rating</p>
          <p className="text-2xl font-bold text-white mt-1">4.8</p>
          <p className="text-xs text-emerald-400 mt-1">⭐ Excellent</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-text-secondary">Platforms</p>
          <p className="text-2xl font-bold text-white mt-1">5</p>
          <p className="text-xs text-text-secondary mt-1">iOS, Android, Windows, macOS, Linux</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Downloads Chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Downloads Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OS Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">By Platform</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={osData}
                  dataKey="count"
                  nameKey="os"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ os, percent }) => `${os}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {osData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {osData.map((item, idx) => {
              const Icon = OS_ICONS[item.os] || Download;
              return (
                <div key={item.os} className="flex items-center gap-1 text-xs text-text-secondary">
                  <Icon size={12} style={{ color: COLORS[idx % COLORS.length] }} />
                  <span>{item.os}: {item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Apps */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Top Apps</h3>
        {topApps.length > 0 ? (
          <div className="space-y-3">
            {topApps.map((app, idx) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-bg/50 border border-dark-border">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-accent-primary w-6">#{idx + 1}</span>
                  <span className="text-white font-medium">{app.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-text-secondary">{app.downloads} downloads</span>
                  <div className="w-24 h-2 rounded-full bg-dark-border overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-accent-primary"
                      style={{ width: `${(app.downloads / (topApps[0]?.downloads || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-center py-4">No download data yet</p>
        )}
      </div>
    </div>
  );
}