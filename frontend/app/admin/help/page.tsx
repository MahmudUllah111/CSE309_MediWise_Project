'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import Loading from '@/components/Loading';
import { FiHelpCircle, FiMail, FiPhone, FiMessageCircle, FiFileText } from 'react-icons/fi';

export default function AdminHelpPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

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

  if (authLoading) {
    return <Loading />;
  }

  const helpSections = [
    {
      title: 'Getting Started',
      items: [
        'How to manage appointments',
        'Adding new doctors',
        'Managing patients',
        'Setting up departments',
      ],
    },
    {
      title: 'User Management',
      items: [
        'Creating user accounts',
        'Managing roles and permissions',
        'Resetting passwords',
        'Deactivating users',
      ],
    },
    {
      title: 'System Settings',
      items: [
        'Configuring system preferences',
        'Managing notifications',
        'Backup and restore',
        'System maintenance',
      ],
    },
  ];

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        <AdminHeader title="Help & Support Center" />

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {helpSections.map((section, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600">
                      <FiFileText className="text-teal-600 mt-1 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Support</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <FiMail className="text-2xl text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
                  <p className="text-gray-600 text-sm">support@mediwise.com</p>
                  <p className="text-gray-600 text-sm">We'll respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FiPhone className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Phone Support</h3>
                  <p className="text-gray-600 text-sm">+880 1234 567890</p>
                  <p className="text-gray-600 text-sm">Mon-Fri, 9 AM - 6 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FiMessageCircle className="text-2xl text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
                  <p className="text-gray-600 text-sm">Available 24/7</p>
                  <p className="text-gray-600 text-sm">Get instant help</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
