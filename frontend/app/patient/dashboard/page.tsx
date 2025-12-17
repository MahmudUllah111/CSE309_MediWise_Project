'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/components/Loading';
import PatientSidebar from '@/components/PatientSidebar';
import api from '@/lib/api';
import { FiCalendar, FiFileText, FiClock, FiUsers, FiSearch, FiBell, FiMessageCircle } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { formatDoctorName } from '@/utils/doctorName';

export default function PatientDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'patient') {
      // Redirect to appropriate dashboard
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'doctor') {
        router.push('/doctor/dashboard');
      } else {
        router.push('/dashboard');
      }
      return;
    }
    if (user && user.role === 'patient') {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments and prescriptions with error handling
      const [appointmentsRes, prescriptionsRes] = await Promise.allSettled([
        api.get('/appointments'),
        api.get('/prescriptions'),
      ]);

      const appointments = appointmentsRes.status === 'fulfilled' 
        ? (appointmentsRes.value?.data?.appointments || [])
        : [];
      
      const prescriptions = prescriptionsRes.status === 'fulfilled'
        ? (prescriptionsRes.value?.data?.prescriptions || [])
        : [];

      setStats({
        appointments,
        prescriptions,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      // Set empty stats on error to prevent crashes
      setStats({
        appointments: [],
        prescriptions: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      ?.map((n: string) => n[0])
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2) || 'U';
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <PatientSidebar user={user} logout={logout} />
      {/* Main Content */}
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        {/* Modern Header with Simple Color */}
        <header className="bg-teal-600 text-white shadow-xl">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-sm sm:text-base text-teal-100">Welcome back, {user.name}! Here's your health overview</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button className="relative p-3 bg-white text-teal-600 rounded-xl hover:bg-teal-50 transition-all shadow-lg font-bold">
                  <FiSearch className="text-xl" />
                </button>
                <Link href="/patient/chat" className="relative p-3 bg-white text-teal-600 rounded-xl hover:bg-teal-50 transition-all shadow-lg font-bold">
                  <FiMessageCircle className="text-xl" />
                </Link>
                <button className="relative p-3 bg-white text-teal-600 rounded-xl hover:bg-teal-50 transition-all shadow-lg font-bold">
                  <FiBell className="text-xl" />
                </button>
                <div className="w-12 h-12 rounded-xl bg-white text-teal-600 flex items-center justify-center font-bold shadow-lg ring-2 ring-white ring-opacity-50">
                  {getInitials(user?.name || 'P')}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Stats Cards - Modern Design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 text-sm mb-2 font-bold uppercase">Total Appointments</p>
                  <p className="text-5xl font-extrabold text-gray-800">
                    {stats?.appointments?.length || 0}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-teal-100 flex items-center justify-center shadow-lg">
                  <FiCalendar className="text-3xl text-teal-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 text-sm mb-2 font-bold uppercase">Prescriptions</p>
                  <p className="text-5xl font-extrabold text-gray-800">
                    {stats?.prescriptions?.length || 0}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center shadow-lg">
                  <FiFileText className="text-3xl text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 text-sm mb-2 font-bold uppercase">Completed</p>
                  <p className="text-5xl font-extrabold text-gray-800">
                    {stats?.appointments?.filter((a: any) => a.status === 'completed').length || 0}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center shadow-lg">
                  <FiClock className="text-3xl text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Appointments - Modern Design */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200 hover:shadow-2xl transition-shadow mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <FiCalendar className="text-teal-600 text-lg" />
                </div>
                Recent Appointments
              </h2>
              <Link 
                href="/patient/appointments"
                className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 hover:shadow-lg transition-all font-semibold text-sm"
              >
                View All →
              </Link>
            </div>
            {stats?.appointments && stats.appointments.length > 0 ? (
              <div className="space-y-4">
                {stats.appointments.slice(0, 5).map((appt: any) => (
                  <div
                    key={appt.id}
                    className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:shadow-lg transition-all hover:scale-[1.02]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-lg mb-2">
                          {formatDoctorName(appt.doctor?.user?.name || 'Doctor', appt.doctor?.qualification)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="text-teal-600" />
                            <span>{format(parseISO(appt.appointmentDate), 'MM/dd/yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiClock className="text-blue-600" />
                            <span>{appt.appointmentTime}</span>
                          </div>
                        </div>
                        {appt.reason && (
                          <p className="text-sm text-gray-700 mt-2 font-medium bg-white bg-opacity-60 px-3 py-2 rounded-lg inline-block">{appt.reason}</p>
                        )}
                      </div>
                      <span
                        className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md ${
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200">
                <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FiCalendar className="text-4xl text-teal-600" />
                </div>
                <p className="text-gray-800 text-lg mb-4 font-bold">No appointments yet</p>
                <Link 
                  href="/patient/doctors"
                  className="inline-block px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 hover:shadow-xl transition-all font-bold transform hover:scale-105"
                >
                  Book an Appointment
                </Link>
              </div>
            )}
          </div>

          {/* Quick Links - Modern Design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/patient/doctors"
              className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center shadow-lg">
                <FiUsers className="text-2xl text-teal-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Find Doctors</p>
                <p className="text-sm text-gray-700 font-medium">Browse available doctors</p>
              </div>
            </Link>
            <Link
              href="/patient/appointments"
              className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center shadow-lg">
                <FiCalendar className="text-2xl text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">My Appointments</p>
                <p className="text-sm text-gray-700 font-medium">View all appointments</p>
              </div>
            </Link>
            <Link
              href="/patient/prescriptions"
              className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center shadow-lg">
                <FiFileText className="text-2xl text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Prescriptions</p>
                <p className="text-sm text-gray-700 font-medium">View your prescriptions</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
