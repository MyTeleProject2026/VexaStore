import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Download, Smartphone, Apple, Monitor, Terminal, Home, Zap, Shield, Globe } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const categories = [
    { slug: 'ios', label: 'iOS', icon: Apple, color: 'text-blue-400' },
    { slug: 'android', label: 'Android', icon: Smartphone, color: 'text-green-400' },
    { slug: 'windows', label: 'Windows', icon: Monitor, color: 'text-cyan-400' },
    { slug: 'macos', label: 'macOS', icon: Apple, color: 'text-purple-400' },
    { slug: 'linux', label: 'Linux', icon: Terminal, color: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-[#050812] text-white">
      {/* Top Bar - Improved with gradient border */}
      <header className="sticky top-0 z-40 bg-[#0a0e1a]/95 backdrop-blur-xl border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-slate-400 hover:text-white transition p-2 rounded-xl hover:bg-white/5"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <NavLink to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center border border-cyan-500/20 group-hover:border-cyan-500/40 transition">
                <Download size={20} className="text-cyan-400" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">VexaStore</span>
                <span className="hidden md:inline-block text-[10px] text-slate-500 ml-2 font-medium tracking-wider uppercase">App Hub</span>
              </div>
            </NavLink>
          </div>

          {/* Search Bar (desktop) - Improved */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for apps, games, and more..."
                className="w-full rounded-2xl bg-[#050812]/80 border border-white/10 px-5 py-3 pl-12 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <NavLink to="/search" className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition">
              <Search size={22} />
            </NavLink>
            <div className="hidden md:flex items-center gap-1 text-xs text-slate-500">
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar - Improved */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps..."
              className="w-full rounded-2xl bg-[#050812]/80 border border-white/10 px-5 py-3 pl-12 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition"
            />
          </form>
        </div>
      </header>

      {/* Mobile Navigation Drawer - Improved */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-[#050812]/90 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-80 bg-[#0a0e1a] h-full p-6 shadow-2xl border-r border-white/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                <Download size={20} className="text-cyan-400" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">VexaStore</span>
                <p className="text-[10px] text-slate-500">App Hub</p>
              </div>
            </div>
            <nav className="space-y-1">
              <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-white/5'}`} onClick={() => setMobileMenuOpen(false)}>
                <Home size={20} /> Home
              </NavLink>
              {categories.map((cat) => (
                <NavLink key={cat.slug} to={`/category/${cat.slug}`} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-white/5'}`} onClick={() => setMobileMenuOpen(false)}>
                  <cat.icon size={20} className={cat.color} /> {cat.label}
                </NavLink>
              ))}
            </nav>
            <div className="absolute bottom-6 left-6 right-6 border-t border-white/5 pt-4">
              <p className="text-[10px] text-slate-600 text-center">VexaTrade Blockchain Ecosystem</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer - Improved Design */}
      <footer className="border-t border-white/5 bg-[#0a0e1a]/80 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Download size={18} className="text-cyan-400" />
                <span className="font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">VexaStore</span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs">
                The Official App Hub of the VexaTrade Blockchain Ecosystem. Download verified apps for all platforms.
              </p>
              <div className="flex gap-3 mt-3">
                <span className="text-xs text-slate-600">🔒 Secure</span>
                <span className="text-xs text-slate-600">⚡ Fast</span>
                <span className="text-xs text-slate-600">🌐 Blockchain</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Platforms</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-cyan-400 transition">iOS Apps</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Android Apps</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Windows Apps</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">macOS Apps</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Linux Apps</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-cyan-400 transition">About VexaTrade</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Blockchain Ecosystem</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Careers</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-cyan-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
            <span>© 2026 VexaStore — The Official App Hub of VexaTrade Blockchain Ecosystem</span>
            <span>Powered by <span className="text-cyan-400">VexaTrade</span> Blockchain</span>
          </div>
        </div>
      </footer>
    </div>
  );
}