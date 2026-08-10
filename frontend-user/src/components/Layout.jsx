import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Menu, X, Download, Smartphone, Phone, Monitor, Laptop, Terminal,
  Home, User, LogIn, Settings, Heart, Clock, Zap, ChevronDown
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

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
              <NavLink
                to="/profile"
                className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition"
              >
                <User size={20} />
              </NavLink>
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
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
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

      {/* ─── Mobile Navigation Drawer ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-[280px] h-full bg-[#0a0e1a] p-5 shadow-2xl border-r border-white/5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoggedIn && user ? (
              <div className="mb-5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 flex items-center justify-center border border-cyan-500/20">
                    <span className="text-lg font-bold text-cyan-400">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{user.name}</p>
                    <p className="text-sm text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-5 pb-4 border-b border-white/5">
                <p className="text-sm text-slate-400 mb-3">Sign in to access your downloads</p>
                <div className="flex gap-2">
                  <NavLink to="/login" className="flex-1 btn-primary text-center text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </NavLink>
                  <NavLink to="/register" className="flex-1 btn-secondary text-center text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
                    Register
                  </NavLink>
                </div>
              </div>
            )}

            <nav className="space-y-1">
              <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-white/5'}`} onClick={() => setMobileMenuOpen(false)}>
                <Home size={20} /> Home
              </NavLink>
              {categories.map((cat) => (
                <NavLink key={cat.slug} to={`/category/${cat.slug}`} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-white/5'}`} onClick={() => setMobileMenuOpen(false)}>
                  <cat.icon size={20} className={cat.color} /> {cat.label}
                </NavLink>
              ))}
              {isLoggedIn && (
                <>
                  <NavLink to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 transition" onClick={() => setMobileMenuOpen(false)}>
                    <User size={20} /> Profile
                  </NavLink>
                  <NavLink to="/downloads" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 transition" onClick={() => setMobileMenuOpen(false)}>
                    <Download size={20} /> My Downloads
                  </NavLink>
                  <NavLink to="/favorites" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 transition" onClick={() => setMobileMenuOpen(false)}>
                    <Heart size={20} /> Favorites
                  </NavLink>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition text-left"
                  >
                    <LogIn size={20} /> Logout
                  </button>
                </>
              )}
            </nav>

            <div className="absolute bottom-6 left-6 right-6 border-t border-white/5 pt-4">
              <p className="text-[10px] text-slate-600 text-center">VexaTrade Blockchain Ecosystem</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <Outlet />
      </main>

      {/* ─── Bottom Navigation ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/5 md:hidden safe-bottom">
        <div className="flex items-center justify-around py-2">
          <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            <Home size={22} />
            <span className="text-[10px] font-medium">Home</span>
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            <Search size={22} />
            <span className="text-[10px] font-medium">Search</span>
          </NavLink>
          <NavLink to="/downloads" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            <Download size={22} />
            <span className="text-[10px] font-medium">Downloads</span>
          </NavLink>
          <NavLink to={isLoggedIn ? "/profile" : "/login"} className={({ isActive }) => `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            <User size={22} />
            <span className="text-[10px] font-medium">{isLoggedIn ? 'Profile' : 'Login'}</span>
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
