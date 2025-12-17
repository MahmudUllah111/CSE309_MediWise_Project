'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { FiShield, FiLock, FiEye, FiKey, FiCheck } from 'react-icons/fi';

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: <FiLock className="text-4xl" />,
      title: 'Data Encryption',
      description: 'All your medical data is encrypted using industry-standard AES-256 encryption to ensure maximum security.'
    },
    {
      icon: <FiShield className="text-4xl" />,
      title: 'Secure Servers',
      description: 'Our servers are protected with advanced security measures and regular security audits.'
    },
    {
      icon: <FiKey className="text-4xl" />,
      title: 'Access Control',
      description: 'Multi-factor authentication and role-based access control ensure only authorized personnel can access sensitive data.'
    },
    {
      icon: <FiEye className="text-4xl" />,
      title: 'Privacy Protection',
      description: 'We strictly adhere to HIPAA and GDPR regulations to protect your privacy and personal information.'
    }
  ];

  const securityMeasures = [
    'End-to-end encryption for all communications',
    'Regular security audits and penetration testing',
    'Secure data backup and disaster recovery',
    'Compliance with international security standards',
    '24/7 security monitoring and threat detection',
    'Regular security training for all staff',
    'Secure payment processing',
    'Two-factor authentication available'
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      {/* Page Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Security & Privacy</h1>
            <p className="text-xl text-teal-100 max-w-2xl">
              Your data security and privacy are our top priorities. Learn how we protect your information.
            </p>
          </div>
        </div>
      </header>

      {/* Security Features */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-8">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className="text-teal-600 mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Security Measures</h2>
              <p className="text-gray-600">
                We implement multiple layers of security to protect your data
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {securityMeasures.map((measure, index) => (
                <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-lg">
                  <FiCheck className="text-teal-600 text-xl flex-shrink-0 mt-1" />
                  <span className="text-gray-700">{measure}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Policy Link */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              We are committed to protecting your privacy. Our comprehensive privacy policy outlines how we collect, 
              use, and protect your personal information. We encourage you to read it carefully.
            </p>
            <Link
              href="/privacy-policy"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
            >
              Read Privacy Policy
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Security Team */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Security Concerns?</h2>
          <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
            If you have any security concerns or notice any suspicious activity, please contact our security team immediately.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-lg"
          >
            Contact Security Team
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}