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

          {/* Render different sections based on activeSection */}
          {activeSection === '/admin/users' && (
            <UsersManagementView 
              onSectionChange={setActiveSection} 
              searchQuery={headerSearchQuery}
            />
          )}
          
          {activeSection === '/admin/doctors' && (
            <DoctorsManagementView onSectionChange={setActiveSection} />
          )}

          {activeSection === '/appointments' && user.role === 'admin' && (
            <AppointmentsManagementView />
          )}

          {activeSection === '/prescriptions' && user.role === 'admin' && (
            <PrescriptionsManagementView />
          )}
        </div>
      </main>
    </div>
  );
}

// View Components for Admin Dashboard Sections
const UsersManagementView = ({ onSectionChange, searchQuery: externalSearchQuery }: any) => {
  const { showNotification } = useNotification();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'patients' | 'doctors' | 'admins'>('all');
  const searchQuery = externalSearchQuery || '';
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserForm, setEditUserForm] = useState<any>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, activeTab, searchQuery, sortColumn, sortDirection]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users?limit=100');
      setUsers(response.data.users || []);
      setFilteredUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    if (activeTab !== 'all') {
      filtered = filtered.filter((u) => u.role === activeTab.slice(0, -1));
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.phone?.toLowerCase().includes(query)
      );
    }
    
    filtered.sort((a, b) => {
      let aVal = a[sortColumn] || '';
      let bVal = b[sortColumn] || '';
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredUsers(filtered);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'doctor': return 'bg-blue-100 text-blue-800';
      case 'patient': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      showNotification('User deleted successfully', 'success');
      setActionMenuOpen(null);
      fetchUsers();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) {
      showNotification('Please select users to delete', 'warning');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete('/admin/users', {
        data: { userIds: selectedUsers },
      });
      showNotification(`${selectedUsers.length} user(s) deleted successfully`, 'success');
      setSelectedUsers([]);
      fetchUsers();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to delete users', 'error');
    }
  };

  const openUserModal = async (user: any, editMode: boolean = false) => {
    try {
      // Fetch full user details
      const response = await api.get(`/users/${user.id}`);
      const fullUser = response.data.user;
      setSelectedUser(fullUser);
      setEditUserForm({
        name: fullUser.name || '',
        email: fullUser.email || '',
        phone: fullUser.phone || '',
        address: fullUser.address || '',
        role: fullUser.role || '',
        dateOfBirth: fullUser.dateOfBirth ? new Date(fullUser.dateOfBirth).toISOString().split('T')[0] : '',
        weight: fullUser.weight || '',
        height: fullUser.height || '',
        homePhone: fullUser.homePhone || '',
        workPhone: fullUser.workPhone || '',
        allergies: Array.isArray(fullUser.allergies) ? fullUser.allergies : [],
        bloodPressure: fullUser.bloodPressure || '',
        pulse: fullUser.pulse || '',
      });
      setIsEditingUser(editMode);
      setShowUserModal(true);
      setActionMenuOpen(null);
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to fetch user details', 'error');
    }
  };

  const handleUpdateUser = async () => {
    try {
      const updateData = {
        ...editUserForm,
        allergies: Array.isArray(editUserForm.allergies) ? editUserForm.allergies : [],
      };

      await api.put(`/admin/users/${selectedUser.id}`, updateData);
      showNotification('User updated successfully', 'success');
      setIsEditingUser(false);
      setShowUserModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to update user', 'error');
    }
  };

  if (loading) {
    return <Loading />;
  }

  const activeCount = filteredUsers.length;
  const totalCount = users.length;

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All Users ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'patients'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Patients ({users.filter((u) => u.role === 'patient').length})
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'doctors'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Doctors ({users.filter((u) => u.role === 'doctor').length})
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'admins'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Admins ({users.filter((u) => u.role === 'admin').length})
          </button>
        </div>
      </div>

      {/* Count and Actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">{activeCount} users</p>
        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{selectedUsers.length} selected</span>
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Name
                    {sortColumn === 'name' && (
                      <FiChevronDown className={`text-xs transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center gap-2">
                    Email
                    {sortColumn === 'email' && (
                      <FiChevronDown className={`text-xs transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Phone
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-2">
                    Role
                    {sortColumn === 'role' && (
                      <FiChevronDown className={`text-xs transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(userItem.id)}
                        onChange={() => handleSelectUser(userItem.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                          {userItem.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{userItem.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{userItem.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{userItem.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(userItem.role)}`}>
                        {userItem.role || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuOpen(actionMenuOpen === userItem.id ? null : userItem.id);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FiMoreVertical className="text-gray-600" />
                      </button>
                      {actionMenuOpen === userItem.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openUserModal(userItem, false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <FiEye className="text-base" />
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openUserModal(userItem, true);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <FiEdit className="text-base" />
                            Edit
                          </button>
                          <div className="border-t border-gray-200 my-2"></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(userItem.id, userItem.name);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <FiTrash2 className="text-base" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {actionMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setActionMenuOpen(null)}></div>
      )}

      {/* User View/Edit Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isEditingUser ? 'Edit User' : 'User Details'}
                </h2>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                    setIsEditingUser(false);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  {isEditingUser ? (
                    <input
                      type="text"
                      value={editUserForm.name}
                      onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  ) : (
                    <p className="text-gray-800">{selectedUser.name || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditingUser ? (
                    <input
                      type="email"
                      value={editUserForm.email}
                      onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  ) : (
                    <p className="text-gray-800">{selectedUser.email || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  {isEditingUser ? (
                    <input
                      type="tel"
                      value={editUserForm.phone}
                      onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  ) : (
                    <p className="text-gray-800">{selectedUser.phone || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  {isEditingUser ? (
                    <select
                      value={editUserForm.role}
                      onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <p className="text-gray-800">{selectedUser.role || 'N/A'}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  {isEditingUser ? (
                    <textarea
                      value={editUserForm.address}
                      onChange={(e) => setEditUserForm({ ...editUserForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      rows={2}
                    />
                  ) : (
                    <p className="text-gray-800">{selectedUser.address || 'N/A'}</p>
                  )}
                </div>

                {selectedUser.role === 'patient' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      {isEditingUser ? (
                        <input
                          type="date"
                          value={editUserForm.dateOfBirth}
                          onChange={(e) => setEditUserForm({ ...editUserForm, dateOfBirth: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800">
                          {selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                      {isEditingUser ? (
                        <input
                          type="text"
                          value={editUserForm.weight}
                          onChange={(e) => setEditUserForm({ ...editUserForm, weight: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800">{selectedUser.weight || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                      {isEditingUser ? (
                        <input
                          type="text"
                          value={editUserForm.height}
                          onChange={(e) => setEditUserForm({ ...editUserForm, height: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800">{selectedUser.height || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                      {isEditingUser ? (
                        <input
                          type="text"
                          value={editUserForm.bloodPressure}
                          onChange={(e) => setEditUserForm({ ...editUserForm, bloodPressure: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800">{selectedUser.bloodPressure || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pulse</label>
                      {isEditingUser ? (
                        <input
                          type="text"
                          value={editUserForm.pulse}
                          onChange={(e) => setEditUserForm({ ...editUserForm, pulse: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800">{selectedUser.pulse || 'N/A'}</p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                      {isEditingUser ? (
                        <div className="space-y-2">
                          {editUserForm.allergies.map((allergy: string, idx: number) => (
                            <div key={idx} className="flex gap-2">
                              <input
                                type="text"
                                value={allergy}
                                onChange={(e) => {
                                  const updated = [...editUserForm.allergies];
                                  updated[idx] = e.target.value;
                                  setEditUserForm({ ...editUserForm, allergies: updated });
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                              />
                              <button
                                onClick={() => {
                                  setEditUserForm({
                                    ...editUserForm,
                                    allergies: editUserForm.allergies.filter((_: any, i: number) => i !== idx),
                                  });
                                }}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                <FiX />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              setEditUserForm({
                                ...editUserForm,
                                allergies: [...editUserForm.allergies, ''],
                              });
                            }}
                            className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                          >
                            <FiPlus className="inline mr-1" /> Add Allergy
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(selectedUser.allergies) && selectedUser.allergies.length > 0 ? (
                            selectedUser.allergies.map((allergy: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                                {allergy}
                              </span>
                            ))
                          ) : (
                            <p className="text-gray-800">None</p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-4">
              {isEditingUser ? (
                <>
                  <button
                    onClick={() => setIsEditingUser(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateUser}
                    className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setIsEditingUser(true)}
                    className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DoctorsManagementView = ({ onSectionChange }: any) => {
  const { showNotification } = useNotification();
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [approvedDoctors, setApprovedDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [isEditingDoctor, setIsEditingDoctor] = useState(false);
  const [editDoctorForm, setEditDoctorForm] = useState<any>({});
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchPendingDoctors();
    fetchApprovedDoctors();
  }, []);

  useEffect(() => {
    if (activeTab === 'approved') {
      fetchApprovedDoctors();
    }
  }, [activeTab]);

  const fetchPendingDoctors = async () => {
    try {
      const response = await api.get('/doctors/admin/pending');
      setPendingDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching pending doctors:', error);
    }
  };

  const fetchApprovedDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors/admin/approved?limit=100');
      setApprovedDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching approved doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doctorId: string) => {
    try {
      await api.put(`/doctors/admin/${doctorId}/approve`, { notes });
      setShowModal(false);
      setSelectedDoctor(null);
      setNotes('');
      setSuccessMessage('Doctor approved successfully!');
      setShowSuccessMessage(true);
      fetchPendingDoctors();
      fetchApprovedDoctors(); // Refresh approved list
      showNotification('Doctor approved successfully!', 'success');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to approve doctor', 'error');
    }
  };

  const handleReject = async (doctorId: string) => {
    if (!notes.trim()) {
      showNotification('Please provide a reason for rejection', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to reject this doctor application?')) {
      return;
    }

    try {
      await api.put(`/doctors/admin/${doctorId}/reject`, { notes });
      showNotification('Doctor application rejected', 'info');
      setShowModal(false);
      setSelectedDoctor(null);
      setNotes('');
      fetchPendingDoctors();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to reject doctor', 'error');
    }
  };

  const openModal = (doctor: any, isApproved: boolean = false) => {
    // Parse JSON fields if they are strings
    const parsedDoctor = { ...doctor };
    
    // Parse availableDays
    if (parsedDoctor.availableDays && typeof parsedDoctor.availableDays === 'string') {
      try {
        parsedDoctor.availableDays = JSON.parse(parsedDoctor.availableDays);
      } catch (e) {
        parsedDoctor.availableDays = [];
      }
    }
    
    // Parse previousJobs
    if (parsedDoctor.previousJobs && typeof parsedDoctor.previousJobs === 'string') {
      try {
        parsedDoctor.previousJobs = JSON.parse(parsedDoctor.previousJobs);
      } catch (e) {
        parsedDoctor.previousJobs = [];
      }
    }
    
    // Parse education
    if (parsedDoctor.education && typeof parsedDoctor.education === 'string') {
      try {
        parsedDoctor.education = JSON.parse(parsedDoctor.education);
      } catch (e) {
        parsedDoctor.education = [];
      }
    }
    
    setSelectedDoctor({ ...parsedDoctor, _isApproved: isApproved });
    
    // Initialize edit form
    if (isApproved) {
      setEditDoctorForm({
        departmentId: parsedDoctor.departmentId || '',
        specialization: parsedDoctor.specialization || '',
        experience: parsedDoctor.experience?.toString() || '',
        qualification: parsedDoctor.qualification || '',
        bio: parsedDoctor.bio || '',
        consultationFee: parsedDoctor.consultationFee?.toString() || '',
        availableFrom: parsedDoctor.availableFrom || '',
        availableTo: parsedDoctor.availableTo || '',
        availableDays: Array.isArray(parsedDoctor.availableDays) ? parsedDoctor.availableDays : [],
        previousJobs: Array.isArray(parsedDoctor.previousJobs) ? parsedDoctor.previousJobs : [],
        education: Array.isArray(parsedDoctor.education) ? parsedDoctor.education : [],
      });
    }
    
    setIsEditingDoctor(false);
    setShowModal(true);
  };

  const handleUpdateDoctor = async () => {
    try {
      const updateData = {
        ...editDoctorForm,
        availableDays: JSON.stringify(editDoctorForm.availableDays),
        previousJobs: JSON.stringify(editDoctorForm.previousJobs),
        education: JSON.stringify(editDoctorForm.education),
      };

      await api.put(`/doctors/${selectedDoctor.id}`, updateData);
      showNotification('Doctor updated successfully', 'success');
      setIsEditingDoctor(false);
      setShowModal(false);
      setSelectedDoctor(null);
      fetchApprovedDoctors();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to update doctor', 'error');
    }
  };

  if (loading && approvedDoctors.length === 0) {
    return <Loading />;
  }

  return (
    <div className="relative">
      {/* Success Message Overlay */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="text-3xl text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Success!</h3>
              <p className="text-lg text-gray-600 mb-6">{successMessage}</p>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Doctors ({pendingDoctors.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'approved'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Approved Doctors ({approvedDoctors.length})
          </button>
        </div>
      </div>

      {activeTab === 'pending' && pendingDoctors.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg">No pending doctor applications</p>
        </div>
      )}

      {activeTab === 'pending' && pendingDoctors.length > 0 && (
        <div className="space-y-4">
          {pendingDoctors.map((doctor) => (
            <div 
              key={doctor.id} 
              onClick={() => openModal(doctor)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                    {doctor.profileImage ? (
                      <img 
                        src={`data:${doctor.profileImageMimeType || 'image/jpeg'};base64,${doctor.profileImage}`} 
                        alt={doctor.user?.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      doctor.user?.name?.charAt(0)?.toUpperCase() || 'D'
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{doctor.user?.name}</h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{doctor.specialization}</p>
                    <p className="text-xs text-gray-500">{doctor.department?.name}</p>
                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                      <span>{doctor.experience || 0} years exp</span>
                      <span>•</span>
                      <span>BDT {doctor.consultationFee || 0} fee</span>
                      <span>•</span>
                      <span>{doctor.user?.email}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(doctor);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-4"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'approved' && approvedDoctors.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg">No approved doctors yet</p>
        </div>
      )}

      {activeTab === 'approved' && approvedDoctors.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Doctor Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Consultation Fee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {approvedDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                          {doctor.user?.name?.charAt(0)?.toUpperCase() || 'D'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{doctor.user?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.specialization || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.department?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.user?.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.user?.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.experience || 0} years</td>
                    <td className="px-6 py-4 text-sm text-gray-600">BDT {doctor.consultationFee || 0}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Approved
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuOpen(actionMenuOpen === doctor.id ? null : doctor.id);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FiMoreVertical className="text-gray-600" />
                      </button>
                      {actionMenuOpen === doctor.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(doctor, true);
                              setActionMenuOpen(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <FiEye className="text-base" />
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Parse JSON fields for approved doctor
                              const parsedDoctor = { ...doctor };
                              if (parsedDoctor.availableDays && typeof parsedDoctor.availableDays === 'string') {
                                try {
                                  parsedDoctor.availableDays = JSON.parse(parsedDoctor.availableDays);
                                } catch (e) {
                                  parsedDoctor.availableDays = [];
                                }
                              }
                              if (parsedDoctor.previousJobs && typeof parsedDoctor.previousJobs === 'string') {
                                try {
                                  parsedDoctor.previousJobs = JSON.parse(parsedDoctor.previousJobs);
                                } catch (e) {
                                  parsedDoctor.previousJobs = [];
                                }
                              }
                              if (parsedDoctor.education && typeof parsedDoctor.education === 'string') {
                                try {
                                  parsedDoctor.education = JSON.parse(parsedDoctor.education);
                                } catch (e) {
                                  parsedDoctor.education = [];
                                }
                              }
                              openModal(parsedDoctor, true);
                              setIsEditingDoctor(true);
                              setActionMenuOpen(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <FiEdit className="text-base" />
                            Edit
                          </button>
                          <div className="border-t border-gray-200 my-2"></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete ${doctor.user?.name}?`)) {
                                // TODO: Implement delete functionality
                                showNotification('Delete functionality coming soon', 'info');
                              }
                              setActionMenuOpen(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <FiTrash2 className="text-base" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setActionMenuOpen(null)}></div>
      )}

      {/* Review Modal for Pending Doctors */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isEditingDoctor ? 'Edit Doctor Profile' : selectedDoctor._isApproved ? 'Doctor Details' : 'Review Doctor Application'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedDoctor(null);
                    setNotes('');
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6">
              {/* Doctor Profile Image and Basic Info */}
              <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-200">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {selectedDoctor.profileImage ? (
                    <img 
                      src={`data:${selectedDoctor.profileImageMimeType || 'image/jpeg'};base64,${selectedDoctor.profileImage}`} 
                      alt={selectedDoctor.user?.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    selectedDoctor.user?.name?.charAt(0)?.toUpperCase() || 'D'
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-3xl font-bold text-gray-800">
                      {selectedDoctor.user?.name}
                    </h3>
                    {selectedDoctor._isApproved ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        Approved
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                        Pending Approval
                      </span>
                    )}
                  </div>
                  <p className="text-lg text-gray-600 mb-1">{selectedDoctor.specialization}</p>
                  <p className="text-sm text-gray-500">
                    {selectedDoctor.department?.icon} {selectedDoctor.department?.name}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-semibold text-gray-800">{selectedDoctor.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="font-semibold text-gray-800">{selectedDoctor.user?.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1">Department</label>
                  {isEditingDoctor && selectedDoctor._isApproved ? (
                    <select
                      value={editDoctorForm.departmentId}
                      onChange={(e) => setEditDoctorForm({ ...editDoctorForm, departmentId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.icon} {dept.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-semibold text-gray-800">
                      {selectedDoctor.department?.icon} {selectedDoctor.department?.name || 'N/A'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1">Specialization</label>
                  {isEditingDoctor && selectedDoctor._isApproved ? (
                    <input
                      type="text"
                      value={editDoctorForm.specialization}
                      onChange={(e) => setEditDoctorForm({ ...editDoctorForm, specialization: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{selectedDoctor.specialization || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1">Experience</label>
                  {isEditingDoctor && selectedDoctor._isApproved ? (
                    <input
                      type="number"
                      value={editDoctorForm.experience}
                      onChange={(e) => setEditDoctorForm({ ...editDoctorForm, experience: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{selectedDoctor.experience || 0} years</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1">Consultation Fee</label>
                  {isEditingDoctor && selectedDoctor._isApproved ? (
                    <input
                      type="number"
                      value={editDoctorForm.consultationFee}
                      onChange={(e) => setEditDoctorForm({ ...editDoctorForm, consultationFee: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">BDT {selectedDoctor.consultationFee || 0}</p>
                  )}
                </div>
              </div>

              {/* Qualifications */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Qualifications</h4>
                {isEditingDoctor && selectedDoctor._isApproved ? (
                  <textarea
                    value={editDoctorForm.qualification}
                    onChange={(e) => setEditDoctorForm({ ...editDoctorForm, qualification: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-line">{selectedDoctor.qualification || 'N/A'}</p>
                )}
              </div>

              {/* Bio */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Bio</h4>
                {isEditingDoctor && selectedDoctor._isApproved ? (
                  <textarea
                    value={editDoctorForm.bio}
                    onChange={(e) => setEditDoctorForm({ ...editDoctorForm, bio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700">{selectedDoctor.bio || 'N/A'}</p>
                )}
              </div>

              {/* Previous Jobs */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Previous Jobs</h4>
                {isEditingDoctor && selectedDoctor._isApproved ? (
                  <div className="space-y-3">
                    {(editDoctorForm.previousJobs || []).map((job: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <input
                          type="text"
                          value={job.position || ''}
                          onChange={(e) => {
                            const updated = [...(editDoctorForm.previousJobs || [])];
                            updated[index] = { ...updated[index], position: e.target.value };
                            setEditDoctorForm({ ...editDoctorForm, previousJobs: updated });
                          }}
                          placeholder="Position"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                        <input
                          type="text"
                          value={job.hospital || ''}
                          onChange={(e) => {
                            const updated = [...(editDoctorForm.previousJobs || [])];
                            updated[index] = { ...updated[index], hospital: e.target.value };
                            setEditDoctorForm({ ...editDoctorForm, previousJobs: updated });
                          }}
                          placeholder="Hospital"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                        <input
                          type="text"
                          value={job.years || ''}
                          onChange={(e) => {
                            const updated = [...(editDoctorForm.previousJobs || [])];
                            updated[index] = { ...updated[index], years: e.target.value };
                            setEditDoctorForm({ ...editDoctorForm, previousJobs: updated });
                          }}
                          placeholder="Years"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditDoctorForm({
                              ...editDoctorForm,
                              previousJobs: (editDoctorForm.previousJobs || []).filter((_: any, i: number) => i !== index),
                            });
                          }}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          <FiX className="inline mr-1" /> Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setEditDoctorForm({
                          ...editDoctorForm,
                          previousJobs: [...(editDoctorForm.previousJobs || []), { position: '', hospital: '', years: '' }],
                        });
                      }}
                      className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                    >
                      <FiPlus className="inline mr-1" /> Add Job
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDoctor.previousJobs && Array.isArray(selectedDoctor.previousJobs) && selectedDoctor.previousJobs.length > 0 ? (
                      selectedDoctor.previousJobs.map((job: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <p className="font-semibold text-gray-800">{job.position}</p>
                          <p className="text-sm text-gray-600">{job.hospital}</p>
                          <p className="text-xs text-gray-500 mt-1">{job.years}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No previous jobs listed</p>
                    )}
                  </div>
                )}
              </div>

              {/* Education */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Education</h4>
                {isEditingDoctor && selectedDoctor._isApproved ? (
                  <div className="space-y-3">
                    {(editDoctorForm.education || []).map((edu: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <input
                          type="text"
                          value={edu.degree || ''}
                          onChange={(e) => {
                            const updated = [...(editDoctorForm.education || [])];
                            updated[index] = { ...updated[index], degree: e.target.value };
                            setEditDoctorForm({ ...editDoctorForm, education: updated });
                          }}
                          placeholder="Degree"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                        <input
                          type="text"
                          value={edu.institution || ''}
                          onChange={(e) => {
                            const updated = [...(editDoctorForm.education || [])];
                            updated[index] = { ...updated[index], institution: e.target.value };
                            setEditDoctorForm({ ...editDoctorForm, education: updated });
                          }}
                          placeholder="Institution"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                        <input
                          type="text"
                          value={edu.year || ''}
                          onChange={(e) => {
                            const updated = [...(editDoctorForm.education || [])];
                            updated[index] = { ...updated[index], year: e.target.value };
                            setEditDoctorForm({ ...editDoctorForm, education: updated });
                          }}
                          placeholder="Year"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditDoctorForm({
                              ...editDoctorForm,
                              education: (editDoctorForm.education || []).filter((_: any, i: number) => i !== index),
                            });
                          }}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          <FiX className="inline mr-1" /> Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setEditDoctorForm({
                          ...editDoctorForm,
                          education: [...(editDoctorForm.education || []), { degree: '', institution: '', year: '' }],
                        });
                      }}
                      className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                    >
                      <FiPlus className="inline mr-1" /> Add Education
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDoctor.education && Array.isArray(selectedDoctor.education) && selectedDoctor.education.length > 0 ? (
                      selectedDoctor.education.map((edu: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <p className="font-semibold text-gray-800">{edu.degree}</p>
                          <p className="text-sm text-gray-600">{edu.institution}</p>
                          <p className="text-xs text-gray-500 mt-1">{edu.year}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No education listed</p>
                    )}
                  </div>
                )}
              </div>

              {/* Availability */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Availability</h4>
                {isEditingDoctor && selectedDoctor._isApproved ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-2">Available Days:</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                          <label key={day} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(editDoctorForm.availableDays || []).includes(day)}
                              onChange={(e) => {
                                const currentDays = editDoctorForm.availableDays || [];
                                if (e.target.checked) {
                                  setEditDoctorForm({ ...editDoctorForm, availableDays: [...currentDays, day] });
                                } else {
                                  setEditDoctorForm({ ...editDoctorForm, availableDays: currentDays.filter((d: string) => d !== day) });
                                }
                              }}
                              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-700">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">From</label>
                        <input
                          type="time"
                          value={editDoctorForm.availableFrom || ''}
                          onChange={(e) => setEditDoctorForm({ ...editDoctorForm, availableFrom: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">To</label>
                        <input
                          type="time"
                          value={editDoctorForm.availableTo || ''}
                          onChange={(e) => setEditDoctorForm({ ...editDoctorForm, availableTo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedDoctor.availableDays && Array.isArray(selectedDoctor.availableDays) && selectedDoctor.availableDays.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-2">Available Days:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedDoctor.availableDays.map((day: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium"
                            >
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedDoctor.availableFrom && selectedDoctor.availableTo && (
                      <p className="font-semibold text-gray-800">
                        Time: {selectedDoctor.availableFrom} - {selectedDoctor.availableTo}
                      </p>
                    )}
                    {(!selectedDoctor.availableDays || selectedDoctor.availableDays.length === 0) && !selectedDoctor.availableFrom && (
                      <p className="text-gray-500">No availability set</p>
                    )}
                  </>
                )}
              </div>

              {/* CV/Resume Download */}
              {(selectedDoctor.hasCV || selectedDoctor.cvResume) && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">CV/Resume</h4>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctors/${selectedDoctor.id}/cv`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                  >
                    <FiFileText className="text-lg" />
                    Download CV/Resume {selectedDoctor.cvResumeFileName && `(${selectedDoctor.cvResumeFileName})`}
                  </a>
                </div>
              )}

              {/* Notes Input - Only show for pending doctors */}
              {!selectedDoctor._isApproved && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional for approval, Required for rejection)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Add any notes or comments about this doctor application..."
                  />
                </div>
              )}
            </div>

            {/* Modal Footer - Action Buttons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-4">
              {selectedDoctor._isApproved ? (
                // For approved doctors - Close and Edit/Save buttons
                isEditingDoctor ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditingDoctor(false);
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateDoctor}
                      className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedDoctor(null);
                        setNotes('');
                        setIsEditingDoctor(false);
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setIsEditingDoctor(true)}
                      className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
                    >
                      Edit
                    </button>
                  </>
                )
              ) : (
                // For pending doctors - Close, Reject, Approve buttons
                <>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedDoctor(null);
                      setNotes('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleReject(selectedDoctor.id)}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-medium transition-colors"
                  >
                    <FiX className="text-lg" />
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApprove(selectedDoctor.id)}
                    className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2 font-medium transition-colors"
                  >
                    <FiCheck className="text-lg" />
                    Approve Doctor
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AppointmentsManagementView = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      <p className="text-gray-600 text-lg">Appointments management view - Full implementation coming soon</p>
    </div>
  );
};


