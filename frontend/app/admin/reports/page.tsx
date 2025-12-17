'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import Loading from '@/components/Loading';
import { format } from 'date-fns';
import { FiFlag, FiDownload, FiFileText, FiCalendar, FiUsers, FiDollarSign } from 'react-icons/fi';

export default function AdminReportsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    // For now, reports are placeholder
    setReports([
      { id: 1, name: 'Monthly Appointments Report', type: 'appointments', date: new Date() },
      { id: 2, name: 'Revenue Report', type: 'revenue', date: new Date() },
      { id: 3, name: 'User Activity Report', type: 'users', date: new Date() },
    ]);
    setLoading(false);
  }, [user, authLoading, router]);

  const handleDownload = (report: any) => {
    // In a real app, you'd generate and download the report
    alert(`Downloading ${report.name}...`);
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  const reportTypes = [
    { type: 'appointments', icon: FiCalendar, color: 'blue' },
    { type: 'revenue', icon: FiDollarSign, color: 'green' },
    { type: 'users', icon: FiUsers, color: 'purple' },
  ];

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar user={user} logout={logout} />
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        <AdminHeader title="Reports" />

        <div className="p-4 sm:p-6 lg:p-8">

          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-300">
              <FiFlag className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No reports available</h3>
              <p className="text-gray-600">Reports will be generated automatically</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => {
                const reportType = reportTypes.find(rt => rt.type === report.type) || reportTypes[0];
                const Icon = reportType.icon;
                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 p-6 border-2 border-gray-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-${reportType.color}-100 flex items-center justify-center`}>
                        <Icon className={`text-2xl text-${reportType.color}-600`} />
                      </div>
                      <button
                        onClick={() => handleDownload(report)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FiDownload className="text-gray-600" />
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{report.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Generated: {format(new Date(report.date), 'MMM dd, yyyy')}
                    </p>
                    <button
                      onClick={() => handleDownload(report)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors font-semibold"
                    >
                      <FiDownload /> Download
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
