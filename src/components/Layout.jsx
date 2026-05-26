import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { HardHat, LayoutDashboard, FolderKanban, Camera, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/photos', icon: Camera, label: 'Photos' },
  { to: '/punch-list', icon: ClipboardCheck, label: 'Punch List' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <HardHat className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-serif text-lg font-semibold text-white">Foreman</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-sidebar z-40 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <HardHat className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-serif text-lg font-semibold text-white">Foreman</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background pt-0 lg:pt-0">
        <div className="lg:hidden h-14" />
        <div className="p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-sidebar border-t border-sidebar-border z-40">
        <div className="flex">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-sidebar-foreground'
                )
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
