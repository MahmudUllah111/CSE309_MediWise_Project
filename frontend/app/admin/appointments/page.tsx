'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { FiX, FiCalendar, FiPlus } from 'react-icons/fi';
import { formatDoctorName } from '@/utils/doctorName';

export default function AdminAppointmentsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
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
      fetchAppointments();
    }
  }, [user]);

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

  const openCreateModal = async () => {
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
          title="Appointments Management"
          actionButton={{
            label: 'Create Appointment',
            onClick: openCreateModal,
            icon: <FiPlus />
          }}
        />

        <div className="p-4 sm:p-6 lg:p-8">

          {/* Search and Filter */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by patient name, doctor name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-6 border-b-2 border-gray-200">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({appointments.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({appointments.filter((a) => a.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('confirmed')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'confirmed'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Confirmed ({appointments.filter((a) => a.status === 'confirmed').length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'completed'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed ({appointments.filter((a) => a.status === 'completed').length})
              </button>
              <button
                onClick={() => setActiveTab('cancelled')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'cancelled'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Cancelled ({appointments.filter((a) => a.status === 'cancelled').length})
              </button>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-white rounded-xl shadow-xl border-2 border-gray-300 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Reason
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
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <FiX className="text-gray-600" />
                  </button>
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
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
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

                <div className="p-6 border-t-2 border-gray-200 bg-gray-50">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="w-full px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Appointment Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b-2 border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">Create New Appointment</h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <FiX className="text-xl text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                      <select
                        value={newAppointmentForm.patientId}
                        onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, patientId: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      >
                        <option value="">Select Patient</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
                      <select
                        value={newAppointmentForm.doctorId}
                        onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, doctorId: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      >
                        <option value="">Select Doctor</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {formatDoctorName(d.user?.name || '', d.qualification)} ({d.specialization})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={newAppointmentForm.appointmentDate}
                        onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, appointmentDate: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                      <input
                        type="time"
                        value={newAppointmentForm.appointmentTime}
                        onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, appointmentTime: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                      <textarea
                        value={newAppointmentForm.reason}
                        onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, reason: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={newAppointmentForm.status}
                        onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, status: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t-2 border-gray-200 bg-gray-50 flex gap-3">
                  <button
                    onClick={handleCreateAppointment}
                    className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium transition-colors"
                  >
                    Create Appointment
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}