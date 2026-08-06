import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { User, Mail, LogOut, ArrowLeft, Download, Heart, Settings, Shield, Edit } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { showSuccess } = useNotification();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('vexastore_user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vexastore_user_token');
    localStorage.removeItem('vexastore_user');
    showSuccess('Logged out successfully');
    navigate('/');
  };

  if (!user) {
    return (
      <div className="glass-card p-8 text-center text-slate-400">
        <User size={48} className="mx-auto text-slate-600/30 mb-4" />
        <p className="text-lg font-medium text-slate-400">Not logged in</p>
        <Link to="/login" className="text-cyan-400 hover:underline mt-2 inline-block">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} /> Back
      </Link>

      <div className="glass-card p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 flex items-center justify-center border border-cyan-500/20">
            <span className="text-3xl font-bold text-cyan-400">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <p className="text-slate-400">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                {user.is_verified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">Account</h3>
        <Link to="/downloads" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition">
          <Download size={18} className="text-cyan-400" />
          <span className="text-white">My Downloads</span>
        </Link>
        <Link to="/favorites" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition">
          <Heart size={18} className="text-cyan-400" />
          <span className="text-white">Favorites</span>
        </Link>
        <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition">
          <Settings size={18} className="text-cyan-400" />
          <span className="text-white">Settings</span>
        </Link>
        <Link to="/profile/edit" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition">
          <Edit size={18} className="text-cyan-400" />
          <span className="text-white">Edit Profile</span>
        </Link>
        <Link to="/change-password" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition">
          <Shield size={18} className="text-cyan-400" />
          <span className="text-white">Change Password</span>
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="btn-danger w-full flex items-center justify-center gap-2 py-3"
      >
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}
