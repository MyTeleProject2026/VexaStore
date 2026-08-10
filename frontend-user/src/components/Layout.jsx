import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Menu, X, Download, Smartphone, Phone, Monitor, Laptop, Terminal,
  Home, User, LogIn, Settings, Heart, Clock, Zap, ChevronDown,
  ChevronRight, Shield, Activity, Database, Trash2, LogOut,
  Edit2, AppWindow, Layers, Wifi, FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const checkAuth = () => {
    const token = localStorage.getItem('vexastore_user_token') ||
                  localStorage.getItem('userToken') ||
                  localStorage.getItem('token');
    const userData = localStorage.getItem('vexastore_user') ||
                     localStorage.getItem('user') ||
                     localStorage.getItem('userData');
    if (token && userData) {
      setIsLoggedIn(true);
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to parse user data');
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [location]);

  useEffect(() => {
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vexastore_user_token');
    localStorage.removeItem('userToken');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('vexastore_user');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
    checkAuth();
  };

  const categories = [
    { slug: 'ios', label: 'iOS', icon: Phone, color: 'text-blue-400' },
    { slug: 'android', label: 'Android', icon: Smartphone, color: 'text-green-400' },
    { slug: 'windows', label: 'Windows', icon: Monitor, color: 'text-cyan-400' },
    { slug: 'macos', label: 'macOS', icon: Laptop, color: 'text-purple-400' },
    { slug: 'linux', label: 'Linux', icon: Terminal, color: 'text-amber-400' },
  ];

  // ─── User Avatar ───
  const UserAvatar = ({ user, size = 'md' }) => {
    const sizeClass = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-12 h-12 text-lg';
    const name = user?.name || 'U';
    const avatarUrl = user?.avatar_url;

    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={name}
          className={`rounded-full object-cover border-2 border-cyan-500/20 ${sizeClass}`}
        />
      );
    }

    return (
      <div className={`rounded-full bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 flex items-center justify-center border-2 border-cyan-500/20 ${sizeClass}`}>
        <span className="font-bold text-cyan-400">{name.charAt(0).toUpperCase()}</span>
      </div>
    );
  };

  // ─── Sidebar Link ───
  const SidebarLink = ({ to, icon: Icon, label, onClick, isActive, className = '' }) => (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive: active }) => `
        flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm
        ${(isActive || active) ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-300 hover:bg-white/5'}
        ${className}
      `}
    >
      <Icon size={20} className="flex-shrink-0" />
      <span className="font-medium truncate">{label}</span>
    </NavLink>
  );

  // ─── Sidebar Button ───
  const SidebarButton = ({ icon: Icon, label, onClick, className = '' }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition text-sm ${className}`}
    >
      <Icon size={20} className="flex-shrink-0" />
      <span className="font-medium truncate">{label}</span>
    </button>
  );

  // ─── Sidebar Content ───
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* ─── User Profile Section ─── */}
      <div className="mb-4 pb-4 border-b border-white/5">
        <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)} className="block">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition">
            <UserAvatar user={user} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{user?.name || 'Guest'}</p>
              <p className="text-sm text-slate-500 truncate">{user?.email || 'Not signed in'}</p>
            </div>
          </div>
        </NavLink>
        {isLoggedIn && (
          <NavLink
            to="/profile/edit"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 ml-2 mt-1 text-xs text-cyan-400 hover:underline"
          >
            <Edit2 size={14} /> Edit Profile
          </NavLink>
        )}
      </div>

      {/* ─── Navigation Links ─── */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        <SidebarLink to="/" icon={Home} label="Home" onClick={() => setMobileMenuOpen(false)} />

        {/* ─── Categories ─── */}
        <div className="px-4 py-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">Categories</p>
        </div>
        {categories.map((cat) => (
          <SidebarLink
            key={cat.slug}
            to={`/category/${cat.slug}`}
            icon={cat.icon}
            label={cat.label}
            onClick={() => setMobileMenuOpen(false)}
          />
        ))}

        <div className="border-t border-white/5 my-2"></div>

        {/* ─── Security ─── */}
        <SidebarLink to="/settings/2fa" icon={Shield} label="Security" onClick={() => setMobileMenuOpen(false)} />

        {/* ─── Downloads ─── */}
        <SidebarLink to="/downloads" icon={Download} label="Downloads" onClick={() => setMobileMenuOpen(false)} />

        {/* ─── Favorites ─── */}
        <SidebarLink to="/favorites" icon={Heart} label="Favorites" onClick={() => setMobileMenuOpen(false)} />

        {/* ─── Settings (Expandable) ─── */}
        <div>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition text-sm text-slate-300 hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Settings size={20} className="flex-shrink-0" />
              <span className="font-medium">Settings</span>
            </div>
            {settingsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          {settingsOpen && (
            <div className="ml-6 space-y-1 border-l border-white/5 pl-3">
              <SidebarLink
                to="/settings/apps"
                icon={Layers}
                label="Connected Apps"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm"
              />
              <SidebarLink
                to="/settings/devices"
                icon={Wifi}
                label="Connected Devices"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm"
              />
              <SidebarLink
                to="/settings/activity"
                icon={Activity}
                label="Activity Log"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm"
              />
              <SidebarLink
                to="/settings/export"
                icon={Database}
                label="Data Export"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm"
              />
              <SidebarLink
                to="/settings/delete"
                icon={Trash2}
                label="Delete Account"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-red-400 hover:bg-red-500/10"
              />
            </div>
          )}
        </div>
      </nav>

      {/* ─── Logout Button (Bottom) ─── */}
      {isLoggedIn && (
        <div className="border-t border-white/5 pt-3 mt-auto">
          <SidebarButton
            icon={LogOut}
            label="Logout"
            onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
            className="text-red-400 hover:bg-red-500/10"
          />
        </div>
      )}
    </div>
  );

  // ─── Main Render ───
  return (
    <div className="min-h-screen bg-[#050812] text-white">
      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-40 bg-[#0a0e1a]/95 backdrop-blur-xl border-b border-white/5 shadow-lg safe-top">
        <div className="px-4 py-2 flex items-center justify-between gap-2">
          <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center border border-cyan-500/20">
              <Download size={18} className="text-cyan-400" />
            </div>
            <div>
              <span className="text-lg font-bold gradient-text">VexaStore</span>
            </div>
          </NavLink>

          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/search')}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
              <Search size={20} />
            </button>

            {isLoggedIn ? (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition"
              >
                <UserAvatar user={user} size="md" />
              </button>
            ) : (
              <NavLink
                to="/login"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <LogIn size={20} />
              </NavLink>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition lg:hidden"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ─── Mobile Search ─── */}
        <div className="px-4 pb-3 md:hidden">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps..."
              className="w-full rounded-2xl bg-[#050812]/80 border border-white/10 px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </form>
        </div>

        {/* ─── Category Tabs (Mobile) ─── */}
        <div className="px-4 pb-2 overflow-x-auto scrollbar-hide flex gap-2 md:hidden">
          {categories.map((cat) => (
            <NavLink
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className={({ isActive }) => `
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition
                ${isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <cat.icon size={14} className={cat.color} />
              {cat.label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* ─── Mobile Sidebar Drawer ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-[300px] h-full bg-[#0a0e1a] p-5 shadow-2xl border-r border-white/5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ─── Desktop Sidebar (Hidden on mobile) ─── */}
      <div className="hidden lg:flex gap-6 max-w-7xl mx-auto px-4 py-4">
        <aside className="w-[280px] flex-shrink-0 sticky top-20 h-[calc(100vh-100px)] overflow-y-auto">
          <div className="glass-card p-4 h-full">
            <SidebarContent />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* ─── Mobile Main Content ─── */}
      <div className="lg:hidden">
        <main className="max-w-7xl mx-auto px-4 py-4">
          <Outlet />
        </main>
      </div>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/5 md:hidden safe-bottom">
        <div className="flex items-center justify-around py-1">
          <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            <Home size={20} />
            <span className="text-[9px] font-medium">Home</span>
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            <AppWindow size={20} />
            <span className="text-[9px] font-medium">Apps</span>
          </NavLink>
          <NavLink to="/category/ios" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            <Menu size={20} />
            <span className="text-[9px] font-medium">Category</span>
          </NavLink>
          <NavLink to="/favorites" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            <Heart size={20} />
            <span className="text-[9px] font-medium">Favorites</span>
          </NavLink>
          <NavLink to="/downloads" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            <Download size={20} />
            <span className="text-[9px] font-medium">Downloads</span>
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            <Search size={20} />
            <span className="text-[9px] font-medium">Search</span>
          </NavLink>
        </div>
      </nav>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 bg-[#0a0e1a]/50 mt-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-cyan-400" />
            <span className="font-semibold gradient-text">VexaStore</span>
            <span>— Official App Hub of VexaTrade</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">About</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
