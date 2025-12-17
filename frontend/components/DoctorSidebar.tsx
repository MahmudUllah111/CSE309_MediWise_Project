'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  FiMenu,
  FiBook
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { formatDoctorName } from '@/utils/doctorName';

interface DoctorSidebarProps {
  user: any;
  logout: () => void;
  qualification?: string;
}

const DoctorSidebar = ({ user, logout, qualification }: DoctorSidebarProps) => {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      ?.map((n: string) => n[0])
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2) || 'D';
  };

  const menu = [
    { href: '/doctor/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/doctor/appointments', label: 'Appointments', icon: FiCalendar },
    { href: '/doctor/prescriptions', label: 'Prescriptions', icon: FiFileText },
    { href: '/doctor/patients', label: 'Patients', icon: FiUsers },
    { href: '/doctor/chat', label: 'Chats', icon: FiMessageCircle },
    { href: '/doctor/blogs', label: 'My Blogs', icon: FiBook },
    { href: '/doctor/profile', label: 'My Profile', icon: FiUser },
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
        fixed lg:left-[220px] left-0 top-0 h-full z-40 lg:z-30
      `}>
        <div className="h-full flex flex-col">
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5">
              

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

              {/* Doctor Profile Section */}
              {!sidebarCollapsed && (
                <div className="mb-4 pb-4 border-b border-teal-500">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-sm font-semibold shrink-0">
                      {getInitials(user?.name || 'D')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{formatDoctorName(user?.name || '', qualification)}</p>
                      <p className="text-xs text-teal-200 capitalize">Doctor</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="space-y-1">
                {menu.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const isMyProfile = item.href === '/doctor/profile';
                  
                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-teal-700 text-white font-semibold'
                            : 'text-teal-100 hover:bg-teal-700 hover:text-white'
                        }`}
                      >
                        <Icon className="text-xl shrink-0" />
                        {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                      </Link>
                      
                      {/* Logout Button - Directly Below My Profile with No Gap */}
                      {isMyProfile && (
                        <div className="mt-0">
                          {!sidebarCollapsed && (
                            <button 
                              onClick={logout}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors font-bold shadow-lg"
                            >
                              <FiLogOut className="text-xl" />
                              <span className="text-sm">LOGOUT</span>
                            </button>
                          )}
                          {sidebarCollapsed && (
                            <button 
                              onClick={logout}
                              className="w-full flex items-center justify-center p-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors shadow-lg mt-1"
                              title="Logout"
                            >
                              <FiLogOut className="text-xl" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorSidebar;