'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  FiHome, 
  FiUser, 
  FiCalendar, 
  FiUsers, 
  FiLogOut,
  FiMessageCircle,
  FiShoppingBag,
  FiX,
  FiMenu,
  FiLayers,
  FiBook
} from 'react-icons/fi';
import { useState, useEffect } from 'react';

interface AdminSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const AdminSidebar = ({ activeSection, onSectionChange }: AdminSidebarProps) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainMenu = [
    { href: '/admin/dashboard', label: 'Overview', icon: FiHome },
    { href: '/admin/patients', label: 'Patient', icon: FiUsers },
    { href: '/admin/appointments', label: 'Appointment', icon: FiCalendar },
  ];

  const otherMenu = [
    { href: '/admin/doctors', label: 'Doctors', icon: FiUser },
    { href: '/admin/departments', label: 'Department', icon: FiLayers },
    { href: '/admin/ads', label: 'Ad Management', icon: FiShoppingBag },
    { href: '/admin/blogs', label: 'Blog Approval', icon: FiBook },
    { href: '/admin/chats', label: 'Chats', icon: FiMessageCircle },
  ];

  const helpSettings: Array<{ href: string; label: string; icon: any }> = [];

  const menuSections = [
    { title: 'MAIN MENU', items: mainMenu },
    { title: 'OTHER MENU', items: otherMenu },
  ];

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      ?.map((n: string) => n[0])
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2) || 'A';
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {mobileMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-40 lg:z-10 border-r border-gray-200 dark:border-gray-700 transition-all duration-300
      `}>
      {/* Logo Section */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MediWise Logo" className="w-10 h-10 object-contain" onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }} />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">MediWise</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Healthcare Management</p>
            </div>
          </div>
          {/* Close Button - Mobile only */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiX className="text-xl text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="p-3 sm:p-4 space-y-4 sm:space-y-6 overflow-y-auto h-[calc(100vh-180px)]">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-4">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                // Use activeSection if provided, otherwise use pathname
                const isActive = activeSection 
                  ? activeSection === item.href 
                  : (pathname === item.href || pathname?.startsWith(item.href + '/') || pathname?.includes(item.href));
                
                const handleClick = (e: React.MouseEvent) => {
                  // Only use onSectionChange for pages that are rendered in dashboard
                  // For other pages, let Link handle navigation normally
                  const dashboardPages = [
                    '/admin/dashboard',
                    '/admin/users',
                    '/admin/doctors',
                    '/admin/appointments',
                    '/admin/chats',
                    '/admin/prescriptions',
                    '/admin/ads'
                  ];
                  
                  if (onSectionChange && dashboardPages.includes(item.href)) {
                    e.preventDefault();
                    onSectionChange(item.href);
                  }
                  // Otherwise, let Link handle navigation normally to separate pages
                };

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-teal-600 rounded-l"></div>
                    )}
                    <Icon className="text-xl" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Profile Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
        <div className="mb-3 px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              {getInitials(user?.name || 'Admin')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Super admin</p>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
        >
          <FiLogOut className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
      </div>
    </>
  );
};

export default AdminSidebar;
