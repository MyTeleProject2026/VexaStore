import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Download, Smartphone, Laptop, Apple, Monitor, Linux, Home } from 'lucide-react';
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
    { slug: 'ios', label: 'iOS', icon: Apple },
    { slug: 'android', label: 'Android', icon: Smartphone },
    { slug: 'windows', label: 'Windows', icon: Monitor }, // ← Changed to Monitor
    { slug: 'macos', label: 'macOS', icon: Apple },
    { slug: 'linux', label: 'Linux', icon: Linux },
  ];
  
  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-dark-card/90 backdrop-blur-sm border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-text-secondary hover:text-white transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
                <Download size={18} className="text-accent-primary" />
              </div>
              <span className="text-xl font-bold gradient-text">VexaStore</span>
            </NavLink>
          </div>

          {/* Search Bar (desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps..."
                className="w-full rounded-xl bg-dark-bg border border-dark-border px-4 py-2.5 pl-10 text-sm text-white placeholder-text-secondary focus:border-accent-primary outline-none transition"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            </div>
          </form>

          <NavLink to="/search" className="md:hidden text-text-secondary hover:text-white transition">
            <Search size={22} />
          </NavLink>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps..."
              className="w-full rounded-xl bg-dark-bg border border-dark-border px-4 py-2.5 pl-10 text-sm text-white placeholder-text-secondary focus:border-accent-primary outline-none transition"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          </form>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-dark-bg/90 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-72 bg-dark-card h-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <Download size={24} className="text-accent-primary" />
              <span className="text-xl font-bold gradient-text">VexaStore</span>
            </div>
            <nav className="space-y-1">
              <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-dark-bg/50'}`} onClick={() => setMobileMenuOpen(false)}>
                <Home size={20} /> Home
              </NavLink>
              {categories.map((cat) => (
                <NavLink key={cat.slug} to={`/category/${cat.slug}`} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-dark-bg/50'}`} onClick={() => setMobileMenuOpen(false)}>
                  <cat.icon size={20} /> {cat.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border bg-dark-card/50 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-accent-primary" />
            <span className="font-semibold gradient-text">VexaStore</span>
            <span>— The Official App Hub of VexaTrade Blockchain Ecosystem</span>
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