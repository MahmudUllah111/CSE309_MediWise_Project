'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { 
  FiMoreVertical, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiX, 
  FiPlus,
  FiChevronDown
} from 'react-icons/fi';

export default function AdminUsersPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'patients' | 'doctors' | 'admins'>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
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
      fetchUsers();
    }
  }, [user, authLoading, router]);

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
      showNotification('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    // Filter by role - only show the selected role
    if (activeTab === 'patients') {
      // Only show patients, exclude doctors, admins, and staff
      filtered = filtered.filter((u) => u.role === 'patient');
    } else if (activeTab === 'doctors') {
      // Only show doctors, exclude patients, admins, and staff
      filtered = filtered.filter((u) => u.role === 'doctor');
    } else if (activeTab === 'admins') {
      // Only show admins, exclude patients, doctors, and staff
      filtered = filtered.filter((u) => u.role === 'admin');
    }
    // 'all' shows all users (patients, doctors, admins, staff)
    
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
    
    // Ensure filteredUsers only contains the selected role
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
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'doctor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'patient': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
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

  const openUserModal = async (userItem: any, editMode: boolean = false) => {
    try {
      const response = await api.get(`/users/${userItem.id}`);
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

  const handleCreateClick = () => {
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
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const activeCount = filteredUsers.length;
  const totalCount = users.length;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <main className="ml-64 flex-1 transition-all duration-300">
        <AdminHeader
          title="Users Management"
          searchPlaceholder="Search users by name, email, or phone..."
          onSearch={(query) => setSearchQuery(query)}
          actionButton={{
            label: 'Add User',
            onClick: handleCreateClick,
            icon: <FiPlus className="text-lg" />,
          }}
        />
        <div className="p-8">
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                All Users ({totalCount})
              </button>
              <button
                onClick={() => setActiveTab('patients')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'patients'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Patients ({users.filter((u) => u.role === 'patient').length})
              </button>
              <button
                onClick={() => setActiveTab('doctors')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'doctors'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Doctors ({users.filter((u) => u.role === 'doctor').length})
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'admins'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
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
                            <FiMoreVertical className="text-gray-600 dark:text-gray-300" />
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
                              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUser(userItem.id, userItem.name);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
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
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowUserModal(false);
                setSelectedUser(null);
                setIsEditingUser(false);
                setIsCreatingUser(false);
              }
            }}>
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isCreatingUser ? 'Create New User' : isEditingUser ? 'Edit User' : 'User Details'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setSelectedUser(null);
                      setIsEditingUser(false);
                      setIsCreatingUser(false);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <FiX className="text-gray-600" />
                  </button>
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
      </main>
    </div>
  );
}