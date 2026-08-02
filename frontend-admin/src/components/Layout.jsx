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
  Smartphone,
  Apple,
  Window,
  Linux,
} from 'lucide-react';
import { useState } from 'react';

export default function Layout({ onLogout, children }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/apps', label: 'Apps', icon: Package },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/maintenance', label: 'Maintenance', icon: Shield },
  ];
  
  const handleLogout = () => {
    onLogout();
    navigate('/');
  };
  
  return (
    <div className="flex min-h-screen bg-dark-bg">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-dark-card border border-dark-border text-white"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-dark-card border-r border-dark-border
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full p-4">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <Download size={18} className="text-accent-primary" />
            </div>
            <div>
              <span className="text-lg font-bold gradient-text">VexaStore</span>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition
                  ${isActive 
                    ? 'bg-accent-primary/10 text-accent-primary' 
                    : 'text-text-secondary hover:bg-dark-bg/50 hover:text-white'
                  }
                `}
              >
                <item.icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Bottom */}
          <div className="border-t border-dark-border pt-4 space-y-2">
            <div className="px-4 py-2 text-xs text-text-secondary">
              <p className="font-semibold text-white">VexaTrade Ecosystem</p>
              <p>v1.0.0</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}