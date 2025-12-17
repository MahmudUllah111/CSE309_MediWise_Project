'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import DoctorSidebar from '@/components/DoctorSidebar';
import MedicineAdPanel from '@/components/MedicineAdPanel';
import BottomAdPanel from '@/components/BottomAdPanel';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { FiCalendar, FiClock, FiUser, FiChevronLeft, FiChevronRight, FiX, FiCheck, FiCheckCircle, FiFileText, FiLogOut } from 'react-icons/fi';

export default function DoctorAppointmentsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'doctor')) {
      router.push('/login');
      return;
    }
    if (user && user.role === 'doctor') {
      fetchDoctorProfile();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'doctor' && doctorProfile) {
      fetchAppointments();
    }
  }, [selectedDate, doctorProfile, activeTab, user]);
  
  // Auto-refresh appointments every 30 seconds for real-time updates
  useEffect(() => {
    if (user && user.role === 'doctor' && doctorProfile) {
      const refreshInterval = setInterval(() => {
        console.log('Auto-refreshing doctor appointments from database...');
        fetchAppointments();
      }, 30000); // Refresh every 30 seconds for real-time updates
      
      return () => clearInterval(refreshInterval);
    }
  }, [user, doctorProfile]);

  const fetchDoctorProfile = async () => {
    try {
      const response = await api.get('/doctors/profile/me');
      setDoctorProfile(response.data.doctor);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await api.get(`/appointments?doctorId=${doctorProfile?.id}&limit=1000`);
      let allAppointments = response.data.appointments || [];

      // Filter by date
      allAppointments = allAppointments.filter((appt: any) => {
        const apptDate = format(parseISO(appt.appointmentDate), 'yyyy-MM-dd');
        return apptDate === dateStr;
      });

      // Filter by status if not 'all'
      if (activeTab !== 'all') {
        allAppointments = allAppointments.filter((apt: any) => apt.status === activeTab);
      }

      // Sort by time
      allAppointments.sort((a: any, b: any) => {
        const timeA = a.appointmentTime || '00:00';
        const timeB = b.appointmentTime || '00:00';
        return timeA.localeCompare(timeB);
      });

      setAppointments(allAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      showNotification('Failed to fetch appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status: newStatus });
      showNotification(`Appointment ${newStatus} successfully`, 'success');
      fetchAppointments();
      setShowModal(false);
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to update appointment', 'error');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      ?.map((n: string) => n[0])
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2) || 'P';
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'next' ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MedicineAdPanel targetAudience="doctor" />
      <DoctorSidebar user={user} logout={logout} qualification={doctorProfile?.qualification} />
      <BottomAdPanel />
      <main className="w-full flex-1 transition-all duration-300 lg:ml-[476px] pb-[180px] overflow-x-hidden">
        {/* Modern Header with Simple Color */}
        <header className="bg-teal-600 text-white shadow-xl">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Appointments</h1>
            <p className="text-sm sm:text-base text-teal-100">Manage your daily appointments</p>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Date Navigation */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-gray-300">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <FiChevronLeft className="text-xl text-gray-600" />
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                  {format(selectedDate, 'EEEE')}
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {format(selectedDate, 'MMM dd, yyyy')}
                </p>
                {isToday && (
                  <span className="inline-block mt-2 px-3 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded-full">
                    Today
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-4 py-2 text-sm bg-teal-600 text-white hover:bg-teal-700 rounded-xl transition-colors font-semibold shadow-lg"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FiChevronRight className="text-xl text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap transform hover:scale-105 ${
                    activeTab === tab.key
                      ? 'bg-teal-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300 shadow-md'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Appointments List */}
          {appointments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-300">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FiCalendar className="text-4xl text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No appointments for {format(selectedDate, 'MMM dd, yyyy')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all cursor-pointer transform hover:scale-[1.02]"
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setShowModal(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-lg">
                        {getInitials(appointment.patient?.name || 'Patient')}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg mb-1">
                          {appointment.patient?.name || 'Unknown Patient'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {appointment.patient?.email}
                        </p>
                        {appointment.patient?.phone && (
                          <p className="text-sm text-gray-600 mb-3">
                            {appointment.patient.phone}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                            <FiClock className="text-teal-600" />
                            <span className="font-semibold text-gray-800">{appointment.appointmentTime}</span>
                          </div>
                          {appointment.reason && (
                            <div className="text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                              <span className="font-semibold">Reason: </span>
                              {appointment.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex px-3 py-1 rounded-xl text-xs font-semibold ${
                          appointment.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : appointment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : appointment.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {appointment.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>

          {/* Patient Details Modal */}
          {showModal && selectedAppointment && (
            <div
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowModal(false);
                }
              }}
            >
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <FiX className="text-gray-600" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="overflow-y-auto flex-1 p-6">
                  <div className="space-y-6">
                    {/* Patient Info */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <FiUser className="text-teal-600 dark:text-teal-400" />
                        Patient Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Name</p>
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {selectedAppointment.patient?.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Email</p>
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {selectedAppointment.patient?.email || 'N/A'}
                          </p>
                        </div>
                        {selectedAppointment.patient?.phone && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Phone</p>
                            <p className="font-medium text-gray-800 dark:text-gray-100">
                              {selectedAppointment.patient.phone}
                            </p>
                          </div>
                        )}
                        {selectedAppointment.patient?.dateOfBirth && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Date of Birth</p>
                            <p className="font-medium text-gray-800 dark:text-gray-100">
                              {format(parseISO(selectedAppointment.patient.dateOfBirth), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Appointment Info */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <FiCalendar className="text-teal-600 dark:text-teal-400" />
                        Appointment Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Date</p>
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {format(parseISO(selectedAppointment.appointmentDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Time</p>
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {selectedAppointment.appointmentTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Status</p>
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getStatusBadgeColor(selectedAppointment.status)}`}
                          >
                            {selectedAppointment.status.toUpperCase()}
                          </span>
                        </div>
                        {selectedAppointment.reason && (
                          <div className="col-span-2">
                            <p className="text-gray-500 dark:text-gray-400">Reason</p>
                            <p className="font-medium text-gray-800 dark:text-gray-100">
                              {selectedAppointment.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex gap-4 flex-wrap">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 min-w-[100px] px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-medium text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const patientEmail = selectedAppointment.patient?.email;
                      if (patientEmail) {
                        router.push(`/doctor/prescriptions?patientEmail=${encodeURIComponent(patientEmail)}`);
                        setShowModal(false);
                      } else {
                        showNotification('Patient email not available', 'error');
                      }
                    }}
                    className="flex-1 min-w-[100px] px-4 py-3 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <FiFileText className="text-lg" />
                    Create Prescription
                  </button>
                  {selectedAppointment.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedAppointment.id, 'confirmed')}
                      className="flex-1 min-w-[100px] px-4 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FiCheck className="text-lg" />
                      Confirm
                    </button>
                  )}
                  {selectedAppointment.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedAppointment.id, 'completed')}
                      className="flex-1 min-w-[100px] px-4 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FiCheckCircle className="text-lg" />
                      Mark Complete
                    </button>
                  )}
                  {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this appointment?')) {
                          handleStatusUpdate(selectedAppointment.id, 'cancelled');
                        }
                      }}
                      className="flex-1 min-w-[100px] px-4 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 font-medium transition-colors"
                    >
                      Cancel
                    </button>
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



















