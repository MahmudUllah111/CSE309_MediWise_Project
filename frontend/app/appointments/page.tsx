'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PatientSidebar from '@/components/PatientSidebar';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { FiCalendar, FiMessageCircle, FiPhone, FiChevronRight, FiSearch, FiClock, FiLogOut, FiX, FiBell } from 'react-icons/fi';

export default function AppointmentsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([]);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientEmail: '',
    diagnosis: '',
    medicines: '',
    tests: '',
    rules: '',
    instructions: '',
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      if (user.role === 'doctor') {
        fetchDoctorProfile();
      } else {
        fetchAppointments();
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && (user.role !== 'doctor' || doctorProfile)) {
      fetchAppointments();
    }
  }, [selectedDate, doctorProfile]);

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
      const params: any = { limit: 100 };
      if (user?.role === 'doctor') {
        params.doctorId = doctorProfile?.id;
      }
      
      const response = await api.get('/appointments', { params });
      const allAppointments = response.data.appointments || [];
      
      // Filter appointments for selected date
      const filteredAppointments = allAppointments.filter((appt: any) => {
        const apptDate = format(parseISO(appt.appointmentDate), 'yyyy-MM-dd');
        return apptDate === dateStr && appt.status !== 'cancelled';
      });

      // Sort by time
      filteredAppointments.sort((a: any, b: any) => {
        const timeA = a.appointmentTime || '00:00';
        const timeB = b.appointmentTime || '00:00';
        return timeA.localeCompare(timeB);
      });

      setAppointments(filteredAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group appointments by time slots for better visualization
  const groupAppointmentsByTime = () => {
    const grouped: { [key: string]: any[] } = {};
    appointments.forEach((appt) => {
      const time = appt.appointmentTime || '00:00';
      if (!grouped[time]) {
        grouped[time] = [];
      }
      grouped[time].push(appt);
    });
    return grouped;
  };

  const groupedAppointments = groupAppointmentsByTime();
  const sortedTimes = Object.keys(groupedAppointments).sort();

  // Get patient initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get patient age from dateOfBirth
  const getPatientAge = (patient: any) => {
    if (!patient?.dateOfBirth) return 'N/A';
    const birthDate = new Date(patient.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleAppointmentClick = async (appt: any) => {
    setSelectedAppointment(appt);
    setLoadingPatientDetails(true);
    try {
      // Fetch patient prescriptions
      const response = await api.get(`/prescriptions?patientId=${appt.patientId}`);
      setPatientPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      setPatientPrescriptions([]);
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return { years: 0, months: 0 };
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    if (today.getDate() < birthDate.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 11;
      }
    }
    return { years, months };
  };

  const formatDateOfBirth = (dob: string) => {
    if (!dob) return 'N/A';
    const date = new Date(dob);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const formatDateDisplay = (date: Date) => {
    return {
      day: format(date, 'EEEE'),
      date: format(date, 'd MMM'),
      year: format(date, 'yyyy'),
    };
  };

  const handleCreatePrescription = async () => {
    try {
      const medicinesArray = prescriptionForm.medicines
        .split('\n')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
        .map((m) => {
          const parts = m.split('-').map((p) => p.trim());
          return {
            name: parts[0] || m,
            dosage: parts[1] || '',
            frequency: parts[2] || '',
          };
        });

      const testsArray = prescriptionForm.tests
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((t) => ({ name: t, description: '' }));

      const rulesArray = prescriptionForm.rules
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => r.length > 0)
        .map((r) => ({ title: r, description: '' }));

      await api.post('/prescriptions', {
        patientEmail: prescriptionForm.patientEmail,
        diagnosis: prescriptionForm.diagnosis,
        medicines: medicinesArray,
        tests: testsArray,
        rules: rulesArray,
        instructions: prescriptionForm.instructions,
      });

        showNotification('Prescription created successfully!', 'success');
        setShowPrescriptionModal(false);
        setPrescriptionForm({ patientEmail: '', diagnosis: '', medicines: '', tests: '', rules: '', instructions: '' });
        
        // Refresh patient prescriptions if modal is shown
        if (selectedAppointment) {
          const response = await api.get(`/prescriptions?patientId=${selectedAppointment.patientId}`);
          setPatientPrescriptions(response.data.prescriptions || []);
        }
      } catch (error: any) {
        console.error('Error creating prescription:', error);
        showNotification(error.response?.data?.message || 'Failed to create prescription', 'error');
      }
  };

  const dateDisplay = formatDateDisplay(selectedDate);

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'next' ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  // Doctor-specific view with modern design
  if (user.role === 'doctor') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Enhanced Sidebar with Doctor Profile */}
        <div className="fixed left-0 top-0 h-full w-72 bg-white shadow-lg z-10">
          {/* Doctor Profile Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col items-center">
              {doctorProfile?.profileImage ? (
                <img
                  src={`data:${doctorProfile.profileImageMimeType || 'image/jpeg'};base64,${doctorProfile.profileImage}`}
                  alt={user.name || 'Doctor'}
                  className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {getInitials(user.name || 'D')}
                </div>
              )}
              <h2 className="text-lg font-bold text-gray-800">{doctorProfile?.user?.name || user.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{doctorProfile?.specialization || 'Doctor'}</p>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="p-6 border-b border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{dateDisplay.day}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{dateDisplay.date.split(' ')[0]}</p>
              <p className="text-xs text-gray-500 mt-1">{dateDisplay.date.split(' ')[1]} {dateDisplay.year}</p>
              <div className="flex items-center justify-center mt-3 gap-2">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiChevronRight className="rotate-180 text-gray-600" />
                </button>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-3 py-1 text-xs text-teal-600 hover:bg-teal-50 rounded"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiChevronRight className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1">
            <Link
              href="/appointments"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600"
            >
              <FiCalendar className="text-xl" />
              <span>APPOINTMENTS</span>
            </Link>
            <Link
              href="/doctor/patients"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiMessageCircle className="text-xl" />
              <span>MY PATIENTS</span>
            </Link>
            <Link
              href="/doctor/chat"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiMessageCircle className="text-xl" />
              <span>CHATS</span>
            </Link>
            <Link
              href="/doctor/prescriptions"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiCalendar className="text-xl" />
              <span>PRESCRIPTIONS</span>
            </Link>
            <Link
              href="/doctor/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiCalendar className="text-xl" />
              <span>SETTINGS</span>
            </Link>
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to logout?')) {
                  logout();
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-red-200"
            >
              <FiLogOut className="text-xl" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="ml-72 flex-1 p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 uppercase tracking-tight">Appointments</h1>
              <p className="text-gray-600 mt-2">
                You have {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} {format(selectedDate, 'EEEE')}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4 mb-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <FiSearch className="text-xl text-gray-600" />
                </button>
                <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                  <FiMessageCircle className="text-xl text-gray-600" />
                  <span className="absolute top-0 right-0 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    2
                  </span>
                </button>
                <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                  <FiPhone className="text-xl text-gray-600" />
                  <span className="absolute top-0 right-0 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    1
                  </span>
                </button>
              </div>
              <div className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <FiClock className="text-blue-600" />
                {formatTime(currentTime)}
              </div>
            </div>
          </div>

          {/* Appointments Grid */}
          {appointments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg">No appointments scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedTimes.map((time, timeIndex) => (
                <div key={time}>
                  {/* Time Marker */}
                  <div className="flex items-center mb-4">
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded">
                      {time}
                    </span>
                    <div className="flex-1 h-px bg-gray-200 ml-4"></div>
                  </div>

                  {/* Appointment Cards for this time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedAppointments[time].map((appt) => (
                      <div
                        key={appt.id}
                        onClick={() => handleAppointmentClick(appt)}
                        className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-all border border-gray-100 cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {appt.patient?.name || 'Patient'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {getPatientAge(appt.patient)} years
                            </p>
                            <p className="text-sm text-gray-700 mt-2 font-medium">
                              {appt.reason || 'General Consultation'}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-semibold ml-3">
                            {getInitials(appt.patient?.name || 'P')}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/doctor/chat');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            <FiMessageCircle />
                            Chat
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (appt.patient?.phone) {
                                window.location.href = `tel:${appt.patient.phone}`;
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            <FiPhone />
                            Call
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Patient Detail Modal */}
          {selectedAppointment && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedAppointment(null);
                  setPatientPrescriptions([]);
                }
              }}
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {loadingPatientDetails ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                  </div>
                ) : (
                  <>
                    {/* Modal Header */}
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-indigo-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                            {getInitials(selectedAppointment.patient?.name || 'P')}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-800 uppercase">
                              {selectedAppointment.patient?.name || 'Patient'}
                            </h2>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span>
                                <span className="font-semibold">DOB:</span> {formatDateOfBirth(selectedAppointment.patient?.dateOfBirth)}
                              </span>
                              {selectedAppointment.patient?.dateOfBirth && (
                                <span>
                                  <span className="font-semibold">AGE:</span> {calculateAge(selectedAppointment.patient.dateOfBirth).years} years {calculateAge(selectedAppointment.patient.dateOfBirth).months} months
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAppointment(null);
                            setPatientPrescriptions([]);
                          }}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <FiX className="text-xl text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Modal Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* Contact & Address */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Contact</h3>
                          <p className="text-gray-800">{selectedAppointment.patient?.email || 'N/A'}</p>
                          <p className="text-gray-800">{selectedAppointment.patient?.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Address</h3>
                          <p className="text-gray-800">{selectedAppointment.patient?.address || 'No address provided'}</p>
                        </div>
                      </div>

                      {/* Appointment Agenda */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Appointment Agenda:</h3>
                        <p className="text-gray-800 text-lg">{selectedAppointment.reason || 'General Consultation'}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {format(parseISO(selectedAppointment.appointmentDate), 'EEEE, MMMM dd, yyyy')} at {selectedAppointment.appointmentTime}
                        </p>
                      </div>

                      {/* Prescribed Drugs */}
                      {patientPrescriptions.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Prescribed Drugs:</h3>
                          <ul className="space-y-2">
                            {patientPrescriptions
                              .flatMap((prescription: any) => prescription.medicines || [])
                              .filter((med: any, index: number, self: any[]) => 
                                self.findIndex((m: any) => (typeof med === 'string' ? med : med.name) === (typeof m === 'string' ? m : m.name)) === index
                              )
                              .map((med: any, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-gray-800">
                                  <span className="text-teal-600 mt-1">•</span>
                                  <span>
                                    <span className="font-semibold">{typeof med === 'string' ? med : med.name || med}</span>
                                    {typeof med === 'object' && med.dosage && (
                                      <span className="text-gray-600"> - {med.dosage}</span>
                                    )}
                                    {typeof med === 'object' && med.frequency && (
                                      <span className="text-gray-600"> ({med.frequency})</span>
                                    )}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}

                      {/* Medical Notes from Latest Prescription */}
                      {patientPrescriptions.length > 0 && patientPrescriptions[0].instructions && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes:</h3>
                          <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                            {patientPrescriptions[0].instructions}
                          </p>
                        </div>
                      )}

                      {/* Diagnosis from Latest Prescription */}
                      {patientPrescriptions.length > 0 && patientPrescriptions[0].diagnosis && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Recent Diagnosis:</h3>
                          <p className="text-gray-800">{patientPrescriptions[0].diagnosis}</p>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer - Action Buttons */}
                    <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-4">
                      <button
                        onClick={() => {
                          router.push('/doctor/chat');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        <FiMessageCircle className="text-xl" />
                        Chat
                      </button>
                      <button
                        onClick={() => {
                          if (selectedAppointment.patient?.phone) {
                            window.location.href = `tel:${selectedAppointment.patient.phone}`;
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        <FiPhone className="text-xl" />
                        Call
                      </button>
                          <button
                            onClick={() => {
                              setPrescriptionForm({
                                patientEmail: selectedAppointment.patient?.email || '',
                                diagnosis: patientPrescriptions.length > 0 ? patientPrescriptions[0].diagnosis || '' : '',
                                medicines: '',
                                tests: '',
                                rules: '',
                                instructions: '',
                              });
                              setShowPrescriptionModal(true);
                            }}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-lg hover:from-teal-700 hover:to-indigo-700 transition-all font-medium shadow-md"
                          >
                            New Prescription
                          </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Prescription Modal - Higher z-index to appear over patient info modal */}
          {showPrescriptionModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowPrescriptionModal(false);
                }
              }}
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-indigo-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Create New Prescription</h2>
                    <p className="text-sm text-gray-600 mt-1">Fill in all the details for the patient's prescription</p>
                  </div>
                  <button
                    onClick={() => setShowPrescriptionModal(false)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FiX className="text-xl text-gray-600" />
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="overflow-y-auto flex-1 p-6">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleCreatePrescription();
                  }} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Patient Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={prescriptionForm.patientEmail}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientEmail: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="patient@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diagnosis
                      </label>
                      <textarea
                        value={prescriptionForm.diagnosis}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter the diagnosis..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💊 Medicines <span className="text-xs text-gray-500 font-normal">(one per line, format: Name - Dosage - Frequency)</span>
                      </label>
                      <textarea
                        value={prescriptionForm.medicines}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicines: e.target.value })}
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
                        placeholder="Paracetamol - 500mg - 2 times daily&#10;Amoxicillin - 250mg - 3 times daily&#10;Vitamin D - 1000IU - Once daily"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Example: Medicine Name - Dosage - Frequency (one per line)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔬 Tests / Lab Tests <span className="text-xs text-gray-500 font-normal">(one per line)</span>
                      </label>
                      <textarea
                        value={prescriptionForm.tests}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, tests: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Blood Test&#10;Chest X-Ray&#10;ECG&#10;Urine Analysis"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📋 Rules & Guidelines <span className="text-xs text-gray-500 font-normal">(one per line)</span>
                      </label>
                      <textarea
                        value={prescriptionForm.rules}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, rules: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Avoid spicy food&#10;Take rest for 3 days&#10;Drink plenty of water&#10;Avoid alcohol"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📝 Additional Instructions
                      </label>
                      <textarea
                        value={prescriptionForm.instructions}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter any additional instructions for the patient..."
                      />
                    </div>
                  </form>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPrescriptionModal(false);
                      setPrescriptionForm({ patientEmail: '', diagnosis: '', medicines: '', tests: '', rules: '', instructions: '' });
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreatePrescription}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-lg hover:from-teal-700 hover:to-indigo-700 font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    Create Prescription
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Patient view with new design
  if (user.role === 'patient') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <PatientSidebar user={user} logout={logout} />
        <main className="ml-64 flex-1 transition-all duration-300">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">MY APPOINTMENTS</h1>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FiSearch className="text-xl text-gray-600" />
              </button>
              <Link href="/patient/chat" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FiMessageCircle className="text-xl text-gray-600" />
              </Link>
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FiBell className="text-xl text-gray-600" />
              </button>
            </div>
          </header>
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div key={appt.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {user.role === 'patient'
                          ? `Dr. ${appt.doctor?.user?.name}`
                          : appt.patient?.name}
                      </h3>
                      <p className="text-gray-600">
                        {format(parseISO(appt.appointmentDate), 'MMMM dd, yyyy')} at {appt.appointmentTime}
                      </p>
                      {appt.reason && <p className="text-gray-500 mt-2">{appt.reason}</p>}
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
          )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Admin/Other roles view
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">My Appointments</h1>
          {appointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div key={appt.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {user.role === 'patient'
                          ? `Dr. ${appt.doctor?.user?.name}`
                          : appt.patient?.name}
                      </h3>
                      <p className="text-gray-600">
                        {format(parseISO(appt.appointmentDate), 'MMMM dd, yyyy')} at {appt.appointmentTime}
                      </p>
                      {appt.reason && <p className="text-gray-500 mt-2">{appt.reason}</p>}
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
          )}
        </div>
      </main>
    </div>
  );
}


  const formatDateDisplay = (date: Date) => {
    return {
      day: format(date, 'EEEE'),
      date: format(date, 'd MMM'),
      year: format(date, 'yyyy'),
    };
  };

  const handleCreatePrescription = async () => {
    try {
      const medicinesArray = prescriptionForm.medicines
        .split('\n')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
        .map((m) => {
          const parts = m.split('-').map((p) => p.trim());
          return {
            name: parts[0] || m,
            dosage: parts[1] || '',
            frequency: parts[2] || '',
          };
        });

      const testsArray = prescriptionForm.tests
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((t) => ({ name: t, description: '' }));

      const rulesArray = prescriptionForm.rules
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => r.length > 0)
        .map((r) => ({ title: r, description: '' }));

      await api.post('/prescriptions', {
        patientEmail: prescriptionForm.patientEmail,
        diagnosis: prescriptionForm.diagnosis,
        medicines: medicinesArray,
        tests: testsArray,
        rules: rulesArray,
        instructions: prescriptionForm.instructions,
      });

        showNotification('Prescription created successfully!', 'success');
        setShowPrescriptionModal(false);
        setPrescriptionForm({ patientEmail: '', diagnosis: '', medicines: '', tests: '', rules: '', instructions: '' });
        
        // Refresh patient prescriptions if modal is shown
        if (selectedAppointment) {
          const response = await api.get(`/prescriptions?patientId=${selectedAppointment.patientId}`);
          setPatientPrescriptions(response.data.prescriptions || []);
        }
      } catch (error: any) {
        console.error('Error creating prescription:', error);
        showNotification(error.response?.data?.message || 'Failed to create prescription', 'error');
      }
  };

  const dateDisplay = formatDateDisplay(selectedDate);

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'next' ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  // Doctor-specific view with modern design
  if (user.role === 'doctor') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Enhanced Sidebar with Doctor Profile */}
        <div className="fixed left-0 top-0 h-full w-72 bg-white shadow-lg z-10">
          {/* Doctor Profile Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col items-center">
              {doctorProfile?.profileImage ? (
                <img
                  src={`data:${doctorProfile.profileImageMimeType || 'image/jpeg'};base64,${doctorProfile.profileImage}`}
                  alt={user.name || 'Doctor'}
                  className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {getInitials(user.name || 'D')}
                </div>
              )}
              <h2 className="text-lg font-bold text-gray-800">{doctorProfile?.user?.name || user.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{doctorProfile?.specialization || 'Doctor'}</p>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="p-6 border-b border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{dateDisplay.day}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{dateDisplay.date.split(' ')[0]}</p>
              <p className="text-xs text-gray-500 mt-1">{dateDisplay.date.split(' ')[1]} {dateDisplay.year}</p>
              <div className="flex items-center justify-center mt-3 gap-2">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiChevronRight className="rotate-180 text-gray-600" />
                </button>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-3 py-1 text-xs text-teal-600 hover:bg-teal-50 rounded"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiChevronRight className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1">
            <Link
              href="/appointments"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600"
            >
              <FiCalendar className="text-xl" />
              <span>APPOINTMENTS</span>
            </Link>
            <Link
              href="/doctor/patients"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiMessageCircle className="text-xl" />
              <span>MY PATIENTS</span>
            </Link>
            <Link
              href="/doctor/chat"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiMessageCircle className="text-xl" />
              <span>CHATS</span>
            </Link>
            <Link
              href="/doctor/prescriptions"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiCalendar className="text-xl" />
              <span>PRESCRIPTIONS</span>
            </Link>
            <Link
              href="/doctor/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiCalendar className="text-xl" />
              <span>SETTINGS</span>
            </Link>
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to logout?')) {
                  logout();
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-red-200"
            >
              <FiLogOut className="text-xl" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="ml-72 flex-1 p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 uppercase tracking-tight">Appointments</h1>
              <p className="text-gray-600 mt-2">
                You have {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} {format(selectedDate, 'EEEE')}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4 mb-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <FiSearch className="text-xl text-gray-600" />
                </button>
                <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                  <FiMessageCircle className="text-xl text-gray-600" />
                  <span className="absolute top-0 right-0 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    2
                  </span>
                </button>
                <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                  <FiPhone className="text-xl text-gray-600" />
                  <span className="absolute top-0 right-0 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    1
                  </span>
                </button>
              </div>
              <div className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <FiClock className="text-blue-600" />
                {formatTime(currentTime)}
              </div>
            </div>
          </div>

          {/* Appointments Grid */}
          {appointments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg">No appointments scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedTimes.map((time, timeIndex) => (
                <div key={time}>
                  {/* Time Marker */}
                  <div className="flex items-center mb-4">
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded">
                      {time}
                    </span>
                    <div className="flex-1 h-px bg-gray-200 ml-4"></div>
                  </div>

                  {/* Appointment Cards for this time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedAppointments[time].map((appt) => (
                      <div
                        key={appt.id}
                        onClick={() => handleAppointmentClick(appt)}
                        className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-all border border-gray-100 cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {appt.patient?.name || 'Patient'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {getPatientAge(appt.patient)} years
                            </p>
                            <p className="text-sm text-gray-700 mt-2 font-medium">
                              {appt.reason || 'General Consultation'}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-semibold ml-3">
                            {getInitials(appt.patient?.name || 'P')}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/doctor/chat');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            <FiMessageCircle />
                            Chat
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (appt.patient?.phone) {
                                window.location.href = `tel:${appt.patient.phone}`;
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            <FiPhone />
                            Call
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Patient Detail Modal */}
          {selectedAppointment && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedAppointment(null);
                  setPatientPrescriptions([]);
                }
              }}
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {loadingPatientDetails ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                  </div>
                ) : (
                  <>
                    {/* Modal Header */}
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-indigo-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                            {getInitials(selectedAppointment.patient?.name || 'P')}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-800 uppercase">
                              {selectedAppointment.patient?.name || 'Patient'}
                            </h2>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span>
                                <span className="font-semibold">DOB:</span> {formatDateOfBirth(selectedAppointment.patient?.dateOfBirth)}
                              </span>
                              {selectedAppointment.patient?.dateOfBirth && (
                                <span>
                                  <span className="font-semibold">AGE:</span> {calculateAge(selectedAppointment.patient.dateOfBirth).years} years {calculateAge(selectedAppointment.patient.dateOfBirth).months} months
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAppointment(null);
                            setPatientPrescriptions([]);
                          }}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <FiX className="text-xl text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Modal Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* Contact & Address */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Contact</h3>
                          <p className="text-gray-800">{selectedAppointment.patient?.email || 'N/A'}</p>
                          <p className="text-gray-800">{selectedAppointment.patient?.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Address</h3>
                          <p className="text-gray-800">{selectedAppointment.patient?.address || 'No address provided'}</p>
                        </div>
                      </div>

                      {/* Appointment Agenda */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Appointment Agenda:</h3>
                        <p className="text-gray-800 text-lg">{selectedAppointment.reason || 'General Consultation'}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {format(parseISO(selectedAppointment.appointmentDate), 'EEEE, MMMM dd, yyyy')} at {selectedAppointment.appointmentTime}
                        </p>
                      </div>

                      {/* Prescribed Drugs */}
                      {patientPrescriptions.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Prescribed Drugs:</h3>
                          <ul className="space-y-2">
                            {patientPrescriptions
                              .flatMap((prescription: any) => prescription.medicines || [])
                              .filter((med: any, index: number, self: any[]) => 
                                self.findIndex((m: any) => (typeof med === 'string' ? med : med.name) === (typeof m === 'string' ? m : m.name)) === index
                              )
                              .map((med: any, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-gray-800">
                                  <span className="text-teal-600 mt-1">•</span>
                                  <span>
                                    <span className="font-semibold">{typeof med === 'string' ? med : med.name || med}</span>
                                    {typeof med === 'object' && med.dosage && (
                                      <span className="text-gray-600"> - {med.dosage}</span>
                                    )}
                                    {typeof med === 'object' && med.frequency && (
                                      <span className="text-gray-600"> ({med.frequency})</span>
                                    )}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}

                      {/* Medical Notes from Latest Prescription */}
                      {patientPrescriptions.length > 0 && patientPrescriptions[0].instructions && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes:</h3>
                          <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                            {patientPrescriptions[0].instructions}
                          </p>
                        </div>
                      )}

                      {/* Diagnosis from Latest Prescription */}
                      {patientPrescriptions.length > 0 && patientPrescriptions[0].diagnosis && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Recent Diagnosis:</h3>
                          <p className="text-gray-800">{patientPrescriptions[0].diagnosis}</p>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer - Action Buttons */}
                    <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-4">
                      <button
                        onClick={() => {
                          router.push('/doctor/chat');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        <FiMessageCircle className="text-xl" />
                        Chat
                      </button>
                      <button
                        onClick={() => {
                          if (selectedAppointment.patient?.phone) {
                            window.location.href = `tel:${selectedAppointment.patient.phone}`;
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        <FiPhone className="text-xl" />
                        Call
                      </button>
                          <button
                            onClick={() => {
                              setPrescriptionForm({
                                patientEmail: selectedAppointment.patient?.email || '',
                                diagnosis: patientPrescriptions.length > 0 ? patientPrescriptions[0].diagnosis || '' : '',
                                medicines: '',
                                tests: '',
                                rules: '',
                                instructions: '',
                              });
                              setShowPrescriptionModal(true);
                            }}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-lg hover:from-teal-700 hover:to-indigo-700 transition-all font-medium shadow-md"
                          >
                            New Prescription
                          </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Prescription Modal - Higher z-index to appear over patient info modal */}
          {showPrescriptionModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowPrescriptionModal(false);
                }
              }}
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-indigo-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Create New Prescription</h2>
                    <p className="text-sm text-gray-600 mt-1">Fill in all the details for the patient's prescription</p>
                  </div>
                  <button
                    onClick={() => setShowPrescriptionModal(false)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FiX className="text-xl text-gray-600" />
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="overflow-y-auto flex-1 p-6">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleCreatePrescription();
                  }} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Patient Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={prescriptionForm.patientEmail}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientEmail: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="patient@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diagnosis
                      </label>
                      <textarea
                        value={prescriptionForm.diagnosis}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter the diagnosis..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💊 Medicines <span className="text-xs text-gray-500 font-normal">(one per line, format: Name - Dosage - Frequency)</span>
                      </label>
                      <textarea
                        value={prescriptionForm.medicines}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicines: e.target.value })}
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
                        placeholder="Paracetamol - 500mg - 2 times daily&#10;Amoxicillin - 250mg - 3 times daily&#10;Vitamin D - 1000IU - Once daily"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Example: Medicine Name - Dosage - Frequency (one per line)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔬 Tests / Lab Tests <span className="text-xs text-gray-500 font-normal">(one per line)</span>
                      </label>
                      <textarea
                        value={prescriptionForm.tests}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, tests: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Blood Test&#10;Chest X-Ray&#10;ECG&#10;Urine Analysis"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📋 Rules & Guidelines <span className="text-xs text-gray-500 font-normal">(one per line)</span>
                      </label>
                      <textarea
                        value={prescriptionForm.rules}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, rules: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Avoid spicy food&#10;Take rest for 3 days&#10;Drink plenty of water&#10;Avoid alcohol"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📝 Additional Instructions
                      </label>
                      <textarea
                        value={prescriptionForm.instructions}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter any additional instructions for the patient..."
                      />
                    </div>
                  </form>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPrescriptionModal(false);
                      setPrescriptionForm({ patientEmail: '', diagnosis: '', medicines: '', tests: '', rules: '', instructions: '' });
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreatePrescription}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-lg hover:from-teal-700 hover:to-indigo-700 font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    Create Prescription
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Patient view with new design
  if (user.role === 'patient') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <PatientSidebar user={user} logout={logout} />
        <main className="ml-64 flex-1 transition-all duration-300">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">MY APPOINTMENTS</h1>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FiSearch className="text-xl text-gray-600" />
              </button>
              <Link href="/patient/chat" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FiMessageCircle className="text-xl text-gray-600" />
              </Link>
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FiBell className="text-xl text-gray-600" />
              </button>
            </div>
          </header>
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div key={appt.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {user.role === 'patient'
                          ? `Dr. ${appt.doctor?.user?.name}`
                          : appt.patient?.name}
                      </h3>
                      <p className="text-gray-600">
                        {format(parseISO(appt.appointmentDate), 'MMMM dd, yyyy')} at {appt.appointmentTime}
                      </p>
                      {appt.reason && <p className="text-gray-500 mt-2">{appt.reason}</p>}
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
          )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Admin/Other roles view
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">My Appointments</h1>
          {appointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div key={appt.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {user.role === 'patient'
                          ? `Dr. ${appt.doctor?.user?.name}`
                          : appt.patient?.name}
                      </h3>
                      <p className="text-gray-600">
                        {format(parseISO(appt.appointmentDate), 'MMMM dd, yyyy')} at {appt.appointmentTime}
                      </p>
                      {appt.reason && <p className="text-gray-500 mt-2">{appt.reason}</p>}
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
          )}
        </div>
      </main>
    </div>
  );
}

            <>
              <div className="space-y-4">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          {user.role === 'patient'
                            ? `Dr. ${appt.doctor?.user?.name}`
                            : appt.patient?.name}
                        </h3>
                        {user.role === 'patient' && (
                          <p className="text-gray-600 mb-2">
                            {appt.doctor?.specialization} - {appt.doctor?.department?.name}
                          </p>
                        )}
                        <p className="text-gray-600">
                          {format(new Date(appt.appointmentDate), 'MMMM dd, yyyy')} at {appt.appointmentTime}
                        </p>
                        {appt.reason && (
                          <p className="text-gray-500 mt-2">{appt.reason}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-3">
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
                        {user.role === 'doctor' && appt.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateAppointmentStatus(appt.id, 'confirmed')}
                              className="px-4 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(appt.id, 'cancelled')}
                              className="px-4 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {user.role === 'doctor' && appt.status === 'confirmed' && (
                          <button
                            onClick={() => updateAppointmentStatus(appt.id, 'completed')}
                            className="px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

