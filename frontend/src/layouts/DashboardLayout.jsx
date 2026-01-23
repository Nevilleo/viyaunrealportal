import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  LayoutDashboard, 
  Map, 
  Box, 
  Bell, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  Globe2,
  ChevronLeft,
  Menu,
  Car
} from 'lucide-react';
import { Button } from '../components/ui/button';

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overzicht', end: true },
    { to: '/dashboard/monitoring', icon: Map, label: 'Kaart' },
    { to: '/dashboard/vehicle', icon: Car, label: 'LCM Voertuig' },
    { to: '/dashboard/assets', icon: Box, label: 'Assets' },
    { to: '/dashboard/alerts', icon: Bell, label: 'Alerts' },
    { to: '/dashboard/reports', icon: BarChart3, label: 'Rapportages' },
    ...(user?.role === 'admin' ? [{ to: '/dashboard/users', icon: Users, label: 'Gebruikers' }] : []),
    { to: '/dashboard/settings', icon: Settings, label: 'Instellingen' },
  ];

  const roleLabels = {
    admin: 'Administrator',
    manager: 'Manager',
    veldwerker: 'Veldwerker'
  };

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-layout">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-strong z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-primary/20 flex items-center justify-center">
            <Globe2 className="w-4 h-4 text-primary" />
          </div>
          <span className="font-heading font-bold text-sm">DIGITAL DELTA</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="mobile-menu-btn"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 bg-slate-950 dark:bg-slate-950 border-r border-white/10 z-50 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ backgroundColor: 'hsl(var(--card))' }}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-primary/20 flex items-center justify-center border border-primary/30 flex-shrink-0">
              <Globe2 className="w-5 h-5 text-primary" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <span className="font-heading font-bold text-sm tracking-tight block">DIGITAL DELTA</span>
                <span className="text-[10px] font-mono text-muted-foreground tracking-widest">RWS • LCM</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            data-testid="collapse-sidebar-btn"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-mono border-l-2 transition-all ${
                  isActive
                    ? 'text-primary bg-primary/5 border-l-primary'
                    : 'text-muted-foreground hover:text-primary hover:bg-white/5 border-transparent hover:border-primary/50'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`
              }
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="tracking-wider uppercase text-xs">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-white/10">
          {!sidebarCollapsed && (
            <div className="mb-3">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs font-mono text-muted-foreground">{roleLabels[user?.role] || user?.role}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${
              sidebarCollapsed ? 'w-full justify-center p-2' : 'w-full justify-start'
            }`}
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span className="ml-2 text-xs uppercase tracking-wider">Uitloggen</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 pt-16 lg:pt-0 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
