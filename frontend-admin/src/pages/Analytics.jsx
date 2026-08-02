import { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import {
  Download,
  Smartphone,
  Apple,
  Window,
  Linux,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
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
  Legend,
} from 'recharts';

const COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
const OS_ICONS = {
  ios: Apple,
  android: Smartphone,
  windows: Window,
  macos: Apple,
  linux: Linux,
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [stats, setStats] = useState({
    total: 0,
    by_os: [],
    top_apps: [],
    daily: [],
  });
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
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-text-secondary">Detailed download analytics and insights</p>
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

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Total Downloads</p>
            <Download size={18} className="text-accent-primary" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{totalDownloads.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Platforms</p>
            <TrendingUp size={18} className="text-accent-primary" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{osData.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Top App</p>
            <Calendar size={18} className="text-accent-primary" />
          </div>
          <p className="text-lg font-bold text-white mt-1 truncate">
            {topApps[0]?.name || 'N/A'}
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Avg Daily</p>
            <TrendingUp size={18} className="text-accent-primary" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {dailyData.length > 0 
              ? Math.round(dailyData.reduce((acc, d) => acc + d.count, 0) / dailyData.length).toLocaleString()
              : 0
            }
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Download Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Platform Distribution</h3>
          <div className="h-56">
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
                  <span>{item.os}: {item.count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Apps */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Top Performing Apps</h3>
        {topApps.length > 0 ? (
          <div className="space-y-3">
            {topApps.map((app, idx) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-bg/50 border border-dark-border">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold text-accent-primary w-6 text-center">#{idx + 1}</span>
                  <span className="text-white font-medium truncate">{app.name}</span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-sm text-text-secondary">{app.downloads.toLocaleString()} downloads</span>
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
          <p className="text-text-secondary text-center py-4">No download data available yet</p>
        )}
      </div>
    </div>
  );
}