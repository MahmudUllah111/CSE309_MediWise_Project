'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { FiCalendar, FiUser, FiArrowRight, FiTag, FiArrowLeft, FiShare2, FiBookmark } from 'react-icons/fi';
import api from '@/lib/api';

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postId = params.id;
    if (postId) {
      fetchBlog(postId as string);
      fetchRelatedBlogs(postId as string);
    }
  }, [params.id]);

  const fetchBlog = async (id: string) => {
    try {
      const response = await api.get(`/blogs/${id}`);
      setPost(response.data.blog);
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async (currentId: string) => {
    try {
      const response = await api.get('/blogs', { params: { limit: 4 } });
      const blogs = response.data.blogs || [];
      const related = blogs.filter((b: any) => b.id !== parseInt(currentId)).slice(0, 3);
      setRelatedPosts(related);
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader activePage="blog" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
          <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700"
          >
            <FiArrowLeft /> Back to Blog
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader activePage="blog" />
      
      {/* Article Header */}
      <header className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-teal-100 hover:text-white mb-6 transition-colors"
          >
            <FiArrowLeft /> Back to Blog
          </Link>
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-4 text-sm">
              <span className="flex items-center gap-1 bg-teal-500 px-3 py-1 rounded-full">
                <FiTag />
                {post.category || 'Health Tips'}
              </span>
              <span className="flex items-center gap-1">
                <FiCalendar />
                {new Date(post.createdAt || post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">{post.title}</h1>
            <div className="flex items-center gap-6 text-teal-100">
              <div className="flex items-center gap-2">
                <FiUser />
                <span>{post.author?.name || 'Dr. Anonymous'}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>{post.views || 0} views</span>
                <span>{post.comments || 0} comments</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <article className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Featured Image */}
            {post.image ? (
              <div className="mb-12 h-96 rounded-2xl overflow-hidden">
                <img 
                  src={post.image.startsWith('http') ? post.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${post.image}`}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.parentElement!.innerHTML = '<div class="mb-12 h-96 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center text-9xl">📰</div>';
                  }}
                />
              </div>
            ) : (
              <div className="mb-12 h-96 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center text-9xl">
                📰
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-teal-50 text-teal-600 rounded-full text-sm font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Article Body */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: post.content || post.fullContent || '<p>No content available.</p>' }}
            />

            {/* Share Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Share this article</h3>
                  <div className="flex items-center gap-3">
                    <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      <FiShare2 className="text-gray-600" />
                    </button>
                    <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      <FiBookmark className="text-gray-600" />
                    </button>
                  </div>
                </div>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                >
                  <FiArrowLeft /> Back to Blog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Articles</h2>
            {relatedPosts.length === 0 ? (
              <p className="text-gray-600">No related articles found.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.id}`}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    {relatedPost.image ? (
                      <div className="h-32 overflow-hidden">
                        <img 
                          src={relatedPost.image.startsWith('http') ? relatedPost.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${relatedPost.image}`}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.parentElement!.innerHTML = '<div class="h-32 bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-4xl">📰</div>';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-32 bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-4xl">
                        📰
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{relatedPost.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{relatedPost.excerpt || relatedPost.content?.substring(0, 100) + '...'}</p>
                      <span className="inline-flex items-center gap-1 text-teal-600 font-semibold text-sm">
                        Read More <FiArrowRight />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

