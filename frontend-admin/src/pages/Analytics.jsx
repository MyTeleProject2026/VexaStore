import { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { Download, Smartphone, Apple, Monitor, Terminal, TrendingUp, RefreshCw } from 'lucide-react';
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
  windows: Monitor,
  macos: Apple,
  linux: Terminal,
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
            <option value="