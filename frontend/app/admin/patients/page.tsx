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
  FiUsers, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiMail, 
  FiPhone,
  FiMoreVertical,
  FiEye,
  FiX,
  FiChevronDown
} from 'react-icons/fi';

export default function AdminPatientsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState<any>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    if (user && user.role === 'admin') {
      fetchPatients();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    filterPatients();
  }, [patients, searchQuery, sortColumn, sortDirection]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users?limit=1000');
      const allUsers = response.data.users || [];
      // Filter only patients
      const patientList = allUsers.filter((u: any) => u.role === 'patient');
      setPatients(patientList);
      setFilteredPatients(patientList);
    } catch (error) {
      console.error('Error fetching patients:', error);
      showNotification('Failed to fetch patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];
    
    // Only show patients (already filtered in fetchPatients, but double-check)
    filtered = filtered.filter((p) => p.role === 'patient');
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.phone?.toLowerCase().includes(query)
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
    
    setFilteredPatients(filtered);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const openPatientModal = async (patient: any, editMode: boolean) => {
    try {
      const fullPatient = await api.get(`/admin/users/${patient.id}`);
      setSelectedPatient(fullPatient.data.user);
      setEditPatientForm({
        name: fullPatient.data.user.name || '',
        email: fullPatient.data.user.email || '',
        phone: fullPatient.data.user.phone || '',
        address: fullPatient.data.user.address || '',
        dateOfBirth: fullPatient.data.user.dateOfBirth ? new Date(fullPatient.data.user.dateOfBirth).toISOString().split('T')[0] : '',
        weight: fullPatient.data.user.weight || '',
        height: fullPatient.data.user.height || '',
        homePhone: fullPatient.data.user.homePhone || '',
        workPhone: fullPatient.data.user.workPhone || '',
        allergies: Array.isArray(fullPatient.data.user.allergies) ? fullPatient.data.user.allergies : [],
        bloodPressure: fullPatient.data.user.bloodPressure || '',
        pulse: fullPatient.data.user.pulse || '',
      });
      setIsEditingPatient(editMode);
      setShowPatientModal(true);
      setActionMenuOpen(null);
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to fetch patient details', 'error');
    }
  };

  const handleUpdatePatient = async () => {
    try {
      const updateData = {
        ...editPatientForm,
        allergies: Array.isArray(editPatientForm.allergies) ? editPatientForm.allergies : [],
      };

      await api.put(`/admin/users/${selectedPatient.id}`, updateData);
      showNotification('Patient updated successfully', 'success');
      setIsEditingPatient(false);
      setShowPatientModal(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to update patient', 'error');
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    
    try {
      await api.delete(`/admin/users/${patientId}`);
      showNotification('Patient deleted successfully', 'success');
      fetchPatients();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to delete patient', 'error');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'patient':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'doctor':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
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
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        <AdminHeader 
          title="Patient Management"
          searchPlaceholder="Search patients by name, email, or phone..."
          onSearch={setSearchQuery}
        />

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <p className="text-gray-600">
              <span className="font-semibold text-teal-600">{filteredPatients.length}</span> patient{filteredPatients.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-300 overflow-hidden">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <FiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No patients found</h3>
                <p className="text-gray-600">
                  {searchQuery ? 'Try adjusting your search query' : 'Patients will appear here once they register'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Name
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                              {patient.name?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{patient.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{patient.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{patient.phone || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {patient.address ? (patient.address.length > 30 ? patient.address.substring(0, 30) + '...' : patient.address) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuOpen(actionMenuOpen === patient.id ? null : patient.id);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <FiMoreVertical className="text-gray-600" />
                          </button>
                          {actionMenuOpen === patient.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPatientModal(patient, false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <FiEye className="text-base" />
                                View Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPatientModal(patient, true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <FiEdit className="text-base" />
                                Edit Patient
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePatient(patient.id);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <FiTrash2 className="text-base" />
                                Delete Patient
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Patient Details/Edit Modal */}
        {showPatientModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border-2 border-gray-300 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditingPatient ? 'Edit Patient' : 'Patient Details'}
                </h2>
                <button
                  onClick={() => {
                    setShowPatientModal(false);
                    setSelectedPatient(null);
                    setIsEditingPatient(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              <div className="p-6">
                {isEditingPatient ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        value={editPatientForm.name}
                        onChange={(e) => setEditPatientForm({ ...editPatientForm, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={editPatientForm.email}
                        onChange={(e) => setEditPatientForm({ ...editPatientForm, email: e.target.value })}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={editPatientForm.phone}
                        onChange={(e) => setEditPatientForm({ ...editPatientForm, phone: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <textarea
                        value={editPatientForm.address}
                        onChange={(e) => setEditPatientForm({ ...editPatientForm, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleUpdatePatient}
                        className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold"
                      >
                        Update Patient
                      </button>
                      <button
                        onClick={() => {
                          setShowPatientModal(false);
                          setSelectedPatient(null);
                          setIsEditingPatient(false);
                        }}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Name</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedPatient.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedPatient.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Phone</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedPatient.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Address</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedPatient.address || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setIsEditingPatient(true)}
                        className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold"
                      >
                        Edit Patient
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Click outside to close menu */}
        {actionMenuOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setActionMenuOpen(null)}
          />
        )}
      </main>
    </div>
  );
}

