'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  FiChevronRight,
  FiHome, 
  FiUser, 
  FiCalendar, 
  FiFileText, 
  FiUsers, 
  FiMessageCircle,
  FiLogOut,
  FiX,
  FiMenu
} from 'react-icons/fi';
import { useState, useEffect } from 'react';

interface PatientSidebarProps {
  user: any;
  logout: () => void;
}

const PatientSidebar = ({ user, logout }: PatientSidebarProps) => {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      ?.map((n: string) => n[0])
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2) || 'U';
  };

  const menu = [
    { href: '/patient/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/patient/doctors', label: 'Doctors', icon: FiUsers },
    { href: '/patient/appointments', label: 'Appointments', icon: FiCalendar },
    { href: '/patient/chat', label: 'Chats', icon: FiMessageCircle },
    { href: '/patient/prescriptions', label: 'Prescriptions', icon: FiFileText },
    { href: '/patient/profile', label: 'My Profile', icon: FiUser },
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-teal-600 text-white rounded-lg shadow-lg"
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
        ${sidebarCollapsed ? 'w-16' : 'w-64'} 
        bg-teal-600 text-white transition-all duration-300 
        fixed left-0 top-0 h-full z-40 lg:z-20
      `}>
        <div className="p-4 h-full flex flex-col overflow-y-auto">
          {/* Collapse/Expand Button - Desktop only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 hover:bg-teal-700 rounded-lg transition-colors mb-4"
          >
            <FiChevronRight className={`text-xl transform transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>

          {/* Close Button - Mobile only */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden w-full flex items-center justify-end p-2 hover:bg-teal-700 rounded-lg transition-colors mb-4"
          >
            <FiX className="text-xl" />
          </button>

        {/* Logo */}
        {!sidebarCollapsed && (
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="MediWise Logo" className="w-10 h-10 object-contain" onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }} />
              <span className="text-xl font-bold">MediWise</span>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="flex items-center justify-center mb-6">
            <img src="/logo.png" alt="MediWise Logo" className="w-10 h-10 object-contain" onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }} />
          </div>
        )}

        {/* Patient Profile Section */}
        {!sidebarCollapsed && (
          <div className="mb-6 pb-6 border-b border-teal-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-sm font-semibold">
                {getInitials(user?.name || 'P')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-teal-200 capitalize">Patient</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1 flex-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-700 text-white font-semibold'
                    : 'text-teal-100 hover:bg-teal-700 hover:text-white'
                }`}
              >
                <Icon className="text-xl flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button - Bottom and Centered */}
        {!sidebarCollapsed && (
          <div className="mt-auto pt-4 pb-4">
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-teal-100 hover:bg-teal-700 transition-colors"
            >
              <FiLogOut className="text-xl" />
              <span className="text-sm font-semibold">LOGOUT</span>
            </button>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="mt-auto pt-4 pb-4">
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center p-3 rounded-lg text-teal-100 hover:bg-teal-700 transition-colors"
            >
              <FiLogOut className="text-xl" />
            </button>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default PatientSidebar;
