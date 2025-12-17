'use client';

import React, { useEffect, useState, useRef, useImperativeHandle } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter, usePathname } from 'next/navigation';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { FiCalendar, FiUser, FiFileText, FiClock, FiMoreVertical, FiEdit, FiTrash2, FiEye, FiX, FiCheck, FiPlus, FiFileText as FiFileTextIcon, FiChevronDown, FiMessageCircle, FiSend, FiSearch, FiPaperclip } from 'react-icons/fi';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { formatDoctorName } from '@/utils/doctorName';
import DashboardContent from './DashboardContent';

export default function AdminDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('/admin/dashboard');
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const usersViewRef = useRef<any>(null);
  const appointmentsViewRef = useRef<any>(null);
  const adsViewRef = useRef<any>(null);

  // Sync activeSection with URL pathname
  useEffect(() => {
    // If we're on admin dashboard or one of the admin routes, sync activeSection with pathname
    if (pathname && (pathname === '/admin/dashboard' || 
        pathname === '/admin/appointments' || 
        pathname === '/admin/users' || 
        pathname === '/admin/doctors' || 
        pathname === '/admin/prescriptions' || 
        pathname === '/admin/ads' ||
        pathname === '/admin/chats')) {
      setActiveSection(pathname);
    } else if (pathname && pathname.startsWith('/admin/')) {
      // For other admin routes, set to pathname
      setActiveSection(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      // Redirect to appropriate dashboard
      if (user.role === 'patient') {
        router.push('/patient/dashboard');
      } else if (user.role === 'doctor') {
        router.push('/doctor/dashboard');
      } else {
        router.push('/dashboard');
      }
      return;
    }
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, pendingDoctorsResponse, topDoctorsResponse] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/doctors/admin/pending'),
        api.get('/admin/top-doctors?limit=5'),
      ]);
      setStats({
        ...dashboardResponse.data,
        pendingDoctors: pendingDoctorsResponse.data.doctors || [],
        topDoctors: topDoctorsResponse.data.topDoctors || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        stats: { totalUsers: 0, totalDoctors: 0, totalAppointments: 0, pendingDoctors: 0 },
        appointments: [],
        prescriptions: [],
        pendingDoctors: [],
        topDoctors: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case '/admin/dashboard': return 'Dashboard';
      case '/admin/appointments': return 'Appointments';
      case '/admin/users': return 'Users';
      case '/admin/doctors': return 'Doctors';
      case '/admin/prescriptions': return 'Prescriptions';
      case '/admin/ads': return 'Advertisements';
      case '/admin/chats': return 'Chats';
      default: return 'Dashboard';
    }
  };

  const handleHeaderSearch = (query: string) => {
    setHeaderSearchQuery(query);
  };

  // Handle section change - update both state and URL
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    // Update URL without full page reload
    router.push(section);
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <AdminSidebar activeSection={pathname || activeSection} onSectionChange={handleSectionChange} />
      <main className="w-full lg:ml-64 flex-1 bg-gray-50 dark:bg-gray-900 transition-colors">
        <AdminHeader 
          title={getSectionTitle()} 
          onSearch={activeSection === '/admin/users' ? handleHeaderSearch : undefined}
          searchPlaceholder={activeSection === '/admin/users' ? 'Search users by name, email, or phone...' : undefined}
          onQuickAdd={{
            onAddUser: () => {
              handleSectionChange('/admin/users');
              setTimeout(() => {
                if (usersViewRef.current?.openCreateModal) {
                  usersViewRef.current.openCreateModal();
                }
              }, 100);
            },
            onAddDoctor: () => {
              handleSectionChange('/admin/doctors');
              showNotification('Navigate to Doctors section to review pending doctor applications', 'info');
            },
            onAddAppointment: () => {
              handleSectionChange('/admin/appointments');
              setTimeout(() => {
                if (appointmentsViewRef.current?.openCreateModal) {
                  appointmentsViewRef.current.openCreateModal();
                }
              }, 100);
            },
            onAddAdvertisement: () => {
              handleSectionChange('/admin/ads');
              setTimeout(() => {
                if (adsViewRef.current?.openCreateModal) {
                  adsViewRef.current.openCreateModal();
                }
              }, 100);
            },
          }}
        />

        <div className="p-8">
          {(activeSection === '/admin/dashboard' || activeSection === '/dashboard') && stats && (
            <>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {t('welcome_back')}, {user.name}!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{t('dashboard_overview') || "Here's an overview of your system"}</p>
              </div>

              <DashboardContent stats={stats} onRefresh={fetchDashboardData} />
            </>
          )}

          {/* Keep old dashboard as fallback for other sections */}
          {(activeSection !== '/admin/dashboard' && activeSection !== '/dashboard') && (
            <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('total_users')}</p>
                        <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 mt-2">{stats.stats?.totalUsers || 0}</p>
                      </div>
                      <FiUser className="text-4xl text-teal-600 dark:text-teal-400" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('total_doctors')}</p>
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{stats.stats?.totalDoctors || 0}</p>
                      </div>
                      <FiUser className="text-4xl text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('total_appointments')}</p>
                        <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 mt-2">{stats.stats?.totalAppointments || 0}</p>
                      </div>
                      <FiCalendar className="text-4xl text-teal-600 dark:text-teal-400" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('pending_doctors')}</p>
                        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{stats.stats?.pendingDoctors || 0}</p>
                      </div>
                      <FiClock className="text-4xl text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </div>

                {/* Recent Appointments and Top Doctors Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Appointments Section */}
                  {stats.recentAppointments && stats.recentAppointments.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('recent_appointments')}</h2>
                        <button
                          onClick={() => handleSectionChange('/admin/appointments')}
                          className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-medium"
                        >
                          {t('view_all')} →
                        </button>
                      </div>
                      <div className="space-y-3">
                        {stats.recentAppointments.slice(0, 5).map((appt: any) => (
                        <div
                          key={appt.id}
                          className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-700"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 dark:text-gray-100">
                              {appt.patient?.name || 'Patient'} - {formatDoctorName(appt.doctor?.user?.name || 'Doctor', appt.doctor?.qualification)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {format(parseISO(appt.appointmentDate), 'MM/dd/yyyy')} at {appt.appointmentTime}
                              </p>
                              {appt.reason && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{appt.reason}</p>
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

                  {/* Top Doctors Section */}
                  {stats.topDoctors && stats.topDoctors.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('top_doctors')}</h2>
                        <button
                          onClick={() => handleSectionChange('/admin/doctors')}
                          className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-medium"
                        >
                          {t('view_all')} →
                        </button>
                      </div>
                      <div className="space-y-3">
                        {stats.topDoctors.map((doctor: any, index: number) => (
                          <div
                            key={doctor.id}
                            className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-700"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{formatDoctorName(doctor.name || doctor.user?.name || '', doctor.qualification)}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{doctor.specialization}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{doctor.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{doctor.patientCount}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Patients</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pending Doctors Section */}
                {stats.pendingDoctors && stats.pendingDoctors.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Pending Doctor Approvals</h2>
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
                          className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 dark:text-gray-100">
                              {doctor.user?.name || 'Doctor'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{doctor.specialization || 'N/A'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{doctor.department?.name || 'No Department'}</p>
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
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all flex items-center gap-4 text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <FiUser className="text-2xl text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">Manage Doctors</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Approve pending doctors</p>
                      {stats.stats?.pendingDoctors > 0 && (
                        <p className="text-xs text-orange-600 mt-1 font-medium">
                          {stats.stats.pendingDoctors} pending approval
                        </p>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveSection('/admin/appointments')}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all flex items-center gap-4 text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                      <FiCalendar className="text-2xl text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">View Appointments</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage all appointments</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveSection('/admin/users')}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all flex items-center gap-4 text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <FiUser className="text-2xl text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">Manage Users</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">View all users</p>
                    </div>
                  </button>
                </div>
              </div>
          )}

          {/* Render different sections based on activeSection */}
          {activeSection === '/admin/users' && (
            <UsersManagementView 
              ref={usersViewRef}
              onSectionChange={setActiveSection} 
              searchQuery={headerSearchQuery}
            />
          )}
          
          {activeSection === '/admin/doctors' && (
            <DoctorsManagementView onSectionChange={setActiveSection} />
          )}

          {activeSection === '/admin/appointments' && (
            <AppointmentsManagementView ref={appointmentsViewRef} />
          )}

          {activeSection === '/admin/chats' && (
            <AdminChatsManagementView />
          )}

          {activeSection === '/admin/prescriptions' && (
            <PrescriptionsManagementView />
          )}

          {activeSection === '/admin/ads' && (
            <AdsManagementView ref={adsViewRef} />
          )}
        </div>
      </main>
    </div>
  );
}

// View Components for Admin Dashboard Sections
// These components are copied from dashboard/page.tsx for use in admin dashboard

const UsersManagementView = React.forwardRef(({ onSectionChange, searchQuery: externalSearchQuery }: any, ref: any) => {
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
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editUserForm, setEditUserForm] = useState<any>({});
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'patient',
    address: '',
  });

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openCreateModal: () => {
      setNewUserForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'patient',
        address: '',
      });
      setIsCreatingUser(true);
      setIsEditingUser(false);
      setSelectedUser(null);
      setShowUserModal(true);
    },
  }));

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

  const handleCreateUser = async () => {
    try {
      if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
        showNotification('Name, email, and password are required', 'error');
        return;
      }

      await api.post('/auth/register', {
        name: newUserForm.name,
        email: newUserForm.email,
        password: newUserForm.password,
        phone: newUserForm.phone || null,
        role: newUserForm.role,
        address: newUserForm.address || null,
      });
      
      showNotification('User created successfully', 'success');
      setIsCreatingUser(false);
      setShowUserModal(false);
      setNewUserForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'patient',
        address: '',
      });
      fetchUsers();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to create user', 'error');
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
        <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            All Users ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'patients'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Patients ({users.filter((u) => u.role === 'patient').length})
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'doctors'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Doctors ({users.filter((u) => u.role === 'doctor').length})
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'admins'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Admins ({users.filter((u) => u.role === 'admin').length})
          </button>
        </div>
      </div>

      {/* Count and Actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{activeCount} users</p>
        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">{selectedUsers.length} selected</span>
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
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
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
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
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center gap-2">
                    Email
                    {sortColumn === 'email' && (
                      <FiChevronDown className={`text-xs transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Phone
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-2">
                    Role
                    {sortColumn === 'role' && (
                      <FiChevronDown className={`text-xs transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{userItem.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{userItem.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{userItem.phone || '-'}</td>
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
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <FiMoreVertical className="text-gray-600" />
                      </button>
                      {actionMenuOpen === userItem.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 transition-colors">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openUserModal(userItem, false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          >
                            <FiEye className="text-base" />
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openUserModal(userItem, true);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
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

      {/* User View/Edit/Create Modal */}
      {showUserModal && (selectedUser || isCreatingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-colors">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {isCreatingUser ? 'Create New User' : isEditingUser ? 'Edit User' : 'User Details'}
                </h2>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                    setIsEditingUser(false);
                    setIsCreatingUser(false);
                  }}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX className="text-xl text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6">
              {isCreatingUser ? (
                // Create User Form
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                    <input
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                    <input
                      type="password"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newUserForm.phone}
                      onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    <textarea
                      value={newUserForm.address}
                      onChange={(e) => setNewUserForm({ ...newUserForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                // View/Edit User Form
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    {isEditingUser ? (
                      <input
                        type="text"
                        value={editUserForm.name}
                        onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      />
                    ) : (
                      <p className="text-gray-800 dark:text-gray-200">{selectedUser?.name || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    {isEditingUser ? (
                      <input
                        type="email"
                        value={editUserForm.email}
                        onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      />
                    ) : (
                      <p className="text-gray-800 dark:text-gray-200">{selectedUser?.email || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    {isEditingUser ? (
                      <input
                        type="tel"
                        value={editUserForm.phone}
                        onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      />
                    ) : (
                      <p className="text-gray-800 dark:text-gray-200">{selectedUser?.phone || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                    {isEditingUser ? (
                      <select
                        value={editUserForm.role}
                        onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      >
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <p className="text-gray-800 dark:text-gray-200">{selectedUser?.role || 'N/A'}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    {isEditingUser ? (
                      <textarea
                        value={editUserForm.address}
                        onChange={(e) => setEditUserForm({ ...editUserForm, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-800 dark:text-gray-200">{selectedUser?.address || 'N/A'}</p>
                    )}
                  </div>

                {selectedUser && selectedUser.role === 'patient' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight</label>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height</label>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Pressure</label>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pulse</label>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allergies</label>
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
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-4 transition-colors">
              {isCreatingUser ? (
                <>
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setIsCreatingUser(false);
                      setNewUserForm({
                        name: '',
                        email: '',
                        password: '',
                        phone: '',
                        role: 'patient',
                        address: '',
                      });
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateUser}
                    className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
                  >
                    Create User
                  </button>
                </>
              ) : isEditingUser ? (
                <>
                  <button
                    onClick={() => setIsEditingUser(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 transition-colors"
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
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 transition-colors"
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
});

UsersManagementView.displayName = 'UsersManagementView';

const DoctorsManagementView = ({ onSectionChange }: any) => {
  const { showNotification } = useNotification();
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [approvedDoctors, setApprovedDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('approved');
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
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (activeTab === 'approved') {
      fetchApprovedDoctors();
    }
  }, [activeTab]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

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
      fetchApprovedDoctors();
      showNotification('Doctor approved successfully!', 'success');
      
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
    
    setSelectedDoctor({ ...parsedDoctor, _isApproved: isApproved });
    
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

      <div className="mb-6">
        <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'approved'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Approved Doctors ({approvedDoctors.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Pending Doctors ({pendingDoctors.length})
          </button>
        </div>
      </div>

      {activeTab === 'pending' && pendingDoctors.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center transition-colors">
          <p className="text-gray-600 text-lg">No pending doctor applications</p>
        </div>
      )}

      {activeTab === 'pending' && pendingDoctors.length > 0 && (
        <div className="space-y-4">
          {pendingDoctors.map((doctor) => (
            <div 
              key={doctor.id} 
              onClick={() => openModal(doctor)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer text-gray-900 dark:text-gray-100"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center transition-colors">
          <p className="text-gray-600 text-lg">No approved doctors yet</p>
        </div>
      )}

      {activeTab === 'approved' && approvedDoctors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Doctor Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Consultation Fee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
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
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <FiMoreVertical className="text-gray-600" />
                      </button>
                      {actionMenuOpen === doctor.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 transition-colors">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(doctor, true);
                              setActionMenuOpen(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          >
                            <FiEye className="text-base" />
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          >
                            <FiEdit className="text-base" />
                            Edit
                          </button>
                          <div className="border-t border-gray-200 my-2"></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete ${doctor.user?.name}?`)) {
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

      {actionMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setActionMenuOpen(null)}></div>
      )}

      {showModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
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

            <div className="overflow-y-auto flex-1 p-6">
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

              {(selectedDoctor.hasCV || selectedDoctor.cvResume) && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">CV/Resume</h4>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctors/${selectedDoctor.id}/cv`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                  >
                    <FiFileTextIcon className="text-lg" />
                    Download CV/Resume {selectedDoctor.cvResumeFileName && `(${selectedDoctor.cvResumeFileName})`}
                  </a>
                </div>
              )}

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

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-4">
              {selectedDoctor._isApproved ? (
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

const AppointmentsManagementView = React.forwardRef((props: any, ref: any) => {
  const { showNotification } = useNotification();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [newAppointmentForm, setNewAppointmentForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    status: 'pending',
  });

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openCreateModal: async () => {
      // Fetch users and doctors for dropdowns
      try {
        const [usersRes, doctorsRes] = await Promise.all([
          api.get('/admin/users?limit=1000'),
          api.get('/doctors?limit=1000'),
        ]);
        setUsers(usersRes.data.users?.filter((u: any) => u.role === 'patient') || []);
        setDoctors(doctorsRes.data.doctors || []);
      } catch (error) {
        console.error('Error fetching users/doctors:', error);
      }
      setNewAppointmentForm({
        patientId: '',
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
        status: 'pending',
      });
      setShowCreateModal(true);
    },
  }));

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, activeTab, searchQuery]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments?limit=1000');
      setAppointments(response.data.appointments || []);
      setFilteredAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      showNotification('Failed to fetch appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    if (activeTab !== 'all') {
      filtered = filtered.filter((apt) => apt.status === activeTab);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.patient?.name?.toLowerCase().includes(query) ||
          apt.doctor?.user?.name?.toLowerCase().includes(query) ||
          apt.patient?.email?.toLowerCase().includes(query) ||
          apt.reason?.toLowerCase().includes(query)
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleCreateAppointment = async () => {
    try {
      if (!newAppointmentForm.patientId || !newAppointmentForm.doctorId || !newAppointmentForm.appointmentDate || !newAppointmentForm.appointmentTime) {
        showNotification('Patient, Doctor, Date, and Time are required', 'error');
        return;
      }

      await api.post('/appointments', {
        patientId: newAppointmentForm.patientId,
        doctorId: newAppointmentForm.doctorId,
        appointmentDate: newAppointmentForm.appointmentDate,
        appointmentTime: newAppointmentForm.appointmentTime,
        reason: newAppointmentForm.reason || '',
        status: newAppointmentForm.status,
        overrideLimit: true, // Admin can override limits
      });

      showNotification('Appointment created successfully', 'success');
      setShowCreateModal(false);
      setNewAppointmentForm({
        patientId: '',
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
        status: 'pending',
      });
      fetchAppointments();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to create appointment', 'error');
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status: newStatus });
      showNotification('Appointment status updated successfully', 'success');
      fetchAppointments();
      setShowModal(false);
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to update appointment status', 'error');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by patient name, doctor name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            All ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Pending ({appointments.filter((a) => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'confirmed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Confirmed ({appointments.filter((a) => a.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Completed ({appointments.filter((a) => a.status === 'completed').length})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'cancelled'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Cancelled ({appointments.filter((a) => a.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No appointments found
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{appointment.patient?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{appointment.patient?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{formatDoctorName(appointment.doctor?.user?.name || 'N/A', appointment.doctor?.qualification)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {format(parseISO(appointment.appointmentDate), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-gray-500">{appointment.appointmentTime}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{appointment.reason || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(appointment.status)}`}>
                        {appointment.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowModal(true);
                        }}
                        className="px-3 py-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appointment Details Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Appointment Details</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Patient Name</p>
                    <p className="font-semibold text-gray-800">{selectedAppointment.patient?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Patient Email</p>
                    <p className="font-semibold text-gray-800">{selectedAppointment.patient?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Doctor Name</p>
                    <p className="font-semibold text-gray-800">{formatDoctorName(selectedAppointment.doctor?.user?.name || 'N/A', selectedAppointment.doctor?.qualification)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    <p className="font-semibold text-gray-800">
                      {format(parseISO(selectedAppointment.appointmentDate), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Time</p>
                    <p className="font-semibold text-gray-800">{selectedAppointment.appointmentTime || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(selectedAppointment.status)}`}>
                      {selectedAppointment.status || 'N/A'}
                    </span>
                  </div>
                </div>
                {selectedAppointment.reason && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Reason</p>
                    <p className="font-semibold text-gray-800">{selectedAppointment.reason}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Update Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(selectedAppointment.id, status)}
                        disabled={selectedAppointment.status === status}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedAppointment.status === status
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-teal-600 text-white hover:bg-teal-700'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAppointment(null);
                }}
                className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AppointmentsManagementView.displayName = 'AppointmentsManagementView';

const PrescriptionsManagementView = () => {
  const { showNotification } = useNotification();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, searchQuery]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prescriptions?limit=1000');
      setPrescriptions(response.data.prescriptions || []);
      setFilteredPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      showNotification('Failed to fetch prescriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = [...prescriptions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pres) =>
          pres.patient?.name?.toLowerCase().includes(query) ||
          pres.patient?.email?.toLowerCase().includes(query) ||
          pres.doctor?.user?.name?.toLowerCase().includes(query) ||
          pres.diagnosis?.toLowerCase().includes(query)
      );
    }

    setFilteredPrescriptions(filtered);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by patient name, doctor name, email, or diagnosis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Prescriptions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Diagnosis
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Medicines
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No prescriptions found
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <tr key={prescription.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{prescription.patient?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{prescription.patient?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{formatDoctorName(prescription.doctor?.user?.name || 'N/A', prescription.doctor?.qualification)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{prescription.diagnosis || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {prescription.medicines && Array.isArray(prescription.medicines)
                          ? `${prescription.medicines.length} medicine(s)`
                          : 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {prescription.createdAt
                          ? format(parseISO(prescription.createdAt), 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPrescription(prescription);
                          setShowModal(true);
                        }}
                        className="px-3 py-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prescription Details Modal */}
      {showModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Prescription Details</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPrescription(null);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Patient Name</p>
                    <p className="font-semibold text-gray-800">{selectedPrescription.patient?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Patient Email</p>
                    <p className="font-semibold text-gray-800">{selectedPrescription.patient?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Doctor Name</p>
                    <p className="font-semibold text-gray-800">{formatDoctorName(selectedPrescription.doctor?.user?.name || 'N/A', selectedPrescription.doctor?.qualification)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    <p className="font-semibold text-gray-800">
                      {selectedPrescription.createdAt
                        ? format(parseISO(selectedPrescription.createdAt), 'MMMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Diagnosis</p>
                  <p className="font-semibold text-gray-800">{selectedPrescription.diagnosis || 'N/A'}</p>
                </div>

                {selectedPrescription.medicines && Array.isArray(selectedPrescription.medicines) && selectedPrescription.medicines.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Medicines</p>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {selectedPrescription.medicines.map((medicine: any, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-teal-600 font-semibold">{index + 1}.</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{medicine.name || 'N/A'}</p>
                            {(medicine.dosage || medicine.frequency) && (
                              <p className="text-xs text-gray-600">
                                {medicine.dosage && `Dosage: ${medicine.dosage}`}
                                {medicine.dosage && medicine.frequency && ' • '}
                                {medicine.frequency && `Frequency: ${medicine.frequency}`}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPrescription.tests && Array.isArray(selectedPrescription.tests) && selectedPrescription.tests.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Tests</p>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {selectedPrescription.tests.map((test: any, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-teal-600 font-semibold">{index + 1}.</span>
                          <p className="text-sm text-gray-800">{test.name || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPrescription.rules && Array.isArray(selectedPrescription.rules) && selectedPrescription.rules.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Rules</p>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {selectedPrescription.rules.map((rule: any, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-teal-600 font-semibold">{index + 1}.</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{rule.title || 'N/A'}</p>
                            {rule.description && (
                              <p className="text-xs text-gray-600">{rule.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPrescription.instructions && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Instructions</p>
                    <p className="text-sm text-gray-800 whitespace-pre-line">{selectedPrescription.instructions}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPrescription(null);
                }}
                className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdsManagementView = React.forwardRef((props: any, ref: any) => {
  const { showNotification } = useNotification();
  const [ads, setAds] = useState<any[]>([]);
  const [filteredAds, setFilteredAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [adForm, setAdForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    targetAudience: 'all',
    isActive: true,
    startDate: '',
    endDate: '',
  });

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openCreateModal: () => {
      setAdForm({
        title: '',
        description: '',
        imageUrl: '',
        link: '',
        targetAudience: 'all',
        isActive: true,
        startDate: '',
        endDate: '',
      });
      setIsEditing(false);
      setSelectedAd(null);
      setShowCreateModal(true);
    },
  }));

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    filterAds();
  }, [ads, activeTab, searchQuery]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/ads?limit=1000');
      setAds(response.data.ads || []);
      setFilteredAds(response.data.ads || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      showNotification('Failed to fetch advertisements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterAds = () => {
    let filtered = [...ads];

    if (activeTab === 'active') {
      filtered = filtered.filter((ad) => ad.isActive === true);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter((ad) => ad.isActive === false);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ad) =>
          ad.title?.toLowerCase().includes(query) ||
          ad.description?.toLowerCase().includes(query)
      );
    }

    setFilteredAds(filtered);
  };

  const handleCreateAd = async () => {
    try {
      await api.post('/ads', adForm);
      showNotification('Advertisement created successfully', 'success');
      setShowCreateModal(false);
      setAdForm({
        title: '',
        description: '',
        imageUrl: '',
        link: '',
        targetAudience: 'all',
        isActive: true,
        startDate: '',
        endDate: '',
      });
      fetchAds();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to create advertisement', 'error');
    }
  };

  const handleUpdateAd = async () => {
    try {
      await api.put(`/ads/${selectedAd.id}`, adForm);
      showNotification('Advertisement updated successfully', 'success');
      setShowModal(false);
      setIsEditing(false);
      setSelectedAd(null);
      fetchAds();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to update advertisement', 'error');
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) {
      return;
    }

    try {
      await api.delete(`/ads/${adId}`);
      showNotification('Advertisement deleted successfully', 'success');
      fetchAds();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to delete advertisement', 'error');
    }
  };

  const openEditModal = (ad: any) => {
    setSelectedAd(ad);
    setAdForm({
      title: ad.title || '',
      description: ad.description || '',
      imageUrl: ad.imageUrl || '',
      link: ad.link || '',
      targetAudience: ad.targetAudience || 'all',
      isActive: ad.isActive !== undefined ? ad.isActive : true,
      startDate: ad.startDate ? format(parseISO(ad.startDate), 'yyyy-MM-dd') : '',
      endDate: ad.endDate ? format(parseISO(ad.endDate), 'yyyy-MM-dd') : '',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      {/* Header with Create Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search advertisements by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={() => {
            setAdForm({
              title: '',
              description: '',
              imageUrl: '',
              link: '',
              targetAudience: 'all',
              isActive: true,
              startDate: '',
              endDate: '',
            });
            setShowCreateModal(true);
          }}
          className="ml-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
        >
          <FiPlus className="text-lg" />
          Create Ad
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            All ({ads.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Active ({ads.filter((a) => a.isActive).length})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'inactive'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Inactive ({ads.filter((a) => !a.isActive).length})
          </button>
        </div>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAds.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 text-lg">No advertisements found</p>
          </div>
        ) : (
          filteredAds.map((ad) => (
            <div
              key={ad.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {ad.imageUrl && (
                <div className="w-full h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 flex-1">{ad.title}</h3>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      ad.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {ad.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ad.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Target: {ad.targetAudience || 'all'}</span>
                  <span>Clicks: {ad.clickCount || 0}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(ad)}
                    className="flex-1 px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAd(ad.id)}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isEditing ? 'Edit Advertisement' : 'Create Advertisement'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowCreateModal(false);
                    setIsEditing(false);
                    setSelectedAd(null);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input
                    type="text"
                    value={adForm.title}
                    onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter advertisement title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={adForm.description}
                    onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    rows={3}
                    placeholder="Enter advertisement description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={adForm.imageUrl}
                    onChange={(e) => setAdForm({ ...adForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link URL</label>
                  <input
                    type="url"
                    value={adForm.link}
                    onChange={(e) => setAdForm({ ...adForm, link: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                    <select
                      value={adForm.targetAudience}
                      onChange={(e) => setAdForm({ ...adForm, targetAudience: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="all">All</option>
                      <option value="patient">Patients</option>
                      <option value="doctor">Doctors</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={adForm.isActive ? 'true' : 'false'}
                      onChange={(e) => setAdForm({ ...adForm, isActive: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={adForm.startDate}
                      onChange={(e) => setAdForm({ ...adForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                    <input
                      type="date"
                      value={adForm.endDate}
                      onChange={(e) => setAdForm({ ...adForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowCreateModal(false);
                  setIsEditing(false);
                  setSelectedAd(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (isEditing) {
                    handleUpdateAd();
                  } else {
                    handleCreateAd();
                  }
                }}
                disabled={!adForm.title.trim()}
                className={`flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors ${
                  !adForm.title.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AdsManagementView.displayName = 'AdsManagementView';

// Admin Chats Management View - Full access to chat with all users
const AdminChatsManagementView = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchChatUsers();
      fetchConversations();
      fetchUnreadCount();
    }
  }, [user]);

  // Real-time polling
  useEffect(() => {
    if (user && user.role === 'admin') {
      const globalPollInterval = setInterval(() => {
        fetchChatUsers();
        fetchConversations();
        if (selectedConversation) {
          fetchMessages(selectedConversation.id);
        }
        fetchUnreadCount();
      }, 2000);

      return () => clearInterval(globalPollInterval);
    }
  }, [user, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(selectedConversation.id);
        fetchConversations();
        fetchUnreadCount();
      }, 2000);
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatUsers = async () => {
    try {
      const response = await api.get('/chat/users');
      setAllUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching chat users:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const response = await api.get(`/chat/messages/${userId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/chat/unread-count');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSelectUser = (userItem: any) => {
    const existingConversation = conversations.find(c => c.id === userItem.id);
    if (existingConversation) {
      handleSelectConversation(existingConversation);
    } else {
      const newConversation = {
        id: userItem.id,
        name: userItem.name,
        email: userItem.email,
        role: userItem.role,
        phone: userItem.phone,
        lastMessage: userItem.lastMessage || 'No messages yet',
        lastMessageTime: userItem.lastMessageTime || new Date(),
        unreadCount: userItem.unreadCount || 0,
      };
      setSelectedConversation(newConversation);
      setMessages([]);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Search by ID, name, email, or phone
  const filteredUsers = allUsers.filter((userItem: any) => {
    const query = searchQuery.toLowerCase();
    return (
      userItem.name.toLowerCase().includes(query) ||
      userItem.email.toLowerCase().includes(query) ||
      userItem.id.toLowerCase().includes(query) ||
      (userItem.phone && userItem.phone.includes(query)) ||
      userItem.role.toLowerCase().includes(query)
    );
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await api.post('/chat/send', {
        receiverId: selectedConversation.id,
        content: newMessage.trim(),
      });
      setNewMessage('');
      setTimeout(() => {
        fetchMessages(selectedConversation.id);
        fetchConversations();
        fetchChatUsers();
        fetchUnreadCount();
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      showNotification(error.response?.data?.message || 'Failed to send message', 'error');
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

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors">
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col transition-colors">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
              All Users {unreadCount > 0 && `(${unreadCount})`}
            </h2>
            {/* Search Bar with Auto-suggestions - Search by ID, Name, Email */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => {
                  if (searchQuery.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Search by ID, name, email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              />
              {showSuggestions && filteredUsers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto transition-colors">
                  {filteredUsers.slice(0, 5).map((userItem: any) => (
                    <div
                      key={userItem.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectUser(userItem);
                      }}
                      className="px-4 py-3 hover:bg-teal-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                          {getInitials(userItem.name)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 dark:text-gray-100">{userItem.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{userItem.role}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">ID: {userItem.id.slice(0, 8)}...</p>
                        </div>
                        {userItem.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            {userItem.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {allUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>No users available</p>
              </div>
            ) : (
              filteredUsers.map((userItem: any) => {
                const conversation = conversations.find(c => c.id === userItem.id);
                const isSelected = selectedConversation?.id === userItem.id;
                const displayData = conversation || userItem;
                return (
                  <div
                    key={userItem.id}
                    onClick={() => handleSelectUser(userItem)}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      isSelected ? 'bg-teal-50 dark:bg-gray-700 border-l-4 border-teal-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {getInitials(userItem.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{userItem.name}</h3>
                          {displayData.lastMessageTime && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(displayData.lastMessageTime), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">{displayData.lastMessage || 'No messages yet'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-500">ID: {userItem.id.slice(0, 8)}...</p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userItem.role}</p>
                        </div>
                      </div>
                      {userItem.unreadCount > 0 && (
                        <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full">
                          {userItem.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {getInitials(selectedConversation.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{selectedConversation.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{selectedConversation.role}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">ID: {selectedConversation.id.slice(0, 8)}...</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-teal-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                        } transition-colors`}
                      >
                        {!isOwn && (
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {message.sender.name}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {format(new Date(message.createdAt), 'h:mm a')}
                          </p>
                          {isOwn && (
                            <div className="flex items-center">
                              {message.isRead ? (
                                <span className="text-blue-300 text-xs ml-1 flex items-center gap-0.5">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-[10px]">Seen</span>
                                </span>
                              ) : (
                                <span className="text-gray-300 text-xs ml-1">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 transition-colors">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FiPaperclip className="text-xl text-gray-600 dark:text-gray-300" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSend className="text-xl" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FiMessageCircle className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">Select a user to start chatting</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Search by ID, name, email, or phone</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



