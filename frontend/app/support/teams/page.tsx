'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { FiUsers, FiMail, FiMessageCircle, FiShield, FiHeart } from 'react-icons/fi';

export default function TeamsPage() {
  const teams = [
    {
      name: 'Customer Support Team',
      description: 'Our customer support team is available 24/7 to assist you with any questions or concerns.',
      icon: <FiMessageCircle className="text-4xl" />,
      responsibilities: [
        'Answer customer inquiries',
        'Resolve technical issues',
        'Provide account assistance',
        'Schedule appointments'
      ],
      contact: 'support@mediwise.com',
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Medical Team',
      description: 'Our expert medical professionals ensure the highest quality of healthcare services.',
      icon: <FiHeart className="text-4xl" />,
      responsibilities: [
        'Provide medical consultations',
        'Review patient cases',
        'Ensure quality care',
        'Medical expertise'
      ],
      contact: 'medical@mediwise.com',
      color: 'from-red-500 to-red-600'
    },
    {
      name: 'Technical Team',
      description: 'Our technical team maintains and improves the platform for seamless user experience.',
      icon: <FiShield className="text-4xl" />,
      responsibilities: [
        'Platform maintenance',
        'Security updates',
        'Feature development',
        'Technical support'
      ],
      contact: 'tech@mediwise.com',
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Administrative Team',
      description: 'Our administrative team handles operations and ensures smooth business processes.',
      icon: <FiUsers className="text-4xl" />,
      responsibilities: [
        'Business operations',
        'Partnership management',
        'Administrative support',
        'Coordination'
      ],
      contact: 'admin@mediwise.com',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      {/* Page Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Our Teams</h1>
            <p className="text-xl text-teal-100 max-w-2xl">
              Meet the dedicated teams working behind the scenes to provide you with the best healthcare experience.
            </p>
          </div>
        </div>
      </header>

      {/* Teams Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-8">
            {teams.map((team, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8">
                <div className={`w-20 h-20 bg-gradient-to-br ${team.color} rounded-full flex items-center justify-center text-white mb-6`}>
                  {team.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{team.name}</h3>
                <p className="text-gray-600 mb-6">{team.description}</p>
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Responsibilities:</h4>
                  <ul className="space-y-2">
                    {team.responsibilities.map((resp, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-600">
                        <span className="text-teal-600 mt-1">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2 text-teal-600">
                  <FiMail />
                  <a href={`mailto:${team.contact}`} className="hover:underline">{team.contact}</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Want to Join Our Team?</h2>
          <p className="text-gray-600 mb-8 text-lg">We're always looking for talented individuals to join our mission.</p>
          <Link
            href="/support/career"
            className="inline-block px-8 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-lg"
          >
            View Career Opportunities
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}