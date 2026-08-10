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
