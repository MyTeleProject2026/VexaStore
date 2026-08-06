import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Globe, Bell, Shield } from 'lucide-react';

export default function Settings() {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="space-y-4">
      <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} /> Back to Profile
      </Link>
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Moon size={18} className="text-cyan-400" />
            <span className="text-white">Dark Mode</span>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-500/20 text-slate-300'}`}>
            {darkMode ? 'On' : 'Off'}
          </button>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-cyan-400" />
            <span className="text-white">Push Notifications</span>
          </div>
          <button onClick={() => setNotifications(!notifications)} className={`px-3 py-1 rounded-full text-xs font-medium ${notifications ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-500/20 text-slate-300'}`}>
            {notifications ? 'On' : 'Off'}
          </button>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-cyan-400" />
            <span className="text-white">Language</span>
          </div>
          <select className="bg-dark-bg border border-white/10 rounded-lg px-3 py-1 text-sm text-white">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-cyan-400" />
            <span className="text-white">Privacy</span>
          </div>
          <Link to="/privacy" className="text-sm text-cyan-400 hover:underline">View</Link>
        </div>
      </div>
    </div>
  );
}
