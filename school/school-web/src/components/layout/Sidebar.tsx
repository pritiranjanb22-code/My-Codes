'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Badge';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Building2,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardList,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  School,
  Award,
  FileText,
  Home,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER', 'PARENT'] },
  { name: 'Schools', href: '/schools', icon: Building2, roles: ['SUPER_ADMIN'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['SUPER_ADMIN', 'HEADMASTER'] },
  { name: 'Students', href: '/students', icon: GraduationCap, roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER', 'PARENT'] },
  { name: 'Teachers', href: '/teachers', icon: UserPlus, roles: ['SUPER_ADMIN', 'HEADMASTER'] },
  { name: 'Parents', href: '/parents', icon: Users, roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER'] },
  { name: 'Classes', href: '/classes', icon: BookOpen, roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER'] },
  { name: 'Attendance', href: '/attendance', icon: ClipboardList, roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER', 'PARENT'] },
  { name: 'Exams', href: '/exams', icon: FileText, roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER'] },
  { name: 'Results', href: '/marks', icon: Award, roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER', 'PARENT'] },
  { name: 'Holidays', href: '/holidays', icon: Calendar, roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER', 'PARENT'] },
  { name: 'Announcements', href: '/announcements', icon: Bell, roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER', 'PARENT'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'HEADMASTER'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'HEADMASTER'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { currentSchool } = useSchool();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNav = navigation.filter((item) => 
    !user || item.roles.includes(user.role)
  );

  if (!user) return null;

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <School className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">SchoolMS</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {currentSchool && !collapsed && (
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current School</p>
            <p className="text-sm font-medium text-gray-900 truncate">{currentSchool.name}</p>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.name : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" src={user.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}