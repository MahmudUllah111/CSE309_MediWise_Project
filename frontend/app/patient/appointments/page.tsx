'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import PatientSidebar from '@/components/PatientSidebar';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { FiCalendar, FiClock, FiUser, FiX, FiFileText, FiMapPin, FiDollarSign } from 'react-icons/fi';
import { formatDoctorName } from '@/utils/doctorName';

export default function PatientAppointmentsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'patient')) {
      router.push('/login');
      return;
    }
    if (user && user.role === 'patient') {
      fetchAppointments();
    }
  }, [user, authLoading, router, activeTab]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      let allAppointments = response.data.appointments || [];

      // Filter by patient ID
      allAppointments = allAppointments.filter((appt: any) => {
        return appt.patient?.id === user?.id || appt.patientId === user?.id;
      });

      // Filter by status if not 'all'
      if (activeTab !== 'all') {
        allAppointments = allAppointments.filter((apt: any) => apt.status === activeTab);
      }

      // Sort by date (newest first) and then by time
      allAppointments.sort((a: any, b: any) => {
        const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime || '00:00'}`);
        const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime || '00:00'}`);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });

      setAppointments(allAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      showNotification('Failed to fetch appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status: 'cancelled' });
      showNotification('Appointment cancelled successfully', 'success');
      fetchAppointments();
      setShowModal(false);
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to cancel appointment', 'error');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'patient') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <PatientSidebar user={user} logout={logout} />
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        {/* Modern Header with Simple Color */}
        <header className="bg-teal-600 text-white shadow-xl">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Appointments</h1>
              <p className="text-sm sm:text-base text-teal-100">View and manage your scheduled appointments</p>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Status Tabs - Modern Design */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300 shadow-md'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Appointments List - Modern Design */}
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-gray-300 text-center">
                <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FiCalendar className="text-4xl text-teal-600" />
                </div>
                <p className="text-gray-600 text-lg mb-2 font-semibold">No appointments found</p>
                <p className="text-gray-500 text-sm">
                  {activeTab !== 'all' 
                    ? `No ${activeTab} appointments found`
                    : 'You don\'t have any appointments yet'}
                </p>
              </div>
            ) : (
              appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  onClick={() => handleAppointmentClick(appointment)}
                  className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all cursor-pointer transform hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 text-xl font-bold shadow-lg ring-4 ring-white ring-opacity-50">
                          {appointment.doctor?.user?.name?.charAt(0)?.toUpperCase() || 'D'}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800">
                            {formatDoctorName(appointment.doctor?.user?.name || 'Doctor', appointment.doctor?.qualification)}
                          </h3>
                          <p className="text-sm text-gray-600 font-medium">{appointment.doctor?.specialization || 'General'}</p>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md ${
                            appointment.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : appointment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : appointment.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                            <FiCalendar className="text-teal-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-800">
                            {format(parseISO(appointment.appointmentDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                            <FiClock className="text-teal-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{appointment.appointmentTime}</span>
                        </div>
                        {appointment.doctor?.consultationFee && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <FiDollarSign className="text-blue-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-800">${appointment.doctor.consultationFee}</span>
                          </div>
                        )}
                        {appointment.reason && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <FiFileText className="text-purple-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-800 truncate">{appointment.reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Appointment Details Modal */}
      {showModal && selectedAppointment && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowModal(false);
            setSelectedAppointment(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {format(parseISO(selectedAppointment.appointmentDate), 'MMMM d, yyyy')}
                </p>
              </div>
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

            {/* Modal Content */}
            <div className="px-6 py-5 space-y-6">
              {/* Doctor Info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                    {selectedAppointment.doctor?.user?.name?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {formatDoctorName(selectedAppointment.doctor?.user?.name || 'Doctor', selectedAppointment.doctor?.qualification)}
                    </h3>
                    <p className="text-sm text-gray-600">{selectedAppointment.doctor?.specialization || 'General'}</p>
                    {selectedAppointment.doctor?.department && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <FiMapPin className="text-teal-600" />
                        <span>
                          {typeof selectedAppointment.doctor.department === 'string'
                            ? selectedAppointment.doctor.department
                            : selectedAppointment.doctor.department?.name || 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                      selectedAppointment.status
                    )}`}
                  >
                    {selectedAppointment.status}
                  </span>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <FiCalendar className="text-teal-600 text-xl" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold text-gray-800">
                      {format(parseISO(selectedAppointment.appointmentDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <FiClock className="text-teal-600 text-xl" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-semibold text-gray-800">{selectedAppointment.appointmentTime}</p>
                  </div>
                </div>

                {selectedAppointment.doctor?.consultationFee && (
                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                    <FiDollarSign className="text-teal-600 text-xl" />
                    <div>
                      <p className="text-sm text-gray-500">Consultation Fee</p>
                      <p className="font-semibold text-gray-800">${selectedAppointment.doctor.consultationFee}</p>
                    </div>
                  </div>
                )}

                {selectedAppointment.reason && (
                  <div className="p-3 bg-white border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Reason for Visit</p>
                    <p className="text-gray-800">{selectedAppointment.reason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                    className="flex-1 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all"
                  >
                    Cancel Appointment
                  </button>
                </div>
              )}

              {selectedAppointment.status === 'cancelled' && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="w-full px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                  >
                    Close
                  </button>
                </div>
              )}

              {selectedAppointment.status === 'completed' && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="w-full px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}