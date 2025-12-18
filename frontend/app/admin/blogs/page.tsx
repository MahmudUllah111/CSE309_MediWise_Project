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
  FiCheck, 
  FiX, 
  FiEye, 
  FiFileText,
  FiClock,
  FiUser
} from 'react-icons/fi';

export default function AdminBlogsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

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
      fetchPendingBlogs();
    }
  }, [user, authLoading, router]);

  const fetchPendingBlogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/blogs/admin/pending');
      setBlogs(response.data.blogs || []);
    } catch (error: any) {
      console.error('Error fetching pending blogs:', error);
      showNotification('Failed to fetch pending blogs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/blogs/admin/${id}/approve`);
      showNotification('Blog approved successfully', 'success');
      fetchPendingBlogs();
      if (selectedBlog?.id === id) {
        setShowModal(false);
        setSelectedBlog(null);
      }
    } catch (error: any) {
      console.error('Error approving blog:', error);
      showNotification('Failed to approve blog', 'error');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to reject this blog?')) return;
    
    try {
      await api.put(`/blogs/admin/${id}/reject`);
      showNotification('Blog rejected successfully', 'success');
      fetchPendingBlogs();
      if (selectedBlog?.id === id) {
        setShowModal(false);
        setSelectedBlog(null);
      }
    } catch (error: any) {
      console.error('Error rejecting blog:', error);
      showNotification('Failed to reject blog', 'error');
    }
  };

  const handleView = (blog: any) => {
    setSelectedBlog(blog);
    setShowModal(true);
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
        <AdminHeader title="Blog Approval" />
        
        <div className="mt-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Pending Blog Posts</h2>
          <p className="text-gray-600">Review and approve blog posts submitted by doctors</p>
        </div>

        {blogs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-300">
            <FiFileText className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No pending blogs to review</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all"
              >
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
                  <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                    <FiClock /> Pending
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{blog.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{blog.excerpt || blog.content?.substring(0, 100) + '...'}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <FiUser />
                  <span>{blog.author?.name || 'Unknown'}</span>
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  {blog.createdAt ? format(new Date(blog.createdAt), 'MMM dd, yyyy') : 'Date not available'}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(blog)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <FiEye /> View
                  </button>
                  <button
                    onClick={() => handleApprove(blog.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                    title="Approve"
                  >
                    <FiCheck />
                  </button>
                  <button
                    onClick={() => handleReject(blog.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                    title="Reject"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Modal */}
        {showModal && selectedBlog && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
                setSelectedBlog(null);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-semibold text-gray-900">Blog Review</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedBlog(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FiX className="text-gray-600" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {selectedBlog.image && (
                  <div className="h-64 rounded-xl overflow-hidden">
                    <img 
                      src={selectedBlog.image.startsWith('http') ? selectedBlog.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${selectedBlog.image}`}
                      alt={selectedBlog.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.parentElement!.innerHTML = '<div class="h-64 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-6xl">📰</div>';
                      }}
                    />
                  </div>
                )}

                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedBlog.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <FiUser />
                      {selectedBlog.author?.name || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock />
                      {selectedBlog.createdAt ? format(new Date(selectedBlog.createdAt), 'MMM dd, yyyy') : 'Date not available'}
                    </span>
                    <span>{selectedBlog.category || 'Health Tips'}</span>
                  </div>
                </div>

                {selectedBlog.excerpt && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Excerpt:</h4>
                    <p className="text-gray-600">{selectedBlog.excerpt}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Content:</h4>
                  <div 
                    className="prose max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: selectedBlog.content || '<p>No content available.</p>' }}
                  />
                </div>

                {selectedBlog.tags && selectedBlog.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedBlog.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-sm font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-300">
                  <button
                    onClick={() => handleReject(selectedBlog.id)}
                    className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <FiX /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedBlog.id)}
                    className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <FiCheck /> Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

