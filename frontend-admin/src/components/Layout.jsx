import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  Download,
  Menu,
  X,
  Users,
  Tag,
  Newspaper,
  Palette,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/apps', label: 'Apps', icon: Package },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Site Settings', icon: Palette },
  { to: '/maintenance', label: 'Maintenance', icon: Shield },
];

export default function Layout({ onLogout, children }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-[#050812]">
      {/* ─── Mobile Menu Button ─── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-2xl glass-card text-white"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ─── Sidebar ─── */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 w-[280px] h-screen
          glass-card rounded-none border-r border-white/5
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          overflow-y-auto overflow-x-hidden
          flex flex-col
        `}
      >
        <div className="flex-shrink-0 p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Download size={20} className="text-cyan-400" />
            </div>
            <div>
              <span className="text-lg font-bold gradient-text">VexaStore</span>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-sm
                ${isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-text-secondary hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span className="font-medium truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex-shrink-0 border-t border-white/5 p-3 space-y-2">
          <div className="px-4 py-2 rounded-2xl bg-white/5">
            <p className="text-xs font-semibold text-white">VexaTrade Ecosystem</p>
            <p className="text-[10px] text-text-secondary">v2.0.0</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden w-full min-w-0">
        <div className="max-w-7xl mx-auto w-full">
          <div className="lg:hidden h-14"></div>
          {children}
        </div>
      </main>

      {/* ─── Mobile Overlay ─── */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
