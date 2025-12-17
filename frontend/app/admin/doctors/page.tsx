'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { FiCheck, FiX, FiEdit, FiMoreVertical, FiTrash2, FiFileText, FiPlus } from 'react-icons/fi';

export default function AdminDoctorsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
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
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPendingDoctors();
      fetchApprovedDoctors();
      fetchDepartments();
    }
  }, [user]);

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

  if (authLoading || (loading && approvedDoctors.length === 0)) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar user={user} logout={logout} />
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        <AdminHeader title="Doctors Management" />

        <div className="p-4 sm:p-6 lg:p-8">

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
            <div className="flex items-center gap-6 border-b-2 border-gray-200">
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'approved'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Approved Doctors ({approvedDoctors.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending Doctors ({pendingDoctors.length})
              </button>
            </div>
          </div>

          {activeTab === 'pending' && pendingDoctors.length === 0 && (
            <div className="bg-white rounded-xl shadow-xl p-8 text-center border-2 border-gray-300">
              <p className="text-gray-600 text-lg">No pending doctor applications</p>
            </div>
          )}

          {activeTab === 'pending' && pendingDoctors.length > 0 && (
            <div className="space-y-4">
              {pendingDoctors.map((doctor) => (
                <div 
                  key={doctor.id} 
                  onClick={() => openModal(doctor)}
                  className="bg-white rounded-xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-xl font-bold overflow-hidden">
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
                      className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors ml-4"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'approved' && approvedDoctors.length === 0 && (
            <div className="bg-white rounded-xl shadow-xl p-8 text-center border-2 border-gray-300">
              <p className="text-gray-600 text-lg">No approved doctors yet</p>
            </div>
          )}

          {activeTab === 'approved' && approvedDoctors.length > 0 && (
            <div className="bg-white rounded-xl shadow-xl border-2 border-gray-300 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
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
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {approvedDoctors.map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-xs font-bold">
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
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border-2 border-gray-300 py-2 z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModal(doctor, true);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                              >
                                <FiEdit className="text-base" />
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
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                              >
                                <FiEdit className="text-base" />
                                Edit
                              </button>
                              <div className="border-t-2 border-gray-200 my-2"></div>
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
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isEditingDoctor ? 'Edit Doctor Profile' : selectedDoctor._isApproved ? 'Doctor Details' : 'Review Doctor Application'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedDoctor(null);
                      setNotes('');
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <FiX className="text-gray-600" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                  <div className="flex items-start gap-6 mb-6 pb-6 border-b-2 border-gray-200">
                    <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-3xl font-bold overflow-hidden">
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

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6 pb-6 border-b-2 border-gray-200">
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
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
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
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
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
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
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
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="font-semibold text-gray-800">BDT {selectedDoctor.consultationFee || 0}</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-6 pb-6 border-b-2 border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Qualifications</h4>
                    {isEditingDoctor && selectedDoctor._isApproved ? (
                      <textarea
                        value={editDoctorForm.qualification}
                        onChange={(e) => setEditDoctorForm({ ...editDoctorForm, qualification: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                        rows={4}
                      />
                    ) : (
                      <p className="text-gray-700 whitespace-pre-line">{selectedDoctor.qualification || 'N/A'}</p>
                    )}
                  </div>

                  <div className="mb-6 pb-6 border-b-2 border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Bio</h4>
                    {isEditingDoctor && selectedDoctor._isApproved ? (
                      <textarea
                        value={editDoctorForm.bio}
                        onChange={(e) => setEditDoctorForm({ ...editDoctorForm, bio: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                        rows={4}
                      />
                    ) : (
                      <p className="text-gray-700">{selectedDoctor.bio || 'N/A'}</p>
                    )}
                  </div>

                  {!selectedDoctor._isApproved && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Notes (Optional for approval, Required for rejection)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Add any notes or comments about this doctor application..."
                      />
                    </div>
                  )}
                </div>

                <div className="p-6 border-t-2 border-gray-200 bg-gray-50 flex gap-4">
                  {selectedDoctor._isApproved ? (
                    isEditingDoctor ? (
                      <>
                        <button
                          onClick={() => {
                            setIsEditingDoctor(false);
                          }}
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-medium text-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateDoctor}
                          className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium transition-colors"
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
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-medium text-gray-700 transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => setIsEditingDoctor(true)}
                          className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium transition-colors"
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
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-medium text-gray-700 transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleReject(selectedDoctor.id)}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center justify-center gap-2 font-medium transition-colors"
                      >
                        <FiX className="text-lg" />
                        Reject Application
                      </button>
                      <button
                        onClick={() => handleApprove(selectedDoctor.id)}
                        className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 flex items-center justify-center gap-2 font-medium transition-colors"
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
      </main>
    </div>
  );
}

