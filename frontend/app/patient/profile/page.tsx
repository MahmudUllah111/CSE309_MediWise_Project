'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import PatientSidebar from '@/components/PatientSidebar';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { format } from 'date-fns';
import { 
  FiEdit3,
  FiSave,
  FiX,
  FiHeart,
  FiActivity,
  FiFileText,
  FiPackage,
  FiSearch,
  FiMessageCircle,
  FiBell
} from 'react-icons/fi';

export default function PatientProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'patient')) {
      router.push('/login');
      return;
    }
    if (user && user.role === 'patient') {
      fetchPatientData();
    }
  }, [user, authLoading, router]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      // Use logged-in user's ID (patient viewing their own profile)
      const patientId = user?.id;

      if (!patientId) {
        console.error('User not logged in');
        setLoading(false);
        return;
      }

      // Fetch patient user data using the me/profile endpoint
      const userResponse = await api.get('/users/me/profile');
      const patientUser = userResponse.data.user;
      
      if (!patientUser) {
        console.error('User profile not found');
        setLoading(false);
        return;
      }

      // Calculate age
      let age = { years: 0, months: 0 };
      if (patientUser.dateOfBirth) {
        const birthDate = new Date(patientUser.dateOfBirth);
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
        age = { years, months };
      }

      // Fetch prescriptions for medications (filter by patient email)
      const prescriptionsResponse = await api.get(`/prescriptions?limit=100`);
      let allPrescriptions = prescriptionsResponse.data.prescriptions || [];
      // Filter prescriptions for current patient
      allPrescriptions = allPrescriptions.filter((prescription: any) => 
        prescription.patient?.email === patientUser.email || prescription.patientId === patientId
      );
      const prescriptions = allPrescriptions;

      // Extract medications from prescriptions
      const medications = prescriptions
        .flatMap((prescription: any) => prescription.medicines || [])
        .filter((med: any, index: number, self: any[]) => {
          const name = typeof med === 'string' ? med : med.name || '';
          return self.findIndex((m: any) => (typeof m === 'string' ? m : m.name || '') === name) === index;
        })
        .map((med: any) => {
          if (typeof med === 'string') {
            return { name: med, brand: '' };
          }
          return {
            name: med.name || med,
            brand: med.dosage || med.frequency || '',
          };
        });

      // Fetch appointments for notes and history
      const appointmentsResponse = await api.get(`/appointments?patientId=${patientId}&limit=100`);
      const appointments = appointmentsResponse.data.appointments || [];

      // Create notes from prescriptions
      const notes = prescriptions
        .filter((prescription: any) => prescription.instructions || prescription.diagnosis)
        .map((prescription: any) => ({
          date: prescription.prescriptionDate || prescription.createdAt,
          content: prescription.instructions || prescription.diagnosis || '',
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Format patient data
      const profileImageUrl = patientUser?.profileImage 
        ? `data:${patientUser.profileImageMimeType || 'image/jpeg'};base64,${patientUser.profileImage}`
        : null;

      setPatientData({
        id: patientUser.id?.slice(0, 7) || '',
        name: patientUser.name || '',
        profileImage: profileImageUrl,
        dateOfBirth: patientUser.dateOfBirth || null,
        weight: patientUser.weight || '',
        height: patientUser.height || '',
        age,
        address: patientUser.address || '',
        mobilePhone: patientUser.phone || '',
        homePhone: patientUser.homePhone || '',
        workPhone: patientUser.workPhone || '',
        email: patientUser.email || '',
        allergies: Array.isArray(patientUser.allergies) ? patientUser.allergies : [],
        medications,
        vitals: {
          bloodPressure: patientUser.bloodPressure || '',
          pulse: patientUser.pulse || '',
        },
        notes,
        labResults: prescriptions
          .filter((prescription: any) => prescription.tests && prescription.tests.length > 0)
          .flatMap((prescription: any) =>
            (prescription.tests || []).map((test: any) => ({
              name: typeof test === 'string' ? test : test.name || test,
              date: prescription.prescriptionDate || prescription.createdAt,
            }))
          )
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      });
      setEditForm({
        name: patientUser.name || '',
        phone: patientUser.phone || '',
        address: patientUser.address || '',
        dateOfBirth: patientUser.dateOfBirth ? new Date(patientUser.dateOfBirth).toISOString().split('T')[0] : '',
        weight: patientUser.weight || '',
        height: patientUser.height || '',
        homePhone: patientUser.homePhone || '',
        workPhone: patientUser.workPhone || '',
        allergies: Array.isArray(patientUser.allergies) ? patientUser.allergies : [],
        bloodPressure: patientUser.bloodPressure || '',
        pulse: patientUser.pulse || '',
      });
      setProfileImagePreview(profileImageUrl);
    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push('/login');
      } else {
        // Show error notification but don't set patientData to null
        // This allows the UI to show a retry button or better error message
        showNotification(
          error.response?.data?.message || 'Failed to load profile data. Please try again.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification('Image size must be less than 2MB', 'error');
        return;
      }
      setProfileImageFile(file);
      // Clear remove flag if new image is uploaded
      setEditForm({ ...editForm, removeProfileImage: false });
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    // Set remove flag to remove image from database
    setEditForm((prev: any) => ({ ...prev, removeProfileImage: true }));
    // Show immediate feedback
    showNotification('Image will be removed when you save the profile', 'info');
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      ?.map((n: string) => n[0])
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2) || 'U';
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return format(date, 'MM/dd/yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateForInput = (dateString: string) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileImageFile(null);
    setProfileImagePreview(patientData?.profileImage || null);
    setEditForm({
      name: patientData?.name || '',
      phone: patientData?.mobilePhone || '',
      address: patientData?.address || '',
      dateOfBirth: patientData?.dateOfBirth ? formatDateForInput(patientData.dateOfBirth) : '',
      weight: patientData?.weight || '',
      height: patientData?.height || '',
      homePhone: patientData?.homePhone || '',
      workPhone: patientData?.workPhone || '',
      allergies: patientData?.allergies || [],
      bloodPressure: patientData?.vitals?.bloodPressure || '',
      pulse: patientData?.vitals?.pulse || '',
    });
    setProfileImageFile(null);
    setProfileImagePreview(patientData?.profileImage || null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare update data
      const formDataToSend = new FormData();
      formDataToSend.append('name', editForm.name || '');
      formDataToSend.append('phone', editForm.phone || '');
      formDataToSend.append('address', editForm.address || '');
      if (editForm.dateOfBirth) {
        formDataToSend.append('dateOfBirth', new Date(editForm.dateOfBirth).toISOString());
      }
      formDataToSend.append('weight', editForm.weight || '');
      formDataToSend.append('height', editForm.height || '');
      formDataToSend.append('homePhone', editForm.homePhone || '');
      formDataToSend.append('workPhone', editForm.workPhone || '');
      formDataToSend.append('allergies', JSON.stringify(Array.isArray(editForm.allergies) ? editForm.allergies : (editForm.allergies ? [editForm.allergies] : [])));
      formDataToSend.append('bloodPressure', editForm.bloodPressure || '');
      formDataToSend.append('pulse', editForm.pulse || '');

      // Handle profile image
      if (profileImageFile) {
        formDataToSend.append('profileImage', profileImageFile);
      }

      // Handle image removal
      if (editForm.removeProfileImage) {
        formDataToSend.append('removeProfileImage', 'true');
      }

      const response = await api.put('/users/me/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        // Refresh patient data
        await fetchPatientData();
        setIsEditing(false);
        setProfileImageFile(null);
        setEditForm({ ...editForm, removeProfileImage: false });
        showNotification('Profile updated successfully!', 'success');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showNotification(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <PatientSidebar user={user} logout={logout} />
        <main className="w-full lg:ml-64 flex-1">
          <Loading />
        </main>
      </div>
    );
  }

  if (!user || user.role !== 'patient') {
    return null;
  }

  if (!patientData && !loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <PatientSidebar user={user} logout={logout} />
        <main className="w-full lg:ml-64 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No profile data available.</p>
            <button
              onClick={fetchPatientData}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <PatientSidebar user={user} logout={logout} />
      {/* Main Content */}
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        {/* Modern Header with Simple Color */}
        <header className="bg-teal-600 text-white shadow-xl">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Profile</h1>
                <p className="text-sm sm:text-base text-teal-100">Manage your personal information and health data</p>
              </div>
              <div className="flex items-center gap-3">
                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-teal-600 rounded-xl hover:bg-teal-50 transition-all shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
                  >
                    <FiEdit3 className="text-lg" />
                    Edit Profile
                  </button>
                )}
                {isEditing && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 transform hover:scale-105"
                    >
                      <FiSave className="text-lg" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-teal-600 rounded-xl hover:bg-teal-50 transition-all shadow-lg font-semibold disabled:opacity-50 transform hover:scale-105"
                    >
                      <FiX className="text-lg" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Grid with Modern Cards */}
        <div className="p-8">
          {/* Profile Header Card */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-300 overflow-hidden relative">
              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Profile Image */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 text-4xl font-bold overflow-hidden shadow-2xl ring-4 ring-white transform hover:scale-105 transition-transform">
                    {!editForm.removeProfileImage && (profileImagePreview || patientData?.profileImage) ? (
                      <img 
                        src={profileImagePreview || patientData?.profileImage} 
                        alt={patientData?.name}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      getInitials(patientData?.name || 'P')
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                      <label className="cursor-pointer bg-teal-600 text-white p-3 rounded-xl hover:bg-teal-700 hover:shadow-lg transition-all shadow-md">
                        <FiEdit3 className="text-lg" />
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      {(profileImagePreview || patientData?.profileImage) && !editForm.removeProfileImage && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="bg-red-600 text-white p-3 rounded-xl hover:bg-red-700 hover:shadow-lg transition-all shadow-md"
                          title="Remove profile image"
                        >
                          <FiX className="text-lg" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-3xl font-bold text-gray-800 mb-4 text-center md:text-left border-2 border-teal-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full md:w-auto"
                    />
                  ) : (
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">{patientData?.name}</h2>
                  )}
                  
                  {!isEditing && patientData?.allergies && patientData.allergies.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
                      {patientData.allergies.map((allergy: string, idx: number) => (
                        <span key={idx} className="inline-block px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold shadow-md border-2 border-red-200">
                          ⚠️ {allergy}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white">
                      <p className="text-xs text-gray-600 uppercase mb-1 font-semibold">DOB</p>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.dateOfBirth || ''}
                          onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                          className="w-full text-sm font-bold text-gray-800 border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-sm font-bold text-gray-800">
                          {patientData?.dateOfBirth ? formatDate(patientData.dateOfBirth) : 'N/A'}
                        </p>
                      )}
                    </div>
                    <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white">
                      <p className="text-xs text-gray-600 uppercase mb-1 font-semibold">Age</p>
                      <p className="text-sm font-bold text-gray-800">
                        {patientData?.age?.years || 0}y {patientData?.age?.months || 0}m
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white">
                      <p className="text-xs text-gray-600 uppercase mb-1 font-semibold">Weight</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.weight || ''}
                          onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                          placeholder="e.g., 150 lb"
                          className="w-full text-sm font-bold text-gray-800 border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-sm font-bold text-gray-800">
                          {patientData?.weight || 'N/A'} {patientData?.weight ? 'lb' : ''}
                        </p>
                      )}
                    </div>
                    <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white">
                      <p className="text-xs text-gray-600 uppercase mb-1 font-semibold">Height</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.height || ''}
                          onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                          placeholder="e.g., 5'8&quot;"
                          className="w-full text-sm font-bold text-gray-800 border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-sm font-bold text-gray-800">{patientData?.height || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Current Medications Card - Modern Design */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                    <FiPackage className="text-teal-600 text-lg" />
                  </div>
                  Current Medications
                </h3>
              </div>
              <div className="space-y-3">
                {patientData.medications && patientData.medications.length > 0 ? (
                  patientData.medications.map((med: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <FiPackage className="text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800 mb-1">{med.name}</p>
                        {med.brand && <p className="text-xs text-gray-600">{med.brand}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <FiPackage className="text-gray-400 text-2xl" />
                    </div>
                    <p className="text-sm text-gray-500">No medications found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information Card - Modern Design */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FiMessageCircle className="text-blue-600 text-lg" />
                </div>
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <p className="text-xs text-gray-600 uppercase mb-2 font-semibold">Home Address</p>
                  {isEditing ? (
                    <textarea
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Enter your address"
                      className="w-full text-gray-800 border-2 border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      rows={2}
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">{patientData.address || 'Not provided'}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <p className="text-xs text-gray-600 uppercase mb-2 font-semibold">Mobile Phone</p>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="Enter mobile phone"
                        className="w-full text-gray-800 border-2 border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">{patientData.mobilePhone || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <p className="text-xs text-gray-600 uppercase mb-2 font-semibold">Home Phone</p>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.homePhone || ''}
                        onChange={(e) => setEditForm({ ...editForm, homePhone: e.target.value })}
                        placeholder="Enter home phone"
                        className="w-full text-gray-800 border-2 border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">{patientData.homePhone || 'Not provided'}</p>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <p className="text-xs text-gray-600 uppercase mb-2 font-semibold">Work Phone</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.workPhone || ''}
                      onChange={(e) => setEditForm({ ...editForm, workPhone: e.target.value })}
                      placeholder="Enter work phone"
                      className="w-full text-gray-800 border-2 border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">{patientData.workPhone || 'Not provided'}</p>
                  )}
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <p className="text-xs text-gray-600 uppercase mb-2 font-semibold">Email</p>
                  <p className="text-gray-800 font-medium">{patientData.email}</p>
                </div>
              </div>
            </div>

            {/* Vitals Card - Modern Design */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <FiHeart className="text-red-600 text-lg" />
                  </div>
                  Vitals
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center shadow-lg">
                    <FiHeart className="text-red-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 uppercase mb-2 font-semibold">Blood Pressure</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.bloodPressure || ''}
                        onChange={(e) => setEditForm({ ...editForm, bloodPressure: e.target.value })}
                        placeholder="e.g., 120/80"
                        className="w-full text-xl font-bold text-gray-800 border-2 border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      />
                    ) : (
                      <p className="text-xl font-bold text-gray-800">{patientData.vitals?.bloodPressure || 'N/A'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center shadow-lg">
                    <FiActivity className="text-blue-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 uppercase mb-2 font-semibold">Pulse</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.pulse || ''}
                        onChange={(e) => setEditForm({ ...editForm, pulse: e.target.value })}
                        placeholder="e.g., 72 bpm"
                        className="w-full text-xl font-bold text-gray-800 border-2 border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      />
                    ) : (
                      <p className="text-xl font-bold text-gray-800">{patientData.vitals?.pulse || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Card - Modern Design */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <FiFileText className="text-yellow-600 text-lg" />
                  </div>
                  Notes
                </h3>
              </div>
              <div className="space-y-4">
                {patientData.notes && patientData.notes.length > 0 ? (
                  patientData.notes.map((note: any, idx: number) => (
                    <div key={idx} className="p-5 bg-gray-50 rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                      <p className="text-xs text-gray-600 mb-2 font-semibold">{formatDate(note.date)}</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <FiFileText className="text-gray-400 text-2xl" />
                    </div>
                    <p className="text-sm text-gray-500">No notes found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Lab Results Card - Modern Design */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <FiFileText className="text-purple-600 text-lg" />
                  </div>
                  Lab Results
                </h3>
              </div>
              <div className="space-y-3">
                {patientData.labResults && patientData.labResults.length > 0 ? (
                  patientData.labResults.map((result: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-all">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <FiFileText className="text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{result.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{formatDate(result.date)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <FiFileText className="text-gray-400 text-2xl" />
                    </div>
                    <p className="text-sm text-gray-500">No lab results found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}