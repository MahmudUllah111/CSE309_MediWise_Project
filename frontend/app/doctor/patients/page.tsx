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
import { format, parseISO } from 'date-fns';
import { FiLogOut, FiUsers } from 'react-icons/fi';

export default function DoctorPatientsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'doctor')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchDoctorProfile();
      fetchPatients();
    }
  }, [user]);

  const fetchDoctorProfile = async () => {
    try {
      const response = await api.get('/doctors/profile/me');
      setDoctorProfile(response.data.doctor);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments?limit=1000');
      const appointments = response.data?.appointments || [];
      
      // Get unique patients from appointments
      const uniquePatients = new Map();
      appointments.forEach((appt: any) => {
        if (appt?.patient && appt.patient.id && !uniquePatients.has(appt.patient.id)) {
          uniquePatients.set(appt.patient.id, {
            ...appt.patient,
            lastAppointment: appt.appointmentDate,
            totalAppointments: 1,
          });
        } else if (appt?.patient && appt.patient.id) {
          const patient = uniquePatients.get(appt.patient.id);
          if (patient) {
            patient.totalAppointments += 1;
            if (appt.appointmentDate && patient.lastAppointment) {
              if (new Date(appt.appointmentDate) > new Date(patient.lastAppointment)) {
                patient.lastAppointment = appt.appointmentDate;
              }
            }
          }
        }
      });

      setPatients(Array.from(uniquePatients.values()));
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      // Set empty array on error to prevent UI crashes
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
      <main className="w-full flex-1 transition-all duration-300 lg:ml-[476px] pb-[180px] overflow-x-hidden">
        {/* Modern Header with Simple Color */}
        <header className="bg-teal-600 text-white shadow-xl">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Patients</h1>
            <p className="text-sm sm:text-base text-teal-100">
              Total {patients.length} patient{patients.length !== 1 ? 's' : ''}
            </p>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 text-xl font-bold">
                    {getInitials(patient.name || 'P')}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{patient.name}</h3>
                    <p className="text-sm text-gray-600">{patient.email}</p>
                    {patient.phone && (
                      <p className="text-sm text-gray-600">{patient.phone}</p>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Total Visits:</span>
                    <span className="font-bold text-gray-800">{patient.totalAppointments || 0}</span>
                  </div>
                  {patient.lastAppointment && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="font-semibold">Last Visit:</span>
                      <span className="font-bold text-gray-800">
                        {format(parseISO(patient.lastAppointment), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {patients.length === 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-300">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FiUsers className="text-4xl text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No patients yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}