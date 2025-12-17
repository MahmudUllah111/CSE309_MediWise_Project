'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { FiUser, FiCalendar, FiFileText, FiDollarSign } from 'react-icons/fi';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, usersResponse] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users?limit=20'),
      ]);
      setStats(dashboardResponse.data);
      setUsers(usersResponse.data.users);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="ml-64 flex-1">
        <AdminHeader title="Users" />
        <div className="p-8">

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-teal-600 mt-2">
                      {stats.stats?.totalUsers || 0}
                    </p>
                  </div>
                  <FiUser className="text-4xl text-teal-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Doctors</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">
                      {stats.stats?.totalDoctors || 0}
                    </p>
                  </div>
                  <FiUser className="text-4xl text-indigo-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Appointments</p>
                    <p className="text-3xl font-bold text-teal-600 mt-2">
                      {stats.stats?.totalAppointments || 0}
                    </p>
                  </div>
                  <FiCalendar className="text-4xl text-teal-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Prescriptions</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">
                      {stats.stats?.totalPrescriptions || 0}
                    </p>
                  </div>
                  <FiFileText className="text-4xl text-indigo-600" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Role</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">{u.name}</td>
                      <td className="py-3 px-4 text-gray-600">{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'doctor'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{u.phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {stats?.recentAppointments && stats.recentAppointments.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Appointments</h2>
              <div className="space-y-3">
                {stats.recentAppointments.slice(0, 5).map((appt: any) => (
                  <div
                    key={appt.id}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {appt.patient?.name} - {appt.doctor?.user?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(appt.appointmentDate).toLocaleDateString()} at {appt.appointmentTime}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        appt.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : appt.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : appt.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


