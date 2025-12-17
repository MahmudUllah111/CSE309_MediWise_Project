'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PatientSidebar from '@/components/PatientSidebar';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';
import { FiBell, FiSearch, FiMessageCircle } from 'react-icons/fi';

export default function PrescriptionsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientEmail: '',
    diagnosis: '',
    medicines: '',
    instructions: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  const fetchPrescriptions = async (cursor?: string) => {
    try {
      setLoading(true);
      const params: any = { limit: 10 };
      if (cursor) params.cursor = cursor;

      const response = await api.get('/prescriptions', { params });
      if (cursor) {
        setPrescriptions((prev) => [...prev, ...response.data.prescriptions]);
      } else {
        setPrescriptions(response.data.prescriptions);
      }
      setNextCursor(response.data.pagination.nextCursor);
      setHasMore(response.data.pagination.hasMore);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const medicinesArray = prescriptionForm.medicines
        .split('\n')
        .filter((m) => m.trim())
        .map((m) => ({ name: m.trim(), dosage: '', frequency: '' }));

      await api.post('/prescriptions', {
        patientEmail: prescriptionForm.patientEmail,
        diagnosis: prescriptionForm.diagnosis,
        medicines: medicinesArray,
        instructions: prescriptionForm.instructions,
      });
      setShowCreateModal(false);
      setPrescriptionForm({ patientEmail: '', diagnosis: '', medicines: '', instructions: '' });
      fetchPrescriptions();
      showNotification('Prescription created successfully!', 'success');
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to create prescription', 'error');
    }
  };

  const loadMore = () => {
    if (nextCursor && !loading) {
      fetchPrescriptions(nextCursor);
    }
  };

  if (authLoading) {
    return <Loading />; 
  }

  if (!user) {
    return null;
  }

  // Doctor-specific view with modern design
  if (user.role === 'doctor') {
    router.push('/doctor/prescriptions');
    return <Loading />; 
  }

  // Patient view with new design
  if (user.role === 'patient') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <PatientSidebar user={user} logout={logout} />
        <main className="ml-64 flex-1 transition-all duration-300">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">PRESCRIPTIONS</h1>
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
          {loading && prescriptions.length === 0 ? (
            <Loading />
          ) : prescriptions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No prescriptions found</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          {user.role === 'patient'
                            ? `Dr. ${prescription.doctor?.user?.name}`
                            : prescription.patient?.name}
                        </h3>
                        <p className="text-gray-600">
                          {format(new Date(prescription.prescriptionDate), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    </div>

                    {prescription.diagnosis && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-1">Diagnosis:</h4>
                        <p className="text-gray-600">{prescription.diagnosis}</p>
                      </div>
                    )}

                    {prescription.medicines && prescription.medicines.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">Medicines:</h4>
                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                          {prescription.medicines.map((med: any, index: number) => (
                            <li key={index}>
                              {med.name}
                              {med.dosage && ` - ${med.dosage}`}
                              {med.frequency && ` (${med.frequency})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {prescription.instructions && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-1">Instructions:</h4>
                        <p className="text-gray-600 whitespace-pre-line">{prescription.instructions}</p>
                      </div>
                    )}

                    {prescription.prescriptionFile && (
                      <div className="mt-4">
                        <a
                          href={prescription.prescriptionFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:underline"
                        >
                          View Prescription File
                        </a>
                      </div>
                    )}
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

          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Prescription</h2>
                <form onSubmit={handleCreatePrescription} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Email
                    </label>
                    <input
                      type="email"
                      value={prescriptionForm.patientEmail}
                      onChange={(e) =>
                        setPrescriptionForm({ ...prescriptionForm, patientEmail: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="patient@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diagnosis
                    </label>
                    <textarea
                      value={prescriptionForm.diagnosis}
                      onChange={(e) =>
                        setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medicines (one per line)
                    </label>
                    <textarea
                      value={prescriptionForm.medicines}
                      onChange={(e) =>
                        setPrescriptionForm({ ...prescriptionForm, medicines: e.target.value })
                      }
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Medicine 1\nMedicine 2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructions
                    </label>
                    <textarea
                      value={prescriptionForm.instructions}
                      onChange={(e) =>
                        setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      Create Prescription
                    </button>
                  </div>
                </form>
              </div>
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Prescriptions</h1>
            <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
              >
                Create Prescription
              </button>
          </div>

          {loading && prescriptions.length === 0 ? (
            <Loading />
          ) : prescriptions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No prescriptions found</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          {user.role === 'patient'
                            ? `Dr. ${prescription.doctor?.user?.name}`
                            : prescription.patient?.name}
                        </h3>
                        <p className="text-gray-600">
                          {format(new Date(prescription.prescriptionDate), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    </div>

                    {prescription.diagnosis && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-1">Diagnosis:</h4>
                        <p className="text-gray-600">{prescription.diagnosis}</p>
                      </div>
                    )}

                    {prescription.medicines && prescription.medicines.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">Medicines:</h4>
                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                          {prescription.medicines.map((med: any, index: number) => (
                            <li key={index}>
                              {med.name}
                              {med.dosage && ` - ${med.dosage}`}
                              {med.frequency && ` (${med.frequency})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {prescription.instructions && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-1">Instructions:</h4>
                        <p className="text-gray-600 whitespace-pre-line">{prescription.instructions}</p>
                      </div>
                    )}

                    {prescription.prescriptionFile && (
                      <div className="mt-4">
                        <a
                          href={prescription.prescriptionFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:underline"
                        >
                          View Prescription File
                        </a>
                      </div>
                    )}
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

          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Prescription</h2>
                <form onSubmit={handleCreatePrescription} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Email
                    </label>
                    <input
                      type="email"
                      value={prescriptionForm.patientEmail}
                      onChange={(e) =>
                        setPrescriptionForm({ ...prescriptionForm, patientEmail: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="patient@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diagnosis
                    </label>
                    <textarea
                      value={prescriptionForm.diagnosis}
                      onChange={(e) =>
                        setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medicines (one per line)
                    </label>
                    <textarea
                      value={prescriptionForm.medicines}
                      onChange={(e) =>
                        setPrescriptionForm({ ...prescriptionForm, medicines: e.target.value })
                      }
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Medicine 1\nMedicine 2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructions
                    </label>
                    <textarea
                      value={prescriptionForm.instructions}
                      onChange={(e) =>
                        setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}