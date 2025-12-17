'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { 
  FiSearch, 
  FiBell, 
  FiSettings, 
  FiCalendar, 
  FiChevronDown,
  FiPlus,
  FiFilter,
  FiFlag,
  FiX,
  FiMoon,
  FiSun,
  FiVolume2,
  FiVolumeX,
  FiGlobe,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

interface AdminHeaderProps {
  title: string;
  backButton?: boolean;
  onBack?: () => void;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  filterButton?: {
    onClick: () => void;
  };
  onQuickAdd?: {
    onAddUser?: () => void;
    onAddDoctor?: () => void;
    onAddAppointment?: () => void;
    onAddAdvertisement?: () => void;
  };
}

const AdminHeader = ({
  title,
  backButton = false,
  onBack,
  searchPlaceholder = 'Search for anything here...',
  onSearch,
  actionButton,
  filterButton,
  onQuickAdd,
}: AdminHeaderProps) => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [notifications] = useState([
    { id: 1, title: 'New appointment request', message: 'Dr. Smith has a new appointment', time: '2 min ago', read: false },
    { id: 2, title: 'System update', message: 'Scheduled maintenance tonight', time: '1 hour ago', read: false },
  ]);
  const [flaggedItems] = useState(4);
  const [completedFlags] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      ?.map((n: string) => n[0])
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2) || 'A';
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showUserMenu || showNotifications || showSettings || showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showNotifications, showSettings, showCalendar]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const handleProfileSettings = () => {
    setShowUserMenu(false);
    // Navigate to profile page based on user role
    if (user?.role === 'admin') {
      // Admin should stay on dashboard - profile settings can be shown via modal or section
      // For now, just show a notification that admin profile management is available in dashboard
      showNotification('Admin profile settings are available in the dashboard', 'info');
      // Don't navigate away - admin should stay on current page
      return;
    } else if (user?.role === 'patient') {
      router.push('/profile');
    } else if (user?.role === 'doctor') {
      router.push('/doctor/profile');
    } else {
      router.push('/dashboard');
    }
  };

  const handleAccountSettings = () => {
    setShowUserMenu(false);
    // For admin, account settings can be managed in dashboard
    if (user?.role === 'admin') {
      showNotification('Account settings are available in the dashboard', 'info');
      // Don't navigate away
      return;
    }
    // For other roles, navigate to settings page if exists
    // router.push('/settings'); // Uncomment when settings page is created
    showNotification('Settings page coming soon', 'info');
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    // Show confirmation using notification - user can proceed with logout
    if (window.confirm('Are you sure you want to logout?')) {
      showNotification('Logging out...', 'info');
      setTimeout(() => {
        logout();
      }, 500);
    }
  };

  const [quickAddMenu, setQuickAddMenu] = useState(false);
  const quickAddRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setQuickAddMenu(false);
      }
    };
    if (quickAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [quickAddMenu]);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4 sticky top-0 z-20 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left Section - Title and Back Button */}
        <div className="flex items-center gap-4">
          {backButton && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {title ? (t(title.toLowerCase().replace(/\s+/g, '_')) || title) : 'Admin Dashboard'}
          </h1>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Section - Actions and User */}
        <div className="flex items-center gap-4">
          {actionButton && (
            <button
              onClick={actionButton.onClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {actionButton.icon || <FiPlus className="text-lg" />}
              {actionButton.label}
            </button>
          )}
          
          {filterButton && (
            <button
              onClick={filterButton.onClick}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <FiFilter className="text-lg" />
              Filters
            </button>
          )}

          {/* Quick Add Button */}
          <div className="relative" ref={quickAddRef}>
            <button 
              onClick={() => setQuickAddMenu(!quickAddMenu)}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiPlus className="text-xl text-gray-600 dark:text-gray-300" />
            </button>
            {quickAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <button 
                  onClick={() => {
                    setQuickAddMenu(false);
                    if (onQuickAdd?.onAddUser) {
                      onQuickAdd.onAddUser();
                    } else {
                      router.push('/admin/users');
                      showNotification('Navigate to Users section', 'info');
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Add User
                </button>
                <button 
                  onClick={() => {
                    setQuickAddMenu(false);
                    if (onQuickAdd?.onAddDoctor) {
                      onQuickAdd.onAddDoctor();
                    } else {
                      router.push('/admin/doctors');
                      showNotification('Navigate to Doctors section', 'info');
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Add Doctor
                </button>
                <button 
                  onClick={() => {
                    setQuickAddMenu(false);
                    if (onQuickAdd?.onAddAppointment) {
                      onQuickAdd.onAddAppointment();
                    } else {
                      router.push('/admin/appointments');
                      showNotification('Navigate to Appointments section', 'info');
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Add Appointment
                </button>
                <button 
                  onClick={() => {
                    setQuickAddMenu(false);
                    if (onQuickAdd?.onAddAdvertisement) {
                      onQuickAdd.onAddAdvertisement();
                    } else {
                      router.push('/admin/ads');
                      showNotification('Navigate to Advertisements section', 'info');
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Add Advertisement
                </button>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiBell className="text-xl text-gray-600 dark:text-gray-300" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-96 overflow-y-auto">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Mark all as read</button>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{notification.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <button className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <div className="relative" ref={settingsRef}>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiSettings className="text-xl text-gray-600 dark:text-gray-300" />
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Settings</h3>
                    <button 
                      onClick={() => setShowSettings(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <FiX className="text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  {/* Dark Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? (
                        <FiMoon className="text-xl text-gray-600 dark:text-gray-300" />
                      ) : (
                        <FiSun className="text-xl text-gray-600 dark:text-gray-300" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t('dark_mode')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('toggle_dark_theme')}</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Language Settings */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiGlobe className="text-xl text-gray-600 dark:text-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t('language')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('choose_language')}</p>
                      </div>
                    </div>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'en' | 'bn' | 'hi')}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
                    >
                      <option value="en">English</option>
                      <option value="bn">বাংলা</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>

                  {/* Notification Sound */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiVolume2 className="text-xl text-gray-600 dark:text-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t('notification_sound')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('enable_sound_alerts')}</p>
                      </div>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-blue-600 relative">
                      <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>

                  {/* Auto-refresh */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t('auto_refresh')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('auto_refresh_desc')}</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-blue-600 relative">
                      <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>

                  {/* Data Preferences */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">{t('data_preferences')}</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{t('save_search_history')}</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{t('enable_analytics')}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Calendar Button */}
          <div className="relative" ref={calendarRef}>
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiCalendar className="text-xl text-gray-600 dark:text-gray-300" />
            </button>
            {showCalendar && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t('calendar')}</h3>
                  <button 
                    onClick={() => setShowCalendar(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <FiX className="text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                
                {/* Calendar Widget */}
                <div>
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <FiChevronLeft className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {currentDate.toLocaleDateString(language === 'bn' ? 'bn-BD' : language === 'hi' ? 'hi-IN' : 'en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <FiChevronRight className="text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center py-1">{day}</div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth();
                      const firstDay = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const today = new Date();
                      
                      const days = [];
                      
                      // Empty cells for days before month starts
                      for (let i = 0; i < firstDay; i++) {
                        days.push(<div key={`empty-${i}`} className="h-8"></div>);
                      }
                      
                      // Days of the month
                      for (let day = 1; day <= daysInMonth; day++) {
                        const date = new Date(year, month, day);
                        const isToday = date.toDateString() === today.toDateString();
                        const isCurrentMonth = date.getMonth() === month;
                        
                        days.push(
                          <button
                            key={day}
                            className={`h-8 w-8 rounded text-xs font-medium transition-colors ${
                              isToday
                                ? 'bg-blue-600 text-white dark:bg-blue-500'
                                : isCurrentMonth
                                ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                : 'text-gray-400 dark:text-gray-600'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      }
                      
                      return days;
                    })()}
                  </div>

                  {/* Today Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setCurrentDate(new Date());
                        showNotification(t('calendar_today'), 'info');
                      }}
                      className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t('today')}
                    </button>
                  </div>

                  {/* Current Date Display */}
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('today')}: {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Flagged Items Button */}
          <button 
            onClick={() => showNotification(`${t('flagged_items') || 'Flagged items'}: ${completedFlags}/${flaggedItems}`, 'info')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
          >
            <FiFlag className="text-xl text-gray-600 dark:text-gray-300" />
            <span className="text-sm text-gray-600 dark:text-gray-300">{completedFlags}/{flaggedItems}</span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {getInitials(user?.name || 'Admin')}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Super admin</p>
              </div>
              <FiChevronDown className={`text-gray-600 dark:text-gray-300 hidden md:block transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <button
                  onClick={handleProfileSettings}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Profile Settings
                </button>
                <button
                  onClick={handleAccountSettings}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Account Settings
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
