'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { FiUsers, FiPlus, FiEdit, FiTrash2, FiMail, FiPhone, FiX, FiDollarSign } from 'react-icons/fi';

export default function AdminEmployeesPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    joiningDate: '',
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
    fetchStaff();
  }, [user, authLoading, router]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/staff');
      setStaff(response.data.staff || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      showNotification('Failed to fetch staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await api.put(`/staff/${editingStaff.id}`, formData);
        showNotification('Staff member updated successfully', 'success');
      } else {
        await api.post('/staff', formData);
        showNotification('Staff member added successfully', 'success');
      }
      setShowModal(false);
      setEditingStaff(null);
      resetForm();
      fetchStaff();
    } catch (error: any) {
      console.error('Error saving staff:', error);
      showNotification(error.response?.data?.message || 'Failed to save staff member', 'error');
    }
  };

  const handleEdit = (staffMember: any) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.user?.name || '',
      email: staffMember.user?.email || '',
      password: '',
      phone: staffMember.user?.phone || '',
      position: staffMember.position || '',
      department: staffMember.department || '',
      salary: staffMember.salary || '',
      joiningDate: staffMember.joiningDate ? new Date(staffMember.joiningDate).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      await api.delete(`/staff/${id}`);
      showNotification('Staff member deleted successfully', 'success');
      fetchStaff();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      showNotification('Failed to delete staff member', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      position: '',
      department: '',
      salary: '',
      joiningDate: '',
    });
    setEditingStaff(null);
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar user={user} logout={logout} />
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        <AdminHeader 
          title="Staff Management"
          actionButton={{
            label: 'Add Staff',
            onClick: () => {
              resetForm();
              setShowModal(true);
            },
            icon: <FiPlus />
          }}
        />

        <div className="p-4 sm:p-6 lg:p-8">
          {staff.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-300">
              <FiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No staff members found</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first staff member</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold"
              >
                <FiPlus /> Add Staff
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map((staffMember) => (
                <div
                  key={staffMember.id}
                  className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 p-6 border-2 border-gray-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                        <FiUsers className="text-2xl text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{staffMember.user?.name}</h3>
                        <p className="text-sm text-gray-600">{staffMember.position || 'Staff'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(staffMember)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FiEdit className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(staffMember.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="text-red-600" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    {staffMember.user?.email && (
                      <div className="flex items-center gap-2">
                        <FiMail className="text-teal-600" />
                        <span>{staffMember.user.email}</span>
                      </div>
                    )}
                    {staffMember.user?.phone && (
                      <div className="flex items-center gap-2">
                        <FiPhone className="text-teal-600" />
                        <span>{staffMember.user.phone}</span>
                      </div>
                    )}
                    {staffMember.department && (
                      <div className="text-gray-700">
                        <span className="font-medium">Department:</span> {staffMember.department}
                      </div>
                    )}
                    {staffMember.salary && (
                      <div className="flex items-center gap-2 text-teal-600 font-semibold">
                        <FiDollarSign />
                        <span>${parseFloat(staffMember.salary).toLocaleString()}/month</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FiX className="text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>

                {!editingStaff && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingStaff}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g., Receptionist, Nurse"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold"
                  >
                    {editingStaff ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
