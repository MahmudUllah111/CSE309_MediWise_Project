'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { format } from 'date-fns';
import {
  FiBriefcase,
  FiUser,
  FiMail,
  FiPhone,
  FiFileText,
  FiCalendar,
  FiDollarSign,
  FiCheck,
  FiX,
  FiEye,
  FiEdit,
  FiDownload,
} from 'react-icons/fi';

export default function AdminApplicationsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      fetchApplications();
    }
  }, [user, authLoading, router, statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/job-applications/all');
      let allApplications = response.data.applications || [];
      
      // Filter by status
      if (statusFilter !== 'all') {
        allApplications = allApplications.filter((app: any) => app.status === statusFilter);
      }
      
      setApplications(allApplications);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      showNotification('Failed to fetch applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await api.put(`/job-applications/${id}/status`, { status: newStatus });
      showNotification('Application status updated successfully', 'success');
      fetchApplications();
      setShowModal(false);
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; label: string } } = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      reviewing: { color: 'bg-blue-100 text-blue-800', label: 'Reviewing' },
      shortlisted: { color: 'bg-purple-100 text-purple-800', label: 'Shortlisted' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar user={user} logout={logout} />
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        <AdminHeader title="Job Applications" />

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Filter */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('reviewing')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                statusFilter === 'reviewing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Reviewing
            </button>
            <button
              onClick={() => setStatusFilter('shortlisted')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                statusFilter === 'shortlisted'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Shortlisted
            </button>
            <button
              onClick={() => setStatusFilter('accepted')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                statusFilter === 'accepted'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Rejected
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-300">
              <FiBriefcase className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No applications found</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-300 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Job Position
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Salary Expectation
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Applied Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                              <FiUser className="text-teal-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {application.fullName}
                              </div>
                              {application.applicant && (
                                <div className="text-sm text-gray-500">
                                  User ID: {application.applicant.id.substring(0, 8)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {application.job?.title || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.job?.department || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <FiMail className="text-teal-600" />
                            {application.email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <FiPhone className="text-teal-600" />
                            {application.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {application.salaryExpectation || 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(application.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(application.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowModal(true);
                            }}
                            className="text-teal-600 hover:text-teal-900 mr-3"
                          >
                            <FiEye className="text-lg" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Application Details Modal */}
        {showModal && selectedApplication && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FiX className="text-gray-600" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiUser className="text-teal-600" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Full Name</label>
                      <p className="text-gray-900">{selectedApplication.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Email</label>
                      <p className="text-gray-900">{selectedApplication.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Phone</label>
                      <p className="text-gray-900">{selectedApplication.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Salary Expectation</label>
                      <p className="text-gray-900">{selectedApplication.salaryExpectation || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Job Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiBriefcase className="text-teal-600" /> Job Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Position</label>
                      <p className="text-gray-900">{selectedApplication.job?.title || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Department</label>
                      <p className="text-gray-900">{selectedApplication.job?.department || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Location</label>
                      <p className="text-gray-900">{selectedApplication.job?.location || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Type</label>
                      <p className="text-gray-900 capitalize">{selectedApplication.job?.type?.replace('-', ' ') || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Resume */}
                {selectedApplication.resume && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FiFileText className="text-teal-600" /> Resume
                    </h3>
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${selectedApplication.resume}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
                    >
                      <FiDownload /> Download Resume
                    </a>
                  </div>
                )}

                {/* Cover Letter */}
                {selectedApplication.coverLetter && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FiFileText className="text-teal-600" /> Cover Letter
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-700 whitespace-pre-line">{selectedApplication.coverLetter}</p>
                    </div>
                  </div>
                )}

                {/* Status Update */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Status</h3>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleStatusUpdate(selectedApplication.id, 'reviewing')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      disabled={selectedApplication.status === 'reviewing'}
                    >
                      Mark as Reviewing
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedApplication.id, 'shortlisted')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                      disabled={selectedApplication.status === 'shortlisted'}
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedApplication.id, 'accepted')}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                      disabled={selectedApplication.status === 'accepted'}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedApplication.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                      disabled={selectedApplication.status === 'rejected'}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

