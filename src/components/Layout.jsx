import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { HardHat, LayoutDashboard, FolderKanban, Camera, ClipboardCheck, LogOut, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole, ROLES } from '@/lib/RoleContext';

export default function Layout() {
  const { role, roleInfo, switchRole, isManagement, isSales, isConstruction } = useRole();
  const RoleIcon = roleInfo?.icon;

  // Build nav items based on role
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true, show: true },
    // Sales Leads — visible to sales and management
    { to: '/sales-leads', icon: TrendingUp, label: 'Sales Leads', show: isManagement || isSales },
    // Projects — management sees all; construction sees their jobs; sales doesn't need this separately
    { to: '/projects', icon: FolderKanban, label: isConstruction ? 'Projects' : 'All Projects', show: isManagement || isConstruction },
    { to: '/photos', icon: Camera, label: 'Photos', show: isManagement || isConstruction },
    { to: '/punch-list', icon: ClipboardCheck, label: 'Punch List', show: isManagement || isConstruction },
  ].filter(item => item.show);

  const NavItem = ({ to, icon: Icon, label, exact }) => (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )
      }
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </NavLink>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar text-sidebar-foreground">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
          <div className="w-7 h-7 bg-primary flex items-center justify-center">
            <HardHat className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-serif text-lg font-semibold text-white">Foreman</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* Role badge + switch */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-sidebar-accent">
            {RoleIcon && (
              <RoleIcon className="w-4 h-4 shrink-0" style={{ color: roleInfo.accent }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground">{roleInfo?.label}</p>
              <p className="text-[10px] text-sidebar-foreground/50">Current role</p>
            </div>
            <button
              onClick={switchRole}
              title="Switch role"
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-sidebar z-40 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary flex items-center justify-center">
            <HardHat className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-serif text-lg font-semibold text-white">Foreman</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {RoleIcon && (
            <span
              className="text-xs font-medium px-2 py-0.5 border"
              style={{ color: roleInfo.accent, borderColor: roleInfo.accent + '40' }}
            >
              {roleInfo.label}
            </span>
          )}
          <button onClick={switchRole} className="text-white/50 hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="lg:hidden h-14" />
        <div className="p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
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
              <span className="truncate max-w-full px-1">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
