'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { FiActivity, FiUsers, FiFileText, FiCalendar, FiBarChart, FiCheck } from 'react-icons/fi';

export default function ClinicalBoardPage() {
  const features = [
    {
      icon: <FiUsers className="text-4xl" />,
      title: 'Patient Management',
      description: 'Comprehensive patient database with detailed medical history and records.'
    },
    {
      icon: <FiFileText className="text-4xl" />,
      title: 'Medical Records',
      description: 'Secure digital storage and management of all medical documents and reports.'
    },
    {
      icon: <FiCalendar className="text-4xl" />,
      title: 'Appointment Scheduling',
      description: 'Efficient scheduling system with automated reminders and calendar integration.'
    },
    {
      icon: <FiBarChart className="text-4xl" />,
      title: 'Analytics Dashboard',
      description: 'Real-time analytics and insights to track performance and patient outcomes.'
    }
  ];

  const benefits = [
    'Streamlined workflow management',
    'Improved patient care coordination',
    'Enhanced data security and compliance',
    'Reduced administrative burden',
    'Better resource allocation',
    'Comprehensive reporting capabilities'
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      {/* Page Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <FiActivity className="text-5xl" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Clinical Board</h1>
              <p className="text-xl text-teal-100 max-w-2xl">
                Comprehensive clinical management system designed for healthcare professionals and institutions.
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
              Everything you need to manage your clinical operations efficiently
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

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Benefits</h2>
              <p className="text-gray-600">Why choose Clinical Board for your healthcare facility</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-lg">
                  <FiCheck className="text-teal-600 text-xl flex-shrink-0 mt-1" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Contact us today to learn more about Clinical Board and how it can transform your clinical operations.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-semibold text-lg"
          >
            Request a Demo
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}

