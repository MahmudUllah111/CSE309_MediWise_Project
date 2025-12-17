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
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiX, 
  FiBriefcase,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiCalendar,
  FiCheck,
  FiXCircle,
  FiLayers
} from 'react-icons/fi';

export default function AdminJobsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    type: 'full-time',
    department: '',
    salary: '',
    applicationDeadline: '',
    isActive: true,
  });

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
      fetchJobs();
    }
  }, [user, authLoading, router, filter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter === 'active') params.isActive = 'true';
      if (filter === 'inactive') params.isActive = 'false';
      
      const response = await api.get('/jobs', { params });
      setJobs(response.data.jobs || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      showNotification('Failed to fetch jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await api.put(`/jobs/${editingJob.id}`, formData);
        showNotification('Job updated successfully', 'success');
      } else {
        await api.post('/jobs', formData);
        showNotification('Job posted successfully', 'success');
      }
      setShowModal(false);
      setEditingJob(null);
      resetForm();
      fetchJobs();
    } catch (error: any) {
      console.error('Error saving job:', error);
      if (error.response?.status === 403) {
        showNotification('Access denied. Please make sure you are logged in as an admin.', 'error');
      } else if (error.response?.status === 401) {
        showNotification('Please log in again to continue.', 'error');
        router.push('/login');
      } else {
        showNotification(error.response?.data?.message || 'Failed to save job', 'error');
      }
    }
  };

  const handleEdit = (job: any) => {
    setEditingJob(job);
    setFormData({
      title: job.title || '',
      description: job.description || '',
      requirements: job.requirements || '',
      location: job.location || '',
      type: job.type || 'full-time',
      department: job.department || '',
      salary: job.salary || '',
      applicationDeadline: job.applicationDeadline ? format(new Date(job.applicationDeadline), 'yyyy-MM-dd') : '',
      isActive: job.isActive !== undefined ? job.isActive : true,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await api.delete(`/jobs/${id}`);
      showNotification('Job deleted successfully', 'success');
      fetchJobs();
    } catch (error: any) {
      console.error('Error deleting job:', error);
      showNotification('Failed to delete job', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      requirements: '',
      location: '',
      type: 'full-time',
      department: '',
      salary: '',
      applicationDeadline: '',
      isActive: true,
    });
    setEditingJob(null);
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
        <AdminHeader 
          title="Job Management"
          actionButton={{
            label: 'Post New Job',
            onClick: () => {
              resetForm();
              setShowModal(true);
            },
            icon: <FiPlus />
          }}
        />

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b-2 border-gray-300">
              {(['all', 'active', 'inactive'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-6 py-3 font-medium transition-colors capitalize ${
                    filter === tab
                      ? 'text-teal-600 border-b-2 border-teal-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Jobs List */}
          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-300">
              <FiBriefcase className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? 'Get started by posting your first job'
                  : `No ${filter} jobs found`
                }
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
                >
                  <FiPlus /> Post New Job
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all p-6 border-2 border-gray-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <FiBriefcase className="text-2xl text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                            {job.isActive ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                <FiCheck /> Active
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                <FiXCircle /> Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            {job.department && (
                              <span className="flex items-center gap-1">
                                <FiLayers className="text-teal-600" /> {job.department}
                              </span>
                            )}
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <FiMapPin className="text-teal-600" /> {job.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1 capitalize">
                              <FiClock className="text-teal-600" /> {job.type}
                            </span>
                            {job.salary && (
                              <span className="flex items-center gap-1">
                                <FiDollarSign className="text-teal-600" /> {job.salary}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 line-clamp-2 mb-3">{job.description}</p>
                          {job.applicationDeadline && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FiCalendar className="text-teal-600" />
                              <span>Deadline: {format(new Date(job.applicationDeadline), 'MMM dd, yyyy')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 lg:flex-col">
                      <button
                        onClick={() => handleEdit(job)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <FiEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingJob ? 'Edit Job' : 'Post New Job'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FiX className="text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="e.g., Senior Cardiologist"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="e.g., Cardiology"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="e.g., Dhaka, Bangladesh"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary
                  </label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="e.g., $50,000 - $70,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                    placeholder="Describe the job position, responsibilities, and what you're looking for..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                    placeholder="List the required qualifications, experience, and skills..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">Active (Show on website)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
                >
                  {editingJob ? 'Update Job' : 'Post Job'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
