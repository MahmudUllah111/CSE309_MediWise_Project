'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { FiUpload, FiX } from 'react-icons/fi';

export default function CompleteDoctorProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [previousJobs, setPreviousJobs] = useState<Array<{ position: string; hospital: string; years: string }>>([]);
  const [education, setEducation] = useState<Array<{ degree: string; institution: string; year: string }>>([]);

  const [formData, setFormData] = useState({
    departmentId: '',
    specialization: '',
    experience: '',
    qualification: '',
    bio: '',
    consultationFee: '',
    availableFrom: '',
    availableTo: '',
  });
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'doctor')) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchDepartments();
      checkExistingProfile();
    }
  }, [user]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingProfile = async () => {
    try {
      const response = await api.get('/doctors/profile/me');
      if (response.data.doctor) {
        if (response.data.doctor.status === 'approved') {
          router.push('/doctor/dashboard');
        } else if (response.data.doctor.status === 'pending') {
          // Pre-fill form with existing data
          const doctor = response.data.doctor;
          setFormData({
            departmentId: doctor.departmentId || '',
            specialization: doctor.specialization || '',
            experience: doctor.experience?.toString() || '',
            qualification: doctor.qualification || '',
            bio: doctor.bio || '',
            consultationFee: doctor.consultationFee?.toString() || '',
            availableFrom: doctor.availableFrom || '',
            availableTo: doctor.availableTo || '',
          });
          
          // Ensure availableDays is an array
          let days = doctor.availableDays;
          if (typeof days === 'string') {
            try {
              days = JSON.parse(days);
            } catch (e) {
              days = [];
            }
          }
          setAvailableDays(Array.isArray(days) ? days : []);
          
          // Ensure previousJobs is an array
          let jobs = doctor.previousJobs;
          if (typeof jobs === 'string') {
            try {
              jobs = JSON.parse(jobs);
            } catch (e) {
              jobs = [];
            }
          }
          setPreviousJobs(Array.isArray(jobs) ? jobs : []);
          
          // Ensure education is an array
          let edu = doctor.education;
          if (typeof edu === 'string') {
            try {
              edu = JSON.parse(edu);
            } catch (e) {
              edu = [];
            }
          }
          setEducation(Array.isArray(edu) ? edu : []);
        }
      }
    } catch (error: any) {
      // 404 is expected if profile doesn't exist yet - this is fine
      if (error.response?.status === 404) {
        // Profile doesn't exist yet, user can fill the form
        console.log('No existing profile found, starting fresh');
      } else if (error.response?.status === 403) {
        console.error('Access denied. User may not be a doctor.');
      } else if (error.response?.status === 401) {
        console.error('Not authenticated. Redirecting to login.');
        router.push('/login');
      } else {
        console.error('Error checking existing profile:', error);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const addPreviousJob = () => {
    setPreviousJobs([...previousJobs, { position: '', hospital: '', years: '' }]);
  };

  const removePreviousJob = (index: number) => {
    setPreviousJobs(previousJobs.filter((_, i) => i !== index));
  };

  const updatePreviousJob = (index: number, field: string, value: string) => {
    const updated = [...previousJobs];
    updated[index] = { ...updated[index], [field]: value };
    setPreviousJobs(updated);
  };

  const addEducation = () => {
    setEducation([...education, { degree: '', institution: '', year: '' }]);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (availableDays.length === 0) {
      setError('Please select at least one available day');
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('departmentId', formData.departmentId);
      formDataToSend.append('specialization', formData.specialization);
      formDataToSend.append('experience', formData.experience);
      formDataToSend.append('qualification', formData.qualification);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('consultationFee', formData.consultationFee);
      formDataToSend.append('availableFrom', formData.availableFrom);
      formDataToSend.append('availableTo', formData.availableTo);
      formDataToSend.append('availableDays', JSON.stringify(availableDays));
      formDataToSend.append('previousJobs', JSON.stringify(previousJobs));
      formDataToSend.append('education', JSON.stringify(education));
      
      if (cvFile) {
        formDataToSend.append('cvResume', cvFile);
      }

      const response = await api.post('/doctors/complete-profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showNotification('Profile submitted successfully! Waiting for admin approval.', 'success');
      router.push('/doctor/dashboard');
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access denied. Please make sure you are logged in as a doctor.');
      } else if (err.response?.status === 401) {
        setError('Please log in again to continue.');
        router.push('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to submit profile. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    setError(''); // Clear any previous errors
    
    if (currentStep === 1 && (!formData.departmentId || !formData.specialization || !formData.experience)) {
      setError('Please fill in all required fields');
      return;
    }
    
    // No validation for step 2 (Experience) or step 3 (Education) - they are optional
    // Availability validation will happen only on final submit (in handleSubmit)
    
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Complete Your Doctor Profile</h1>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step <= currentStep
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step < currentStep ? 'bg-teal-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Basic Info</span>
              <span>Experience</span>
              <span>Education</span>
              <span>Availability</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Basic Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.icon} {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g., Cardiologist, Pediatrician"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualifications
                  </label>
                  <textarea
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g., MBBS, MD, FCPS"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Fee (BDT)
                  </label>
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Previous Jobs */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Previous Jobs/Positions</h2>
                
                {Array.isArray(previousJobs) && previousJobs.map((job, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-gray-700">Job #{index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removePreviousJob(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiX />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Position (e.g., Senior Cardiologist)"
                      value={job.position}
                      onChange={(e) => updatePreviousJob(index, 'position', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Hospital/Institution Name"
                      value={job.hospital}
                      onChange={(e) => updatePreviousJob(index, 'hospital', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Years (e.g., 2015-2020)"
                      value={job.years}
                      onChange={(e) => updatePreviousJob(index, 'years', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPreviousJob}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors"
                >
                  + Add Previous Job
                </button>
              </div>
            )}

            {/* Step 3: Education */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Education</h2>
                
                {Array.isArray(education) && education.map((edu, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-gray-700">Education #{index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiX />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Degree (e.g., MBBS, MD, PhD)"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Institution Name"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Year (e.g., 2010)"
                      value={edu.year}
                      onChange={(e) => updateEducation(index, 'year', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addEducation}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors"
                >
                  + Add Education
                </button>
              </div>
            )}

            {/* Step 4: Availability & CV */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Availability & CV/Resume</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Days (Week) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {weekDays.map((day) => (
                      <label
                        key={day}
                        className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={availableDays.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAvailableDays([...availableDays, day]);
                            } else {
                              setAvailableDays(availableDays.filter((d) => d !== day));
                            }
                          }}
                          className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                  {availableDays.length === 0 && (
                    <p className="text-xs text-red-500 mb-4">Please select at least one day</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available From
                    </label>
                    <input
                      type="time"
                      name="availableFrom"
                      value={formData.availableFrom}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available To
                    </label>
                    <input
                      type="time"
                      name="availableTo"
                      value={formData.availableTo}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload CV/Resume (PDF, DOC, DOCX)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {cvFile ? (
                      <div className="space-y-2">
                        <p className="text-gray-700">{cvFile.name}</p>
                        <button
                          type="button"
                          onClick={() => setCvFile(null)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="space-y-2">
                          <FiUpload className="mx-auto text-4xl text-gray-400" />
                          <p className="text-gray-600">Click to upload CV/Resume</p>
                          <p className="text-sm text-gray-500">Max 5MB</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || availableDays.length === 0}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Profile'}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}