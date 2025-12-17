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
import { FiX } from 'react-icons/fi';
import { formatDoctorName } from '@/utils/doctorName';

export default function AdminPrescriptionsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      if (user.role === 'patient') {
        router.push('/patient/dashboard');
      } else if (user.role === 'doctor') {
        router.push('/doctor/dashboard');
      } else {
        router.push('/dashboard');
      }
      return;
    }
    if (user && user.role === 'admin') {
      fetchPrescriptions();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, searchQuery]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prescriptions?limit=1000');
      setPrescriptions(response.data.prescriptions || []);
      setFilteredPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      showNotification('Failed to fetch prescriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = [...prescriptions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pres) =>
          pres.patient?.name?.toLowerCase().includes(query) ||
          pres.patient?.email?.toLowerCase().includes(query) ||
          pres.doctor?.user?.name?.toLowerCase().includes(query) ||
          pres.diagnosis?.toLowerCase().includes(query)
      );
    }

    setFilteredPrescriptions(filtered);
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        <AdminHeader
          title="Prescriptions Management"
          searchPlaceholder="Search by patient name, doctor name, email, or diagnosis..."
          onSearch={(query) => setSearchQuery(query)}
        />
        <div className="p-8">
          {/* Prescriptions Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Diagnosis
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Medicines
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {filteredPrescriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No prescriptions found
                      </td>
                    </tr>
                  ) : (
                    filteredPrescriptions.map((prescription) => (
                      <tr key={prescription.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{prescription.patient?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{prescription.patient?.email || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 dark:text-gray-100">{formatDoctorName(prescription.doctor?.user?.name || 'N/A', prescription.doctor?.qualification)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 dark:text-gray-100">{prescription.diagnosis || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {prescription.medicines && Array.isArray(prescription.medicines)
                              ? `${prescription.medicines.length} medicine(s)`
                              : 'N/A'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {prescription.createdAt
                              ? format(parseISO(prescription.createdAt), 'MMM dd, yyyy')
                              : 'N/A'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedPrescription(prescription);
                              setShowModal(true);
                            }}
                            className="px-3 py-1 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
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

          {/* Prescription Details Modal */}
          {showModal && selectedPrescription && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
                setSelectedPrescription(null);
              }
            }}>
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Prescription Details</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedPrescription(null);
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
                        <p className="font-semibold text-gray-900">{selectedPrescription.patient?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Patient Email</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{selectedPrescription.patient?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Doctor Name</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{formatDoctorName(selectedPrescription.doctor?.user?.name || 'N/A', selectedPrescription.doctor?.qualification)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {selectedPrescription.createdAt
                            ? format(parseISO(selectedPrescription.createdAt), 'MMMM dd, yyyy')
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Diagnosis</p>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{selectedPrescription.diagnosis || 'N/A'}</p>
                    </div>

                    {selectedPrescription.medicines && Array.isArray(selectedPrescription.medicines) && selectedPrescription.medicines.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Medicines</p>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2 transition-colors">
                          {selectedPrescription.medicines.map((medicine: any, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="text-teal-600 dark:text-teal-400 font-semibold">{index + 1}.</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{medicine.name || 'N/A'}</p>
                                {(medicine.dosage || medicine.frequency) && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {medicine.dosage && `Dosage: ${medicine.dosage}`}
                                    {medicine.dosage && medicine.frequency && ' • '}
                                    {medicine.frequency && `Frequency: ${medicine.frequency}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPrescription.tests && Array.isArray(selectedPrescription.tests) && selectedPrescription.tests.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tests</p>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2 transition-colors">
                          {selectedPrescription.tests.map((test: any, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="text-teal-600 dark:text-teal-400 font-semibold">{index + 1}.</span>
                              <p className="text-sm text-gray-800 dark:text-gray-100">{test.name || 'N/A'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPrescription.rules && Array.isArray(selectedPrescription.rules) && selectedPrescription.rules.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Rules</p>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2 transition-colors">
                          {selectedPrescription.rules.map((rule: any, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="text-teal-600 dark:text-teal-400 font-semibold">{index + 1}.</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{rule.title || 'N/A'}</p>
                                {rule.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{rule.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPrescription.instructions && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Instructions</p>
                        <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line">{selectedPrescription.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedPrescription(null);
                    }}
                    className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
                  >
                    Close
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