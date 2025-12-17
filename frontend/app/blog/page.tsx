'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { FiCalendar, FiUser, FiArrowRight, FiTag, FiSearch } from 'react-icons/fi';
import api from '@/lib/api';

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Health Tips', 'Medical News', 'Technology', 'Prevention', 'Treatment'];

  useEffect(() => {
    fetchBlogs();
  }, [selectedCategory, searchQuery]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      const response = await api.get('/blogs', { params });
      setBlogPosts(response.data.blogs || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader activePage="blog" />
      {/* Page Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Blog & News</h1>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              Stay updated with the latest healthcare news, medical insights, and health tips from our expert team.
            </p>
          </div>
        </div>
      </header>

      {/* Search and Filter Section */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600 outline-none"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category === 'All' ? 'all' : category)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    (category === 'All' && selectedCategory === 'all') || selectedCategory === category
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading blogs...</p>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">No articles found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
                >
                  {post.image ? (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={post.image.startsWith('http') ? post.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${post.image}`}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.parentElement!.innerHTML = '<div class="h-48 bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-6xl">📰</div>';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-6xl">
                      📰
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiTag className="text-teal-600" />
                        {post.category || 'Health Tips'}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiCalendar />
                        {new Date(post.createdAt || post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{post.title}</h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt || post.content?.substring(0, 150) + '...'}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiUser />
                        <span>{post.author?.name || 'Dr. Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{post.views || 0} views</span>
                        <span>{post.comments || 0} comments</span>
                      </div>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-xs font-semibold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link
                      href={`/blog/${post.id}`}
                      className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                    >
                      Read More <FiArrowRight />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Stay Updated
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter to receive the latest health tips and medical news directly in your inbox.
          </p>
          <Link
            href="/#newsletter"
            className="inline-block px-8 py-4 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-semibold text-lg"
          >
            Subscribe Now
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}