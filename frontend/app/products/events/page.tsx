'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { FiCalendar, FiUsers, FiClock, FiMapPin, FiCheck } from 'react-icons/fi';

export default function EventsPage() {
  const features = [
    {
      icon: <FiCalendar className="text-4xl" />,
      title: 'Event Registration',
      description: 'Easy online registration system for attendees with automated confirmations.'
    },
    {
      icon: <FiUsers className="text-4xl" />,
      title: 'Attendee Management',
      description: 'Track and manage all event attendees with detailed profiles and preferences.'
    },
    {
      icon: <FiClock className="text-4xl" />,
      title: 'Schedule Management',
      description: 'Create and manage event schedules with multiple sessions and tracks.'
    },
    {
      icon: <FiMapPin className="text-4xl" />,
      title: 'Venue & Resources',
      description: 'Manage event venues, resources, and logistics all in one place.'
    }
  ];

  const eventTypes = [
    'Medical Conferences',
    'Healthcare Workshops',
    'Training Seminars',
    'Continuing Education',
    'Medical Webinars',
    'Health Awareness Campaigns'
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      {/* Page Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <FiCalendar className="text-5xl" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Events Management</h1>
              <p className="text-xl text-teal-100 max-w-2xl">
                Comprehensive platform for organizing and managing healthcare events, conferences, and workshops.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Event Management Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to organize successful healthcare events
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

      {/* Event Types */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Supported Event Types</h2>
              <p className="text-gray-600">Perfect for various healthcare events and activities</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventTypes.map((type, index) => (
                <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-lg">
                  <FiCheck className="text-teal-600 text-xl flex-shrink-0" />
                  <span className="text-gray-700 font-semibold">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Plan Your Next Event</h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Start organizing your healthcare event today with our comprehensive event management platform.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-semibold text-lg"
          >
            Get Started
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}