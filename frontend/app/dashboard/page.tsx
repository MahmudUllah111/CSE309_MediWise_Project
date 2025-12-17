'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { FiCalendar, FiUser, FiFileText, FiClock, FiBell, FiSearch, FiMessageCircle, FiHome, FiPlus, FiSettings, FiFlag, FiChevronDown, FiMoreVertical, FiEdit, FiTrash2, FiEye, FiX, FiCheck } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import PatientSidebar from '@/components/PatientSidebar';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { formatDoctorName } from '@/utils/doctorName';

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Admin dashboard state - must be at top level before any conditional returns
  const [activeSection, setActiveSection] = useState('/dashboard');
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Redirect to role-based dashboard if user is logged in
    if (user && !authLoading) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'patient') {
        router.push('/patient/dashboard');
      } else if (user.role === 'doctor') {
        router.push('/doctor/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const checkDoctorProfile = async () => {
    try {
      const response = await api.get('/doctors/profile/me');
      if (!response.data.doctor || response.data.doctor.status === 'pending') {
        // Redirect to complete profile if not completed or pending
        router.push('/doctor/complete-profile');
      } else if (response.data.doctor.status === 'approved') {
        fetchDashboardData();
      }
    } catch (error) {
      // If no profile exists, redirect to complete profile
      router.push('/doctor/complete-profile');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (user?.role === 'admin') {
        const [dashboardResponse, pendingDoctorsResponse] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/doctors/admin/pending'),
        ]);
        setStats({
          ...dashboardResponse.data,
          pendingDoctors: pendingDoctorsResponse.data.doctors || [],
        });
      } else if (user?.role === 'doctor') {
        const appointments = await api.get('/appointments?limit=5');
        const prescriptions = await api.get('/prescriptions?limit=5');
        setStats({
          appointments: appointments.data.appointments,
          prescriptions: prescriptions.data.prescriptions,
        });
      } else {
        // Fetch patient's own appointments and prescriptions with fresh data
        const appointments = await api.get(`/appointments?patientId=${user?.id}&limit=100`);
        const prescriptions = await api.get(`/prescriptions?limit=100`);
        setStats({
          appointments: appointments.data.appointments || [],
          prescriptions: prescriptions.data.prescriptions || [],
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty stats on error
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

  // Patient Dashboard with Teal Sidebar Design
  if (user.role === 'patient') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <PatientSidebar user={user} logout={logout} />
        {/* Main Content */}
        <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">
              Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FiSearch className="text-xl text-gray-600" />
              </button>
              <Link href="/patient/chat" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FiMessageCircle className="text-xl text-gray-600" />
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </Link>
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FiBell className="text-xl text-gray-600" />
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                {getInitials(user?.name || 'P')}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome back, {user.name}!
              </h2>
              <p className="text-gray-600">Here's a summary of your recent activities</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Total Appointments</p>
                    <p className="text-3xl font-bold text-teal-600">
                      {stats?.appointments?.length || 0}
                    </p>
                  </div>
                  <FiCalendar className="text-4xl text-teal-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Prescriptions</p>
                    <p className="text-3xl font-bold text-indigo-600">
                      {stats?.prescriptions?.length || 0}
                    </p>
                  </div>
                  <FiFileText className="text-4xl text-indigo-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Completed</p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats?.appointments?.filter((a: any) => a.status === 'completed').length || 0}
                    </p>
                  </div>
                  <FiClock className="text-4xl text-green-600 opacity-20" />
                </div>
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Appointments</h2>
                <Link 
                  href="/appointments"
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
              {stats?.appointments && stats.appointments.length > 0 ? (
                <div className="space-y-4">
                  {stats.appointments.slice(0, 5).map((appt: any) => (
                    <div
                      key={appt.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-lg">
                            {formatDoctorName(appt.doctor?.user?.name || 'Doctor', appt.doctor?.qualification)}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            {format(parseISO(appt.appointmentDate), 'MM/dd/yyyy')} at {appt.appointmentTime}
                          </p>
                          {appt.reason && (
                            <p className="text-sm text-gray-700 mt-2 font-medium">{appt.reason}</p>
                          )}
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiCalendar className="text-5xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">No appointments yet</p>
                  <Link 
                    href="/doctors"
                    className="inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Book an Appointment
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/doctors"
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                  <FiUser className="text-2xl text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Find Doctors</h3>
                  <p className="text-sm text-gray-600">Browse and book appointments</p>
                </div>
              </Link>
              <Link
                href="/prescriptions"
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <FiFileText className="text-2xl text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">My Prescriptions</h3>
                  <p className="text-sm text-gray-600">View all prescriptions</p>
                </div>
              </Link>
              <Link
                href="/profile"
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FiUser className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">My Profile</h3>
                  <p className="text-sm text-gray-600">View complete profile</p>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Admin Dashboard with Section-based Layout - Unified Single Page
  // Get section title
  const getSectionTitle = () => {
    switch (activeSection) {
      case '/dashboard': return 'Dashboard';
      case '/appointments': return 'Appointments';
      case '/admin/users': return 'Users';
      case '/admin/doctors': return 'Doctors';
      case '/prescriptions': return 'Prescriptions';
      case '/admin/ads': return 'Advertisements';
      default: return 'Dashboard';
    }
  };

  // Handle search from header
  const handleHeaderSearch = (query: string) => {
    setHeaderSearchQuery(query);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="ml-64 flex-1">
        <AdminHeader 
          title={getSectionTitle()} 
          onSearch={activeSection === '/admin/users' ? handleHeaderSearch : undefined}
          searchPlaceholder={activeSection === '/admin/users' ? 'Search users by name, email, or phone...' : undefined}
        />

        {/* Main Content - Section-based Views */}
        <div className="p-8">
          {activeSection === '/dashboard' && user.role === 'admin' && stats && (
            <>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Welcome back, {user.name}!
                </h2>
                <p className="text-gray-600">Here's an overview of your system</p>
              </div>
            </>
          )}

          {activeSection === '/dashboard' && user.role === 'admin' && stats && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Users</p>
                      <p className="text-3xl font-bold text-teal-600 mt-2">{stats.stats?.totalUsers || 0}</p>
                    </div>
                    <FiUser className="text-4xl text-teal-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Doctors</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.stats?.totalDoctors || 0}</p>
                    </div>
                    <FiUser className="text-4xl text-indigo-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Appointments</p>
                      <p className="text-3xl font-bold text-teal-600 mt-2">{stats.stats?.totalAppointments || 0}</p>
                    </div>
                    <FiCalendar className="text-4xl text-teal-600" />
                  </div>
                </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Pending Doctors</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{stats.stats?.pendingDoctors || 0}</p>
                  </div>
                  <FiClock className="text-4xl text-orange-600" />
                </div>
              </div>
              </div>

              {/* Recent Appointments Section */}
              {stats.recentAppointments && stats.recentAppointments.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Recent Appointments</h2>
                    <button
                      onClick={() => setActiveSection('/appointments')}
                      className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {stats.recentAppointments.slice(0, 5).map((appt: any) => (
                      <div
                        key={appt.id}
                        className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {appt.patient?.name || 'Patient'} - {formatDoctorName(appt.doctor?.user?.name || 'Doctor', appt.doctor?.qualification)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(parseISO(appt.appointmentDate), 'MM/dd/yyyy')} at {appt.appointmentTime}
                          </p>
                          {appt.reason && (
                            <p className="text-sm text-gray-700 mt-1">{appt.reason}</p>
                          )}
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

              {/* Pending Doctors Section */}
              {stats.pendingDoctors && stats.pendingDoctors.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Pending Doctor Approvals</h2>
                    <button
                      onClick={() => setActiveSection('/admin/doctors')}
                      className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {stats.pendingDoctors.slice(0, 5).map((doctor: any) => (
                      <div
                        key={doctor.id}
                        className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {doctor.user?.name || 'Doctor'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{doctor.specialization || 'N/A'}</p>
                          <p className="text-xs text-gray-500 mt-1">{doctor.department?.name || 'No Department'}</p>
                        </div>
                        <button
                          onClick={() => setActiveSection('/admin/doctors')}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                        >
                          Review
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <button
                  onClick={() => setActiveSection('/admin/doctors')}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex items-center gap-4 text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <FiUser className="text-2xl text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Manage Doctors</h3>
                    <p className="text-sm text-gray-600">Approve pending doctors</p>
                    {stats.stats?.pendingDoctors > 0 && (
                      <p className="text-xs text-orange-600 mt-1 font-medium">
                        {stats.stats.pendingDoctors} pending approval
                      </p>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveSection('/appointments')}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex items-center gap-4 text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                    <FiCalendar className="text-2xl text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">View Appointments</h3>
                    <p className="text-sm text-gray-600">Manage all appointments</p>
                    {stats.stats?.pendingAppointments > 0 && (
                      <p className="text-xs text-orange-600 mt-1 font-medium">
                        {stats.stats.pendingAppointments} pending
                      </p>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveSection('/admin/users')}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex items-center gap-4 text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <FiUser className="text-2xl text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Manage Users</h3>
                    <p className="text-sm text-gray-600">View all users</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}