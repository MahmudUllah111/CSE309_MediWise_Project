'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import DoctorSidebar from '@/components/DoctorSidebar';
import MedicineAdPanel from '@/components/MedicineAdPanel';
import BottomAdPanel from '@/components/BottomAdPanel';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { format } from 'date-fns';
import { 
  FiLogOut,
  FiEdit3,
  FiSave,
  FiX,
  FiFileText,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiBriefcase,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin
} from 'react-icons/fi';
import { formatDoctorName } from '@/utils/doctorName';

export default function DoctorProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [doctorData, setDoctorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'doctor')) {
      router.push('/login');
      return;
    }
    if (user && user.role === 'doctor') {
      fetchDoctorData();
      fetchDepartments();
    }
  }, [user, authLoading, router]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors/profile/me');
      const doctor = response.data.doctor;
      
      if (!doctor) {
        showNotification('Doctor profile not found', 'error');
        setLoading(false);
        return;
      }

      setDoctorData(doctor);
      
      // Initialize edit form with current data
      setEditForm({
        specialization: doctor.specialization || '',
        qualification: doctor.qualification || '',
        experience: doctor.experience?.toString() || '',
        bio: doctor.bio || '',
        consultationFee: doctor.consultationFee?.toString() || '',
        availableFrom: doctor.availableFrom || '',
        availableTo: doctor.availableTo || '',
        availableDays: Array.isArray(doctor.availableDays) 
          ? doctor.availableDays 
          : (typeof doctor.availableDays === 'string' 
              ? JSON.parse(doctor.availableDays || '[]') 
              : []),
        departmentId: doctor.departmentId || '',
      });
    } catch (error: any) {
      console.error('Error fetching doctor data:', error);
      showNotification(error.response?.data?.message || 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original data
    if (doctorData) {
      setEditForm({
        specialization: doctorData.specialization || '',
        qualification: doctorData.qualification || '',
        experience: doctorData.experience?.toString() || '',
        bio: doctorData.bio || '',
        consultationFee: doctorData.consultationFee?.toString() || '',
        availableFrom: doctorData.availableFrom || '',
        availableTo: doctorData.availableTo || '',
        availableDays: Array.isArray(doctorData.availableDays) 
          ? doctorData.availableDays 
          : (typeof doctorData.availableDays === 'string' 
              ? JSON.parse(doctorData.availableDays || '[]') 
              : []),
        departmentId: doctorData.departmentId || '',
      });
      setProfileImagePreview(null);
      setProfileImageFile(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
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
    setEditForm({ ...editForm, removeProfileImage: true });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      
      formData.append('specialization', editForm.specialization || '');
      formData.append('qualification', editForm.qualification || '');
      formData.append('experience', editForm.experience || '0');
      formData.append('bio', editForm.bio || '');
      formData.append('consultationFee', editForm.consultationFee || '0');
      formData.append('availableFrom', editForm.availableFrom || '');
      formData.append('availableTo', editForm.availableTo || '');
      formData.append('availableDays', JSON.stringify(editForm.availableDays || []));
      formData.append('departmentId', editForm.departmentId || '');
      
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }
      
      if (editForm.removeProfileImage) {
        formData.append('removeProfileImage', 'true');
      }

      await api.put(`/doctors/${doctorData.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showNotification('Profile updated successfully', 'success');
      setIsEditing(false);
      // Refresh doctor data to show updated values
      await fetchDoctorData();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showNotification(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      ?.map((n: string) => n[0])
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2) || 'D';
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'doctor' || !doctorData) {
    return null;
  }

  const displayImage = !editForm.removeProfileImage && (profileImagePreview || (doctorData.profileImage 
    ? `data:${doctorData.profileImageMimeType || 'image/jpeg'};base64,${doctorData.profileImage}` 
    : null));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MedicineAdPanel targetAudience="doctor" />
      <DoctorSidebar user={user} logout={logout} qualification={doctorData?.qualification} />
      <BottomAdPanel />
      <main className="w-full flex-1 transition-all duration-300 lg:ml-[476px] pb-[180px] overflow-x-hidden">
        {/* Modern Header with Simple Color */}
        <header className="bg-teal-600 text-white shadow-xl">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                <p className="text-teal-100">Manage your professional information</p>
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
                    {displayImage ? (
                      <img 
                        src={displayImage} 
                        alt={doctorData.user?.name}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      getInitials(doctorData.user?.name || 'D')
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
                      {(profileImagePreview || doctorData.profileImage) && !editForm.removeProfileImage && (
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
                      value={doctorData.user?.name || ''}
                      disabled
                      className="text-3xl font-bold text-gray-800 mb-4 bg-gray-100 px-4 py-2 rounded-xl border-2 border-gray-300"
                    />
                  ) : (
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">{formatDoctorName(doctorData.user?.name || '', doctorData.qualification)}</h2>
                  )}
                  
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-xl">
                      <FiBriefcase className="text-lg" />
                      <span className="font-semibold">{doctorData.specialization || 'General Medicine'}</span>
                    </div>
                    {doctorData.department && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl">
                        <span className="text-lg">{doctorData.department.icon}</span>
                        <span className="font-semibold">{doctorData.department.name}</span>
                      </div>
                    )}
                    {doctorData.experience && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl">
                        <FiClock className="text-lg" />
                        <span className="font-semibold">{doctorData.experience} years experience</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white">
                      <p className="text-xs text-gray-600 uppercase mb-1 font-semibold">Consultation Fee</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.consultationFee}
                            onChange={(e) => setEditForm({ ...editForm, consultationFee: e.target.value })}
                            className="w-full px-3 py-1 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          `BDT ${doctorData.consultationFee || 0}`
                        )}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white">
                      <p className="text-xs text-gray-600 uppercase mb-1 font-semibold">Status</p>
                      <p className="text-2xl font-bold text-gray-800">
                        <span className={`px-3 py-1 rounded-xl text-sm ${
                          doctorData.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doctorData.status || 'Pending'}
                        </span>
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white">
                      <p className="text-xs text-gray-600 uppercase mb-1 font-semibold">Available</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {doctorData.isAvailable ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white">
                      <p className="text-xs text-gray-600 uppercase mb-1 font-semibold">Experience</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.experience}
                            onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                            className="w-full px-3 py-1 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          `${doctorData.experience || 0} years`
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Professional Information Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <FiBriefcase className="text-teal-600 text-lg" />
                </div>
                Professional Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 uppercase mb-2 font-semibold">Department</label>
                  {isEditing ? (
                    <select
                      value={editForm.departmentId}
                      onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.icon} {dept.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-800 font-medium">
                      {doctorData.department ? `${doctorData.department.icon} ${doctorData.department.name}` : 'Not set'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 uppercase mb-2 font-semibold">Specialization</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.specialization}
                      onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      placeholder="e.g., Cardiologist"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">{doctorData.specialization || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 uppercase mb-2 font-semibold">Qualifications</label>
                  {isEditing ? (
                    <textarea
                      value={editForm.qualification}
                      onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      rows={4}
                      placeholder="Enter your qualifications"
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line">{doctorData.qualification || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 uppercase mb-2 font-semibold">Bio</label>
                  {isEditing ? (
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      rows={4}
                      placeholder="Tell patients about yourself"
                    />
                  ) : (
                    <p className="text-gray-700">{doctorData.bio || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FiMail className="text-blue-600 text-lg" />
                </div>
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <p className="text-xs text-gray-600 uppercase mb-2 font-semibold">Email</p>
                  <p className="text-gray-800 font-medium">{doctorData.user?.email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <p className="text-xs text-gray-600 uppercase mb-2 font-semibold">Phone</p>
                  <p className="text-gray-800 font-medium">{doctorData.user?.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Availability Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <FiCalendar className="text-green-600 text-lg" />
                </div>
                Availability
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 uppercase mb-2 font-semibold">Available Days</label>
                  {isEditing ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                        <label key={day} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(editForm.availableDays || []).includes(day)}
                            onChange={(e) => {
                              const currentDays = editForm.availableDays || [];
                              if (e.target.checked) {
                                setEditForm({ ...editForm, availableDays: [...currentDays, day] });
                              } else {
                                setEditForm({ ...editForm, availableDays: currentDays.filter((d: string) => d !== day) });
                              }
                            }}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">{day}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        // Parse availableDays if it's a string
                        let days = doctorData.availableDays;
                        if (typeof days === 'string') {
                          try {
                            days = JSON.parse(days);
                          } catch (e) {
                            days = [];
                          }
                        }
                        if (Array.isArray(days) && days.length > 0) {
                          return days.map((day: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                              {day}
                            </span>
                          ));
                        } else {
                          return <p className="text-gray-500">No days set</p>;
                        }
                      })()}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 uppercase mb-2 font-semibold">From</label>
                    {isEditing ? (
                      <input
                        type="time"
                        value={editForm.availableFrom}
                        onChange={(e) => setEditForm({ ...editForm, availableFrom: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">{doctorData.availableFrom || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 uppercase mb-2 font-semibold">To</label>
                    {isEditing ? (
                      <input
                        type="time"
                        value={editForm.availableTo}
                        onChange={(e) => setEditForm({ ...editForm, availableTo: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">{doctorData.availableTo || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}