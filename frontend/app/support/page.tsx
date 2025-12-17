'use client';

import Link from 'next/link';
import { FiUsers, FiBriefcase, FiFileText, FiShield, FiArrowRight, FiHelpCircle } from 'react-icons/fi';

export default function SupportPage() {
  const supportSections = [
    {
      icon: <FiUsers className="text-5xl" />,
      title: 'Teams',
      description: 'Learn about our dedicated support teams and how they can help you.',
      link: '/support/teams',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <FiBriefcase className="text-5xl" />,
      title: 'Career',
      description: 'Explore career opportunities and join our growing healthcare team.',
      link: '/support/career',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <FiFileText className="text-5xl" />,
      title: 'Blog',
      description: 'Read our latest articles, health tips, and medical insights.',
      link: '/blog',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <FiShield className="text-5xl" />,
      title: 'Security',
      description: 'Learn about our security measures and how we protect your data.',
      link: '/support/security',
      color: 'from-red-500 to-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Support Center</h1>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              Find help, resources, and information about our services and team.
            </p>
          </div>
        </div>
      </header>

      {/* Support Sections */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {supportSections.map((section, index) => (
              <Link
                key={index}
                href={section.link}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 text-center"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${section.color} rounded-full flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  {section.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{section.title}</h3>
                <p className="text-gray-600 mb-4">{section.description}</p>
                <div className="flex items-center justify-center gap-2 text-teal-600 font-semibold group-hover:gap-3 transition-all">
                  Learn More <FiArrowRight />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Help */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <FiHelpCircle className="text-6xl text-teal-600 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Need More Help?</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Can't find what you're looking for? Our support team is here to assist you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-lg"
              >
                Contact Support
              </Link>
              <Link
                href="/faq"
                className="px-8 py-4 bg-white border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-semibold text-lg"
              >
                View FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


import Link from 'next/link';
import { FiUsers, FiBriefcase, FiFileText, FiShield, FiArrowRight, FiHelpCircle } from 'react-icons/fi';

export default function SupportPage() {
  const supportSections = [
    {
      icon: <FiUsers className="text-5xl" />,
      title: 'Teams',
      description: 'Learn about our dedicated support teams and how they can help you.',
      link: '/support/teams',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <FiBriefcase className="text-5xl" />,
      title: 'Career',
      description: 'Explore career opportunities and join our growing healthcare team.',
      link: '/support/career',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <FiFileText className="text-5xl" />,
      title: 'Blog',
      description: 'Read our latest articles, health tips, and medical insights.',
      link: '/blog',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <FiShield className="text-5xl" />,
      title: 'Security',
      description: 'Learn about our security measures and how we protect your data.',
      link: '/support/security',
      color: 'from-red-500 to-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Support Center</h1>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              Find help, resources, and information about our services and team.
            </p>
          </div>
        </div>
      </header>

      {/* Support Sections */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {supportSections.map((section, index) => (
              <Link
                key={index}
                href={section.link}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 text-center"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${section.color} rounded-full flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  {section.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{section.title}</h3>
                <p className="text-gray-600 mb-4">{section.description}</p>
                <div className="flex items-center justify-center gap-2 text-teal-600 font-semibold group-hover:gap-3 transition-all">
                  Learn More <FiArrowRight />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Help */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <FiHelpCircle className="text-6xl text-teal-600 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Need More Help?</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Can't find what you're looking for? Our support team is here to assist you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-lg"
              >
                Contact Support
              </Link>
              <Link
                href="/faq"
                className="px-8 py-4 bg-white border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-semibold text-lg"
              >
                View FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}











