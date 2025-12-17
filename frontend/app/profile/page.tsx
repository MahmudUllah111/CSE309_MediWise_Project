'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/components/Loading';
import PatientSidebar from '@/components/PatientSidebar';
import api from '@/lib/api';
import { format } from 'date-fns';
import { 
  FiPlus, 
  FiMoreVertical, 
  FiSearch, 
  FiMessageCircle, 
  FiBell,
  FiHeart,
  FiActivity,
  FiFileText,
  FiPackage,
  FiEdit3,
  FiSave,
  FiX
} from 'react-icons/fi';

export default function MyProfilePage() {
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
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'patient') {
      fetchPatientData();
    }
  }, [user]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Fetch user profile data from API
      const userResponse = await api.get('/users/me/profile');
      const currentUser = userResponse.data.user;

      // Calculate age
      let age = { years: 0, months: 0 };
      if (currentUser?.dateOfBirth) {
        const birthDate = new Date(currentUser.dateOfBirth);
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

      // Fetch prescriptions for medications
      const prescriptionsResponse = await api.get(`/prescriptions?limit=100`);
      const prescriptions = prescriptionsResponse.data.prescriptions || [];

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

      // Create notes from prescriptions
      const notes = prescriptions
        .filter((prescription: any) => prescription.instructions || prescription.diagnosis)
        .map((prescription: any) => ({
          date: prescription.prescriptionDate || prescription.createdAt,
          content: prescription.instructions || prescription.diagnosis || '',
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Format patient data
      const profileImageUrl = currentUser?.profileImage 
        ? `data:${currentUser.profileImageMimeType || 'image/jpeg'};base64,${currentUser.profileImage}`
        : null;

      const formattedData = {
        id: currentUser?.id,
        displayId: currentUser?.id?.slice(0, 7),
        name: currentUser?.name,
        profileImage: profileImageUrl,
        dateOfBirth: currentUser?.dateOfBirth,
        weight: currentUser?.weight || '',
        height: currentUser?.height || '',
        age,
        address: currentUser?.address || '',
        mobilePhone: currentUser?.phone || '',
        homePhone: currentUser?.homePhone || '',
        workPhone: currentUser?.workPhone || '',
        email: currentUser?.email,
        allergies: currentUser?.allergies || [],
        medications,
        vitals: {
          bloodPressure: currentUser?.bloodPressure || '',
          pulse: currentUser?.pulse || '',
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
      };
      setPatientData(formattedData);
      setEditForm(formattedData);
      setProfileImagePreview(profileImageUrl);
    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      // Don't redirect on 404 or other errors, just show empty state
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Only redirect on auth errors
        router.push('/login');
      } else {
        // For other errors, show empty state but don't logout
        setPatientData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification('Image size must be less than 2MB', 'warning');
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
      const date = new Date(dateString);
      return format(date, 'MM/dd/yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      ...patientData,
      dateOfBirth: patientData?.dateOfBirth ? formatDateForInput(patientData.dateOfBirth) : '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(patientData);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare update data
      const formDataToSend = new FormData();
      formDataToSend.append('name', editForm.name || '');
      formDataToSend.append('phone', editForm.mobilePhone || '');
      formDataToSend.append('address', editForm.address || '');
      if (editForm.dateOfBirth) {
        formDataToSend.append('dateOfBirth', new Date(editForm.dateOfBirth).toISOString());
      }
      formDataToSend.append('weight', editForm.weight || '');
      formDataToSend.append('height', editForm.height || '');
      formDataToSend.append('homePhone', editForm.homePhone || '');
      formDataToSend.append('workPhone', editForm.workPhone || '');
      formDataToSend.append('allergies', JSON.stringify(Array.isArray(editForm.allergies) ? editForm.allergies : (editForm.allergies ? [editForm.allergies] : [])));
      formDataToSend.append('bloodPressure', editForm.vitals?.bloodPressure || '');
      formDataToSend.append('pulse', editForm.vitals?.pulse || '');

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
        <main className="ml-64 flex-1">
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
        <main className="ml-64 flex-1 p-8">
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
      <main className="ml-64 flex-1 transition-all duration-300">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">MY PROFILE</h1>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
              >
                <FiEdit3 className="text-sm" />
                Edit Profile
              </button>
            )}
            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <FiSave className="text-sm" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <FiX className="text-sm" />
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiSearch className="text-xl text-gray-600" />
            </button>
            <Link href="/patient/chat" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiMessageCircle className="text-xl text-gray-600" />
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                2
              </span>
            </Link>
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiBell className="text-xl text-gray-600" />
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                2
              </span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold">
              {getInitials(user?.name || 'P')}
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Information Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                    {profileImagePreview ? (
                      <img 
                        src={profileImagePreview} 
                        alt={patientData?.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : patientData?.profileImage ? (
                      <img 
                        src={patientData.profileImage} 
                        alt={patientData.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(patientData?.name || 'P')
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                      <label className="cursor-pointer bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 transition-colors shadow-lg">
                        <FiEdit3 className="text-sm" />
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      {(profileImagePreview || patientData?.profileImage) && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
                        >
                          <FiX className="text-sm" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-2xl font-bold text-gray-800 mb-2 text-center border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{patientData?.name}</h2>
                )}
                {!isEditing && patientData?.allergies && patientData.allergies.length > 0 && (
                  <div className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-4">
                    Allergy
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 w-full text-left">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">DOB</p>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.dateOfBirth ? formatDateForInput(editForm.dateOfBirth) : ''}
                        onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                        className="w-full text-sm font-semibold text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-gray-800">
                        {patientData?.dateOfBirth ? formatDate(patientData.dateOfBirth) : 'N/A'}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Weight</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.weight || ''}
                        onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                        placeholder="e.g., 150 lb"
                        className="w-full text-sm font-semibold text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-gray-800">
                        {patientData?.weight || 'N/A'} {patientData?.weight ? 'lb' : ''}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Age</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {patientData?.age?.years || 0}y {patientData?.age?.months || 0}m
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Height</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.height || ''}
                        onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                        placeholder="e.g., 5'8&quot;"
                        className="w-full text-sm font-semibold text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-gray-800">{patientData?.height || 'N/A'}</p>
                    )}
                  </div>
                </div>
                <Link 
                  href="/patient/chat"
                  className="w-full mt-6 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-center"
                >
                  SEND MESSAGE
                </Link>
              </div>
            </div>

            {/* Current Medications Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Current medications</h3>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <FiPlus className="text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <FiMoreVertical className="text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {patientData.medications && patientData.medications.length > 0 ? (
                  patientData.medications.map((med: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiPackage className="text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{med.name}</p>
                        {med.brand && <p className="text-xs text-gray-600">{med.brand}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No medications found</p>
                )}
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Home Address</p>
                  {isEditing ? (
                    <textarea
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Enter your address"
                      className="w-full text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      rows={2}
                    />
                  ) : (
                    <p className="text-gray-800">{patientData.address || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Mobile Phone #</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.mobilePhone || ''}
                      onChange={(e) => setEditForm({ ...editForm, mobilePhone: e.target.value })}
                      placeholder="Enter mobile phone"
                      className="w-full text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800">{patientData.mobilePhone || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Home Phone #</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.homePhone || ''}
                      onChange={(e) => setEditForm({ ...editForm, homePhone: e.target.value })}
                      placeholder="Enter home phone"
                      className="w-full text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800">{patientData.homePhone || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Work Phone #</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.workPhone || ''}
                      onChange={(e) => setEditForm({ ...editForm, workPhone: e.target.value })}
                      placeholder="Enter work phone"
                      className="w-full text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800">{patientData.workPhone || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Email</p>
                  <p className="text-gray-800">{patientData.email}</p>
                </div>
              </div>
            </div>

            {/* Vitals Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Vitals</h3>
                {!isEditing && (
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <FiMoreVertical className="text-gray-600" />
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <FiHeart className="text-red-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase mb-1">Blood Pressure</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.vitals?.bloodPressure || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          vitals: { ...editForm.vitals, bloodPressure: e.target.value }
                        })}
                        placeholder="e.g., 120/80"
                        className="w-full text-lg font-bold text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-800">{patientData.vitals?.bloodPressure || 'N/A'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <FiActivity className="text-blue-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase mb-1">Pulse</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.vitals?.pulse || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          vitals: { ...editForm.vitals, pulse: e.target.value }
                        })}
                        placeholder="e.g., 72 bpm"
                        className="w-full text-lg font-bold text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-800">{patientData.vitals?.pulse || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Notes</h3>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <FiPlus className="text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <FiMoreVertical className="text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {patientData.notes && patientData.notes.length > 0 ? (
                  patientData.notes.map((note: any, idx: number) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">{formatDate(note.date)}</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No notes found</p>
                )}
              </div>
            </div>

            {/* Lab Results Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Lab results</h3>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <FiMoreVertical className="text-gray-600" />
                </button>
              </div>
              <div className="space-y-3">
                {patientData.labResults && patientData.labResults.length > 0 ? (
                  patientData.labResults.map((result: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <FiFileText className="text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{result.name}</p>
                        <p className="text-xs text-gray-600">{formatDate(result.date)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No lab results found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/components/Loading';
import PatientSidebar from '@/components/PatientSidebar';
import api from '@/lib/api';
import { format } from 'date-fns';
import { 
  FiPlus, 
  FiMoreVertical, 
  FiSearch, 
  FiMessageCircle, 
  FiBell,
  FiHeart,
  FiActivity,
  FiFileText,
  FiPackage,
  FiEdit3,
  FiSave,
  FiX
} from 'react-icons/fi';

export default function MyProfilePage() {
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
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'patient') {
      fetchPatientData();
    }
  }, [user]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Fetch user profile data from API
      const userResponse = await api.get('/users/me/profile');
      const currentUser = userResponse.data.user;

      // Calculate age
      let age = { years: 0, months: 0 };
      if (currentUser?.dateOfBirth) {
        const birthDate = new Date(currentUser.dateOfBirth);
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

      // Fetch prescriptions for medications
      const prescriptionsResponse = await api.get(`/prescriptions?limit=100`);
      const prescriptions = prescriptionsResponse.data.prescriptions || [];

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

      // Create notes from prescriptions
      const notes = prescriptions
        .filter((prescription: any) => prescription.instructions || prescription.diagnosis)
        .map((prescription: any) => ({
          date: prescription.prescriptionDate || prescription.createdAt,
          content: prescription.instructions || prescription.diagnosis || '',
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Format patient data
      const profileImageUrl = currentUser?.profileImage 
        ? `data:${currentUser.profileImageMimeType || 'image/jpeg'};base64,${currentUser.profileImage}`
        : null;

      const formattedData = {
        id: currentUser?.id,
        displayId: currentUser?.id?.slice(0, 7),
        name: currentUser?.name,
        profileImage: profileImageUrl,
        dateOfBirth: currentUser?.dateOfBirth,
        weight: currentUser?.weight || '',
        height: currentUser?.height || '',
        age,
        address: currentUser?.address || '',
        mobilePhone: currentUser?.phone || '',
        homePhone: currentUser?.homePhone || '',
        workPhone: currentUser?.workPhone || '',
        email: currentUser?.email,
        allergies: currentUser?.allergies || [],
        medications,
        vitals: {
          bloodPressure: currentUser?.bloodPressure || '',
          pulse: currentUser?.pulse || '',
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
      };
      setPatientData(formattedData);
      setEditForm(formattedData);
      setProfileImagePreview(profileImageUrl);
    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      // Don't redirect on 404 or other errors, just show empty state
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Only redirect on auth errors
        router.push('/login');
      } else {
        // For other errors, show empty state but don't logout
        setPatientData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification('Image size must be less than 2MB', 'warning');
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
      const date = new Date(dateString);
      return format(date, 'MM/dd/yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      ...patientData,
      dateOfBirth: patientData?.dateOfBirth ? formatDateForInput(patientData.dateOfBirth) : '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(patientData);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare update data
      const formDataToSend = new FormData();
      formDataToSend.append('name', editForm.name || '');
      formDataToSend.append('phone', editForm.mobilePhone || '');
      formDataToSend.append('address', editForm.address || '');
      if (editForm.dateOfBirth) {
        formDataToSend.append('dateOfBirth', new Date(editForm.dateOfBirth).toISOString());
      }
      formDataToSend.append('weight', editForm.weight || '');
      formDataToSend.append('height', editForm.height || '');
      formDataToSend.append('homePhone', editForm.homePhone || '');
      formDataToSend.append('workPhone', editForm.workPhone || '');
      formDataToSend.append('allergies', JSON.stringify(Array.isArray(editForm.allergies) ? editForm.allergies : (editForm.allergies ? [editForm.allergies] : [])));
      formDataToSend.append('bloodPressure', editForm.vitals?.bloodPressure || '');
      formDataToSend.append('pulse', editForm.vitals?.pulse || '');

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
        <main className="ml-64 flex-1">
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
        <main className="ml-64 flex-1 p-8">
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
      <main className="ml-64 flex-1 transition-all duration-300">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">MY PROFILE</h1>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
              >
                <FiEdit3 className="text-sm" />
                Edit Profile
              </button>
            )}
            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <FiSave className="text-sm" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <FiX className="text-sm" />
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiSearch className="text-xl text-gray-600" />
            </button>
            <Link href="/patient/chat" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiMessageCircle className="text-xl text-gray-600" />
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                2
              </span>
            </Link>
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiBell className="text-xl text-gray-600" />
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                2
              </span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold">
              {getInitials(user?.name || 'P')}
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Information Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                    {profileImagePreview ? (
                      <img 
                        src={profileImagePreview} 
                        alt={patientData?.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : patientData?.profileImage ? (
                      <img 
                        src={patientData.profileImage} 
                        alt={patientData.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(patientData?.name || 'P')
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                      <label className="cursor-pointer bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 transition-colors shadow-lg">
                        <FiEdit3 className="text-sm" />
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      {(profileImagePreview || patientData?.profileImage) && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
                        >
                          <FiX className="text-sm" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-2xl font-bold text-gray-800 mb-2 text-center border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{patientData?.name}</h2>
                )}
                {!isEditing && patientData?.allergies && patientData.allergies.length > 0 && (
                  <div className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-4">
                    Allergy
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 w-full text-left">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">DOB</p>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.dateOfBirth ? formatDateForInput(editForm.dateOfBirth) : ''}
                        onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                        className="w-full text-sm font-semibold text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-gray-800">
                        {patientData?.dateOfBirth ? formatDate(patientData.dateOfBirth) : 'N/A'}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Weight</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.weight || ''}
                        onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                        placeholder="e.g., 150 lb"
                        className="w-full text-sm font-semibold text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-gray-800">
                        {patientData?.weight || 'N/A'} {patientData?.weight ? 'lb' : ''}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Age</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {patientData?.age?.years || 0}y {patientData?.age?.months || 0}m
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Height</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.height || ''}
                        onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                        placeholder="e.g., 5'8&quot;"
                        className="w-full text-sm font-semibold text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-gray-800">{patientData?.height || 'N/A'}</p>
                    )}
                  </div>
                </div>
                <Link 
                  href="/patient/chat"
                  className="w-full mt-6 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-center"
                >
                  SEND MESSAGE
                </Link>
              </div>
            </div>

            {/* Current Medications Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Current medications</h3>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <FiPlus className="text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <FiMoreVertical className="text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {patientData.medications && patientData.medications.length > 0 ? (
                  patientData.medications.map((med: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiPackage className="text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{med.name}</p>
                        {med.brand && <p className="text-xs text-gray-600">{med.brand}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No medications found</p>
                )}
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Home Address</p>
                  {isEditing ? (
                    <textarea
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Enter your address"
                      className="w-full text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      rows={2}
                    />
                  ) : (
                    <p className="text-gray-800">{patientData.address || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Mobile Phone #</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.mobilePhone || ''}
                      onChange={(e) => setEditForm({ ...editForm, mobilePhone: e.target.value })}
                      placeholder="Enter mobile phone"
                      className="w-full text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800">{patientData.mobilePhone || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Home Phone #</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.homePhone || ''}
                      onChange={(e) => setEditForm({ ...editForm, homePhone: e.target.value })}
                      placeholder="Enter home phone"
                      className="w-full text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800">{patientData.homePhone || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Work Phone #</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.workPhone || ''}
                      onChange={(e) => setEditForm({ ...editForm, workPhone: e.target.value })}
                      placeholder="Enter work phone"
                      className="w-full text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800">{patientData.workPhone || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Email</p>
                  <p className="text-gray-800">{patientData.email}</p>
                </div>
              </div>
            </div>

            {/* Vitals Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Vitals</h3>
                {!isEditing && (
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <FiMoreVertical className="text-gray-600" />
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <FiHeart className="text-red-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase mb-1">Blood Pressure</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.vitals?.bloodPressure || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          vitals: { ...editForm.vitals, bloodPressure: e.target.value }
                        })}
                        placeholder="e.g., 120/80"
                        className="w-full text-lg font-bold text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-800">{patientData.vitals?.bloodPressure || 'N/A'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <FiActivity className="text-blue-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase mb-1">Pulse</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.vitals?.pulse || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          vitals: { ...editForm.vitals, pulse: e.target.value }
                        })}
                        placeholder="e.g., 72 bpm"
                        className="w-full text-lg font-bold text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-800">{patientData.vitals?.pulse || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Notes</h3>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <FiPlus className="text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <FiMoreVertical className="text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {patientData.notes && patientData.notes.length > 0 ? (
                  patientData.notes.map((note: any, idx: number) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">{formatDate(note.date)}</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No notes found</p>
                )}
              </div>
            </div>

            {/* Lab Results Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Lab results</h3>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <FiMoreVertical className="text-gray-600" />
                </button>
              </div>
              <div className="space-y-3">
                {patientData.labResults && patientData.labResults.length > 0 ? (
                  patientData.labResults.map((result: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <FiFileText className="text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{result.name}</p>
                        <p className="text-xs text-gray-600">{formatDate(result.date)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No lab results found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}






                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No lab results found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}





