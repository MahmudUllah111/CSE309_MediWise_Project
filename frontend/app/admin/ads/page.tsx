'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { FiX, FiPlus, FiEdit, FiTrash2, FiUpload, FiImage, FiCheck, FiXCircle, FiEye } from 'react-icons/fi';

export default function AdminAdsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [ads, setAds] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewAd, setPreviewAd] = useState<any>(null);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [adForm, setAdForm] = useState({
    title: '',
    medicineName: '',
    indications: '',
    description: '',
    imageUrl: '',
    link: '',
    departmentId: '',
    isNewMedicine: false,
    isActive: true,
    targetAudience: 'doctor',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAds();
      fetchDepartments();
    }
  }, [user]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      // Admin page - fetch ALL ads without any filters
      const response = await api.get('/ads?limit=10000&includeInactive=true');
      console.log('=== FETCH ADS DEBUG ===');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('Success flag:', response.data?.success);
      console.log('Ads array:', response.data?.ads);
      console.log('Ads count:', response.data?.ads?.length);
      
      if (response.data && response.data.success === true) {
        const fetchedAds = response.data.ads || [];
        console.log(`✅ Successfully fetched ${fetchedAds.length} ads`);
        if (fetchedAds.length > 0) {
          console.log('First ad:', fetchedAds[0]);
        }
        setAds(fetchedAds);
      } else if (response.data && response.data.success === false) {
        console.warn('❌ API returned success: false');
        console.warn('Error message:', response.data.message);
        setAds([]);
        showNotification(response.data.message || 'Failed to fetch ads', 'error');
      } else {
        // No success flag, but might have ads
        const fetchedAds = response.data?.ads || [];
        console.log(`⚠️ No success flag, but found ${fetchedAds.length} ads`);
        setAds(fetchedAds);
      }
    } catch (error: any) {
      console.error('❌ ERROR fetching ads:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      setAds([]);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch ads';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
      console.log('=== FETCH ADS COMPLETE ===');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        showNotification('Image size must be less than 5MB. Please compress or choose a smaller image.', 'error');
        return;
      }
      
      setImageFile(file);
      
      // Convert to base64 for preview and upload
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setAdForm({ ...adForm, imageUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!adForm.medicineName && !adForm.title) {
      showNotification('Medicine Name or Title is required', 'error');
      return;
    }

    if (!adForm.departmentId || adForm.departmentId.trim() === '') {
      showNotification('Please select a department', 'error');
      return;
    }
    
    try {
      // Clean up the form data
      const submitData = {
        ...adForm,
        departmentId: adForm.departmentId && adForm.departmentId.trim() !== '' 
          ? adForm.departmentId.trim() 
          : null,
        link: adForm.link && adForm.link.trim() !== '' ? adForm.link.trim() : null,
        imageUrl: adForm.imageUrl && adForm.imageUrl.trim() !== '' ? adForm.imageUrl.trim() : null,
      };

      if (editingAd) {
        const response = await api.put(`/ads/${editingAd.id}`, submitData);
        console.log('Ad updated:', response.data);
        showNotification('Ad updated successfully', 'success');
      } else {
        const response = await api.post('/ads', submitData);
        console.log('Ad created:', response.data);
        showNotification('Ad created successfully', 'success');
      }
      
      setShowModal(false);
      resetForm();
      // Wait a bit before fetching to ensure database is updated
      setTimeout(() => {
        fetchAds();
      }, 500);
    } catch (error: any) {
      console.error('Error saving ad:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save ad';
      showNotification(errorMessage, 'error');
    }
  };

  const handleEdit = (ad: any) => {
    setEditingAd(ad);
    setAdForm({
      title: ad.title || '',
      medicineName: ad.medicineName || '',
      indications: ad.indications || '',
      description: ad.description || '',
      imageUrl: ad.imageUrl || '',
      link: ad.link || '',
      departmentId: ad.departmentId || '',
      isNewMedicine: ad.isNewMedicine || false,
      isActive: ad.isActive !== undefined ? ad.isActive : true,
      targetAudience: ad.targetAudience || 'doctor',
    });
    setImagePreview(ad.imageUrl || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    
    try {
      await api.delete(`/ads/${id}`);
      showNotification('Ad deleted successfully', 'success');
      fetchAds();
    } catch (error: any) {
      console.error('Error deleting ad:', error);
      showNotification(error.response?.data?.message || 'Failed to delete ad', 'error');
    }
  };

  const resetForm = () => {
    setAdForm({
      title: '',
      medicineName: '',
      indications: '',
      description: '',
      imageUrl: '',
      link: '',
      departmentId: '',
      isNewMedicine: false,
      isActive: true,
      targetAudience: 'doctor',
    });
    setEditingAd(null);
    setImageFile(null);
    setImagePreview('');
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="w-full lg:ml-64 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Medicine Ads</h1>
            <p className="text-gray-600">Manage medicine advertisements for prescription page</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-6 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
          >
            <FiPlus />
            Create Ad
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilterActive('all')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              filterActive === 'all'
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Ads ({ads.length})
          </button>
          <button
            onClick={() => setFilterActive('active')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              filterActive === 'active'
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Active ({ads.filter(a => a.isActive).length})
          </button>
          <button
            onClick={() => setFilterActive('inactive')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              filterActive === 'inactive'
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Inactive ({ads.filter(a => !a.isActive).length})
          </button>
        </div>

        {/* Ads List */}
        {(() => {
          const filteredAds = filterActive === 'all' 
            ? ads 
            : filterActive === 'active' 
            ? ads.filter(a => a.isActive)
            : ads.filter(a => !a.isActive);

          if (filteredAds.length === 0) {
            return (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-300">
                <p className="text-gray-500 text-lg">
                  {filterActive === 'all' 
                    ? 'No ads created yet' 
                    : filterActive === 'active'
                    ? 'No active ads'
                    : 'No inactive ads'}
                </p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAds.map((ad) => (
                <div
                  key={ad.id}
                  className={`bg-white rounded-2xl shadow-xl p-6 border-2 hover:shadow-2xl transition-all ${
                    !ad.isActive ? 'border-red-300 opacity-75' : 'border-gray-300'
                  }`}
                >
                  {ad.imageUrl && (
                    <div className="w-full h-48 mb-4 rounded-xl overflow-hidden bg-gray-50">
                      <img
                        src={ad.imageUrl}
                        alt={ad.medicineName || ad.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      {ad.medicineName || ad.title}
                    </h3>
                    {ad.indications && (
                      <p className="text-sm text-gray-700 font-medium mb-2">
                        For: {ad.indications}
                      </p>
                    )}
                    {ad.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {ad.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {ad.isNewMedicine && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          New Medicine
                        </span>
                      )}
                      {ad.departmentId && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                          {departments.find(d => d.id === ad.departmentId)?.name || 'Department'}
                        </span>
                      )}
                      {ad.isActive ? (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPreviewAd(ad);
                        setShowPreviewModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                      title="Preview"
                    >
                      <FiEye />
                      Preview
                    </button>
                    <button
                      onClick={() => handleEdit(ad)}
                      className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <FiEdit />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Preview Modal */}
        {showPreviewModal && previewAd && (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPreviewModal(false);
                setPreviewAd(null);
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Ad Preview</h2>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewAd(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>
              
              {/* Preview similar to AdsPanel */}
              <div className="w-full bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                {previewAd.imageUrl && (
                  <div className="w-full mb-4 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                    <img
                      src={previewAd.imageUrl}
                      alt={previewAd.medicineName || previewAd.title}
                      className="w-full h-48 object-contain"
                    />
                  </div>
                )}
                
                <div className="mb-3">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight text-center mb-2">
                    {previewAd.medicineName || previewAd.title}
                  </h3>
                  
                  {previewAd.indications && (
                    <p className="text-sm text-gray-700 font-medium text-center mb-2">
                      For: {previewAd.indications}
                    </p>
                  )}
                  
                  {previewAd.description && (
                    <p className="text-xs text-gray-600 leading-relaxed text-left">
                      {previewAd.description}
                    </p>
                  )}
                </div>
                
                {previewAd.isNewMedicine && (
                  <div className="flex justify-start mt-2">
                    <span className="inline-block px-2 py-1 bg-green-500 text-white text-xs rounded font-semibold">
                      New
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleEdit(previewAd);
                    setPreviewAd(null);
                  }}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium"
                >
                  Edit This Ad
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewAd(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
                resetForm();
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingAd ? 'Edit Ad' : 'Create New Ad'}
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

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Medicine Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adForm.medicineName}
                    onChange={(e) => setAdForm({ ...adForm, medicineName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter medicine name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    For Which Diseases/Conditions <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adForm.indications}
                    onChange={(e) => setAdForm({ ...adForm, indications: e.target.value })}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., Hypertension, Heart Disease, Angina, High Blood Pressure"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple diseases/conditions with commas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={adForm.title}
                    onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter ad title (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description (1-2 lines)
                  </label>
                  <textarea
                    value={adForm.description}
                    onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., Effective beta-blocker medication that helps lower blood pressure and heart rate. Safe and widely prescribed."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Additional details about the medicine
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Medicine Image
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium cursor-pointer flex items-center gap-2"
                    >
                      <FiUpload />
                      Upload Image
                    </label>
                    {imagePreview && (
                      <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-300">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={adForm.link}
                    onChange={(e) => setAdForm({ ...adForm, link: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Department <span className="text-blue-600 font-normal">(Required)</span>
                    </label>
                    <select
                      value={adForm.departmentId}
                      onChange={(e) => setAdForm({ ...adForm, departmentId: e.target.value })}
                      required
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      ⚠️ This ad will only show to doctors in the selected department. Select a department to target specific doctors.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Medicine Type
                    </label>
                    <select
                      value={adForm.isNewMedicine ? 'new' : 'old'}
                      onChange={(e) => setAdForm({ ...adForm, isNewMedicine: e.target.value === 'new' })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="old">Old Medicine</option>
                      <option value="new">New Medicine</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adForm.isActive}
                      onChange={(e) => setAdForm({ ...adForm, isActive: e.target.checked })}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-300">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <FiCheck />
                    {editingAd ? 'Update Ad' : 'Create Ad'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}