'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  FiHome, 
  FiUser, 
  FiCalendar, 
  FiFileText, 
  FiUsers, 
  FiSettings,
  FiLogOut,
  FiMessageCircle
} from 'react-icons/fi';

const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

      const patientMenu = [
        { href: '/patient/dashboard', label: 'Dashboard', icon: FiHome },
        { href: '/patient/doctors', label: 'Doctors', icon: FiUsers },
        { href: '/patient/appointments', label: 'Appointments', icon: FiCalendar },
        { href: '/patient/chat', label: 'Chats', icon: FiMessageCircle },
        { href: '/patient/prescriptions', label: 'Prescriptions', icon: FiFileText },
        { href: '/patient/profile', label: 'My Profile', icon: FiUser },
      ];

  const doctorMenu = [
    { href: '/doctor/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/doctor/appointments', label: 'Appointments', icon: FiCalendar },
    { href: '/doctor/prescriptions', label: 'Prescriptions', icon: FiFileText },
    { href: '/doctor/profile', label: 'Edit Profile', icon: FiUser },
  ];

  const adminMenu = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/admin/doctors', label: 'Doctors', icon: FiUsers },
    { href: '/admin/appointments', label: 'Appointments', icon: FiCalendar },
    { href: '/admin/prescriptions', label: 'Prescriptions', icon: FiFileText },
    { href: '/admin', label: 'Admin Panel', icon: FiSettings },
  ];

  const menu = user?.role === 'patient' ? patientMenu : 
               user?.role === 'doctor' ? doctorMenu : 
               adminMenu;

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-10">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="MediWise Logo" className="w-8 h-8 object-contain" onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }} />
          <h1 className="text-2xl font-bold text-teal-600">MediWise</h1>
        </div>
      </div>
      <nav className="p-4 space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="text-xl" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="p-4 border-t border-gray-200">
          <div className="mb-3 px-4">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <FiLogOut className="text-xl" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;







