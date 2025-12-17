'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import Loading from '@/components/Loading';
import { FiSettings, FiSave, FiBell, FiShield, FiDatabase, FiMail } from 'react-icons/fi';

export default function AdminSettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [settings, setSettings] = useState({
    siteName: 'MediWise',
    siteEmail: 'info@mediwise.com',
    notifications: true,
    emailNotifications: true,
    autoBackup: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, authLoading, router]);

  const handleSave = async () => {
    // In a real app, you'd save to backend
    showNotification('Settings saved successfully', 'success');
  };

  if (authLoading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar user={user} logout={logout} />
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        <AdminHeader title="Settings" />

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            {/* General Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300">
              <div className="flex items-center gap-3 mb-6">
                <FiSettings className="text-2xl text-teal-600" />
                <h2 className="text-xl font-bold text-gray-900">General Settings</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Email
                  </label>
                  <input
                    type="email"
                    value={settings.siteEmail}
                    onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300">
              <div className="flex items-center gap-3 mb-6">
                <FiBell className="text-2xl text-teal-600" />
                <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Notifications</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                </label>
              </div>
            </div>

            {/* System Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300">
              <div className="flex items-center gap-3 mb-6">
                <FiDatabase className="text-2xl text-teal-600" />
                <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoBackup}
                    onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Automatic Backup</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold shadow-lg"
              >
                <FiSave /> Save Settings
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

