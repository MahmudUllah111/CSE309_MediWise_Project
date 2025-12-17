'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { FiSettings, FiList, FiUsers, FiBarChart, FiCheck } from 'react-icons/fi';

export default function ServicePage() {
  const features = [
    {
      icon: <FiList className="text-4xl" />,
      title: 'Service Catalog',
      description: 'Comprehensive catalog of all healthcare services with detailed descriptions and pricing.'
    },
    {
      icon: <FiUsers className="text-4xl" />,
      title: 'Resource Allocation',
      description: 'Efficiently allocate staff, equipment, and facilities to optimize service delivery.'
    },
    {
      icon: <FiBarChart className="text-4xl" />,
      title: 'Quality Monitoring',
      description: 'Track and monitor service quality metrics to ensure high standards of care.'
    },
    {
      icon: <FiSettings className="text-4xl" />,
      title: 'Performance Metrics',
      description: 'Real-time analytics and reporting to measure and improve service performance.'
    }
  ];

  const services = [
    'Patient Care Services',
    'Diagnostic Services',
    'Therapeutic Services',
    'Preventive Care',
    'Emergency Services',
    'Rehabilitation Services',
    'Consultation Services',
    'Support Services'
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      {/* Page Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <FiSettings className="text-5xl" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Service Management</h1>
              <p className="text-xl text-teal-100 max-w-2xl">
                Complete healthcare service management platform for institutions and organizations.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools for managing healthcare services effectively
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className="text-teal-600 mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Types */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Service Categories</h2>
              <p className="text-gray-600">Manage all types of healthcare services</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-lg">
                  <FiCheck className="text-teal-600 text-xl flex-shrink-0" />
                  <span className="text-gray-700 font-semibold text-sm">{service}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Optimize Your Services</h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Learn how our service management platform can help improve efficiency and patient satisfaction.
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