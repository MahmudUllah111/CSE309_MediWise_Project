'use client';

import Link from 'next/link';
import { FiActivity, FiCalendar, FiSettings, FiArrowRight } from 'react-icons/fi';

export default function ProductsPage() {
  const products = [
    {
      icon: <FiActivity className="text-5xl" />,
      title: 'Clinical Board',
      description: 'Comprehensive clinical management system for healthcare professionals.',
      link: '/products/clinical-board',
      color: 'from-blue-500 to-blue-600',
      features: ['Patient Management', 'Medical Records', 'Appointment Scheduling', 'Analytics Dashboard']
    },
    {
      icon: <FiCalendar className="text-5xl" />,
      title: 'Events',
      description: 'Manage and organize healthcare events, workshops, and medical conferences.',
      link: '/products/events',
      color: 'from-green-500 to-green-600',
      features: ['Event Registration', 'Schedule Management', 'Attendee Tracking', 'Resource Sharing']
    },
    {
      icon: <FiSettings className="text-5xl" />,
      title: 'Service',
      description: 'Complete healthcare service management platform for institutions.',
      link: '/products/service',
      color: 'from-purple-500 to-purple-600',
      features: ['Service Catalog', 'Resource Allocation', 'Quality Monitoring', 'Performance Metrics']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Our Products</h1>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              Comprehensive healthcare solutions designed to improve patient care and streamline operations.
            </p>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <Link
                key={index}
                href={product.link}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${product.color} rounded-full flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  {product.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">{product.title}</h3>
                <p className="text-gray-600 mb-6 text-center">{product.description}</p>
                <ul className="space-y-2 mb-6">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-700">
                      <span className="text-teal-600">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-center gap-2 text-teal-600 font-semibold group-hover:gap-3 transition-all">
                  Learn More <FiArrowRight />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Interested in Our Products?</h2>
          <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
            Contact us to learn more about how our products can benefit your healthcare organization.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-lg"
          >
            Contact Sales
          </Link>
        </div>
      </section>
    </div>
  );
}