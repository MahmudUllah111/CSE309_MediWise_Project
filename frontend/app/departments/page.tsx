'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import api from '@/lib/api';
import { FiSearch, FiArrowRight } from 'react-icons/fi';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const departmentIcons: { [key: string]: string } = {
    'Cardiology': '❤️',
    'Neurology': '🧠',
    'Orthopedics': '🦴',
    'Pediatrics': '👶',
    'Dermatology': '🧴',
    'General Medicine': '🩺',
    'Gynecology': '👩',
    'Ophthalmology': '👁️',
    'ENT': '👂',
    'Psychiatry': '🧘'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader activePage="departments" />
      {/* Page Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Our Departments</h1>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              Explore our specialized medical departments, each dedicated to providing expert care in their respective fields.
            </p>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Departments Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {filteredDepartments.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">No departments found matching your search.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDepartments.map((department) => (
                <div
                  key={department.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 border border-gray-100"
                >
                  <div className="text-6xl mb-4">{departmentIcons[department.name] || '🏥'}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{department.name}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {department.description || 'Expert medical care in this specialized field.'}
                  </p>
                  <Link
                    href={`/doctors?department=${department.id}`}
                    className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                  >
                    View Doctors <FiArrowRight />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Need Help Choosing a Department?
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Our team is here to help you find the right specialist for your needs.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-semibold text-lg"
          >
            Contact Us
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}