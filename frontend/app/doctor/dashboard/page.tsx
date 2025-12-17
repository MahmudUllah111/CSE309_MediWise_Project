'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/components/Loading';
import DoctorSidebar from '@/components/DoctorSidebar';
import MedicineAdPanel from '@/components/MedicineAdPanel';
import BottomAdPanel from '@/components/BottomAdPanel';
import api from '@/lib/api';
import { FiCalendar, FiFileText, FiClock, FiUsers, FiUser, FiLogOut } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { formatDoctorName } from '@/utils/doctorName';

export default function DoctorDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'doctor') {
      // Redirect to appropriate dashboard
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'patient') {
        router.push('/patient/dashboard');
      } else {
        router.push('/dashboard');
      }
      return;
    }
    if (user && user.role === 'doctor') {
      checkDoctorProfile();
    }
  }, [user, authLoading, router]);

  const checkDoctorProfile = async () => {
    try {
      const response = await api.get('/doctors/profile/me');
      const doctor = response.data.doctor;
      if (!doctor || doctor.status === 'pending') {
        // Redirect to complete profile if not completed or pending
        router.push('/doctor/complete-profile');
        return;
      } else if (doctor.status === 'approved') {
        setDoctorProfile(doctor);
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
      const appointments = await api.get('/appointments?limit=5');
      const prescriptions = await api.get('/prescriptions?limit=5');
      setStats({
        appointments: appointments.data.appointments || [],
        prescriptions: prescriptions.data.prescriptions || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        appointments: [],
        prescriptions: [],
      });
    } finally {
      setLoading(false);
    }
  };

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
      <main className="w-full flex-1 transition-all duration-300 lg:ml-[476px] pb-[180px] min-h-screen overflow-x-hidden">
        {/* Modern Header with Simple Color */}
        <header className="bg-teal-600 text-white shadow-xl">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {formatDoctorName(user.name, doctorProfile?.qualification)}!</h1>
            <p className="text-sm sm:text-base text-teal-100">Here's an overview of your schedule</p>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm uppercase mb-2 font-semibold">Today's Appointments</p>
                  <p className="text-5xl font-extrabold text-gray-800">
                    {stats?.appointments?.filter((a: any) => {
                      const apptDate = format(parseISO(a.appointmentDate), 'yyyy-MM-dd');
                      const today = format(new Date(), 'yyyy-MM-dd');
                      return apptDate === today;
                    }).length || 0}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-teal-100 flex items-center justify-center">
                  <FiCalendar className="text-3xl text-teal-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm uppercase mb-2 font-semibold">Total Appointments</p>
                  <p className="text-5xl font-extrabold text-gray-800">
                    {stats?.appointments?.length || 0}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FiClock className="text-3xl text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm uppercase mb-2 font-semibold">Prescriptions</p>
                  <p className="text-5xl font-extrabold text-gray-800">
                    {stats?.prescriptions?.length || 0}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center">
                  <FiFileText className="text-3xl text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm uppercase mb-2 font-semibold">Total Patients</p>
                  <p className="text-5xl font-extrabold text-gray-800">
                    {stats?.appointments ? [...new Set(stats.appointments.map((a: any) => a.patientId))].length : 0}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center">
                  <FiUsers className="text-3xl text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-2 border-gray-300 hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Today's Appointments</h2>
              <Link
                href="/doctor/appointments"
                className="text-teal-600 hover:text-teal-700 text-sm font-semibold transition-colors"
              >
                View All →
              </Link>
            </div>
            {stats?.appointments && stats.appointments.length > 0 ? (
              <div className="space-y-4">
                {stats.appointments
                  .filter((a: any) => {
                    const apptDate = format(parseISO(a.appointmentDate), 'yyyy-MM-dd');
                    const today = format(new Date(), 'yyyy-MM-dd');
                    return apptDate === today;
                  })
                  .slice(0, 5)
                  .map((appt: any) => (
                    <div
                      key={appt.id}
                      className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-lg">
                            {appt.patient?.name || 'Patient'}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            {format(parseISO(appt.appointmentDate), 'MM/dd/yyyy')} at {appt.appointmentTime}
                          </p>
                          {appt.reason && (
                            <p className="text-sm text-gray-700 mt-2 font-medium">{appt.reason}</p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-semibold ${
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
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FiCalendar className="text-4xl text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No appointments for today</p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/doctor/appointments"
              className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-xl bg-teal-100 flex items-center justify-center">
                <FiCalendar className="text-2xl text-teal-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">My Appointments</h3>
                <p className="text-sm text-gray-600">View and manage appointments</p>
              </div>
            </Link>
            <Link
              href="/doctor/prescriptions"
              className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center">
                <FiFileText className="text-2xl text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Prescriptions</h3>
                <p className="text-sm text-gray-600">Create and manage prescriptions</p>
              </div>
            </Link>
            <Link
              href="/doctor/profile"
              className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center">
                <FiUser className="text-2xl text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">My Profile</h3>
                <p className="text-sm text-gray-600">View and edit profile</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}