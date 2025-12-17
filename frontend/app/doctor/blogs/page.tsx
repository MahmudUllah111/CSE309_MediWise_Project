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
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiFileText, 
  FiX, 
  FiUpload,
  FiCheck,
  FiClock,
  FiXCircle,
  FiEye,
  FiTag,
  FiCalendar,
  FiTrendingUp,
  FiImage
} from 'react-icons/fi';

export default function DoctorBlogsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Health Tips',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  const categories = ['Health Tips', 'Medical News', 'Technology', 'Prevention', 'Treatment'];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'doctor') {
      router.push('/dashboard');
      return;
    }
    if (user && user.role === 'doctor') {
      fetchBlogs();
    }
  }, [user, authLoading, router]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/blogs/my/blogs');
      setBlogs(response.data?.blogs || []);
    } catch (error: any) {
      console.error('Error fetching blogs:', error);
      // Set empty array on error to prevent UI crashes
      setBlogs([]);
      // Only show notification if it's not a network error
      if (error.response?.status !== 500) {
        showNotification('Failed to fetch blogs', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category: 'Health Tips',
      tags: [],
    });
    setImageFile(null);
    setImagePreview('');
    setTagInput('');
    setEditingBlog(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('excerpt', formData.excerpt || formData.content.substring(0, 200) + '...');
      formDataToSend.append('content', formData.content);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('tags', JSON.stringify(formData.tags));
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (editingBlog) {
        await api.put(`/blogs/${editingBlog.id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        showNotification('Blog updated successfully. Waiting for admin approval.', 'success');
      } else {
        await api.post('/blogs', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        showNotification('Blog submitted successfully. Waiting for admin approval.', 'success');
      }
      
      setShowModal(false);
      resetForm();
      fetchBlogs();
    } catch (error: any) {
      console.error('Error saving blog:', error);
      if (error.response?.status === 403) {
        showNotification('Access denied. Please make sure you are logged in as a doctor.', 'error');
      } else {
        showNotification(error.response?.data?.message || 'Failed to save blog', 'error');
      }
    }
  };

  const handleEdit = (blog: any) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      category: blog.category || 'Health Tips',
      tags: blog.tags || [],
    });
    if (blog.image) {
      setImagePreview(blog.image.startsWith('http') ? blog.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${blog.image}`);
    }
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;
    
    try {
      await api.delete(`/blogs/${id}`);
      showNotification('Blog deleted successfully', 'success');
      fetchBlogs();
    } catch (error: any) {
      console.error('Error deleting blog:', error);
      showNotification('Failed to delete blog', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <FiCheck /> Approved
        </span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <FiClock /> Pending
        </span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <FiXCircle /> Rejected
        </span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold w-fit">{status}</span>;
    }
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
      <DoctorSidebar user={user} logout={logout} />
      <BottomAdPanel />
      <main className="w-full flex-1 transition-all duration-300 lg:ml-[476px] pb-[180px] overflow-x-hidden relative z-10">
        {/* Modern Header with Simple Color */}
        <header className="bg-teal-600 text-white shadow-xl">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Blog Posts</h1>
                <p className="text-sm sm:text-base text-teal-100">Create, manage, and track your blog articles</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="px-6 py-3 bg-white text-teal-600 rounded-xl hover:bg-teal-50 transition-all font-semibold flex items-center gap-2 shadow-lg"
                >
                  <FiPlus className="text-xl" /> Create New Blog
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {showModal ? (
            /* Create/Edit Blog Form - Inline on Page */
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 min-h-[calc(100vh-200px)] relative z-20">
              {/* Header with Back Button */}
              <div className="px-6 py-5 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-50 to-white dark:from-gray-800 dark:to-gray-800 shrink-0 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                    {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {editingBlog ? 'Update your blog post' : 'Create a new blog post to share with the community'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <FiX className="text-lg" />
                  Back to Blogs
                </button>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-6 relative z-30">
                <form onSubmit={handleSubmit} className="space-y-6 relative z-30">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 relative z-40"
                      placeholder="Enter blog title"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Excerpt (Short Description)
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 relative z-40"
                      placeholder="Brief description of the blog (optional - will be auto-generated from content if not provided)"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                      rows={15}
                      className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 relative z-40"
                      placeholder="Write your blog content here. You can use HTML for formatting."
                      autoComplete="off"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      You can use HTML tags for formatting (e.g., &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;li&gt;)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Blog Image
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="blog-image-upload"
                      />
                      <label
                        htmlFor="blog-image-upload"
                        className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all font-medium cursor-pointer flex items-center gap-2 shadow-lg"
                      >
                        <FiUpload className="text-lg" />
                        {imagePreview ? 'Change Image' : 'Upload Image'}
                      </label>
                      {imagePreview && (
                        <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 relative z-40"
                        placeholder="Add a tag and press Enter"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-teal-50 dark:bg-teal-900 text-teal-600 dark:text-teal-300 rounded-full text-sm font-semibold flex items-center gap-2"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-teal-600 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-100"
                            >
                              <FiX className="text-xs" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-300 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <FiCheck />
                      {editingBlog ? 'Update Blog' : 'Submit Blog'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center border border-gray-100 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">No blogs created yet</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all font-semibold inline-flex items-center gap-2 shadow-lg"
              >
                <FiPlus className="text-xl" /> Create Your First Blog
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  {/* Image Section */}
                  {blog.image ? (
                    <div className="h-48 mb-4 rounded-xl overflow-hidden">
                      <img 
                        src={blog.image.startsWith('http') ? blog.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${blog.image}`}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.parentElement!.innerHTML = '<div class="h-48 mb-4 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-6xl">📰</div>';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-48 mb-4 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-6xl">
                      📰
                    </div>
                  )}
                  
                  <div className="mb-4">
                    {getStatusBadge(blog.status)}
                  </div>
                  
                  <h3 className="font-bold text-lg text-gray-800 mb-3 line-clamp-2">{blog.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{blog.excerpt || blog.content?.substring(0, 100) + '...'}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{blog.views || 0} views</span>
                    <span>
                      {blog.createdAt && !isNaN(new Date(blog.createdAt).getTime()) 
                        ? format(new Date(blog.createdAt), 'MMM dd, yyyy')
                        : 'Date not available'}
                    </span>
                  </div>
                  
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {blog.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-teal-50 text-teal-600 rounded-lg text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {blog.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                          +{blog.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(blog)}
                      className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <FiEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

