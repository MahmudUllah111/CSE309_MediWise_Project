'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import api from '@/lib/api';
import { FiBriefcase, FiMapPin, FiClock, FiArrowRight, FiDollarSign, FiCalendar, FiLayers } from 'react-icons/fi';
import { format } from 'date-fns';

export default function CareerPage() {
  const [jobOpenings, setJobOpenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jobs', { params: { isActive: 'true' } });
      setJobOpenings(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Fallback to empty array if API fails
      setJobOpenings([]);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'Competitive salary package',
    'Health insurance coverage',
    'Flexible working hours',
    'Remote work options',
    'Professional development opportunities',
    'Team building activities',
    'Paid time off',
    'Performance bonuses'
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      {/* Page Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Career Opportunities</h1>
            <p className="text-xl text-teal-100 max-w-2xl">
              Join our mission to revolutionize healthcare. Explore exciting career opportunities with MediWise.
            </p>
          </div>
        </div>
      </header>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Work With Us?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We offer competitive benefits and a supportive work environment
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-lg text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="text-gray-700 font-semibold">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Openings */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-gray-600">Find the perfect role for you</p>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">Loading job openings...</p>
            </div>
          ) : jobOpenings.length === 0 ? (
            <div className="text-center py-12">
              <FiBriefcase className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Open Positions</h3>
              <p className="text-gray-600">We don't have any open positions at the moment. Check back later!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {jobOpenings.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h3>
                      {job.department && (
                        <span className="inline-block px-3 py-1 bg-teal-100 text-teal-600 rounded-full text-sm font-semibold mb-3">
                          {job.department}
                        </span>
                      )}
                    </div>
                    <FiBriefcase className="text-4xl text-teal-600" />
                  </div>
                  <div className="space-y-2 mb-4 text-gray-600">
                    {job.location && (
                      <div className="flex items-center gap-2">
                        <FiMapPin className="text-teal-600" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <FiClock className="text-teal-600" />
                      <span className="capitalize">{job.type?.replace('-', ' ')}</span>
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-2">
                        <FiDollarSign className="text-teal-600" />
                        <span>{job.salary}</span>
                      </div>
                    )}
                    {job.applicationDeadline && (
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-teal-600" />
                        <span>Deadline: {format(new Date(job.applicationDeadline), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-3">{job.description}</p>
                  {job.requirements && (
                    <details className="mb-4">
                      <summary className="cursor-pointer text-teal-600 font-semibold mb-2">View Requirements</summary>
                      <p className="text-gray-600 text-sm mt-2 whitespace-pre-line">{job.requirements}</p>
                    </details>
                  )}
                  <Link
                    href={`/jobs/apply/${job.id}`}
                    className="block w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-center flex items-center justify-center gap-2"
                  >
                    Apply Now <FiArrowRight />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Don't See a Role That Fits?</h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-semibold text-lg"
          >
            Send Your Resume
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}