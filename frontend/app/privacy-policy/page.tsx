'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { FiShield, FiLock, FiEye } from 'react-icons/fi';

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: 'Information We Collect',
      content: [
        'Personal Information: Name, email address, phone number, date of birth, and other identifying information.',
        'Medical Information: Medical history, prescriptions, appointment records, and health-related data.',
        'Usage Data: Information about how you use our platform, including pages visited and features used.',
        'Device Information: IP address, browser type, device identifiers, and operating system.'
      ]
    },
    {
      title: 'How We Use Your Information',
      content: [
        'To provide and improve our healthcare services.',
        'To process appointments and manage your medical records.',
        'To communicate with you about your health and our services.',
        'To ensure platform security and prevent fraud.',
        'To comply with legal obligations and healthcare regulations.'
      ]
    },
    {
      title: 'Data Security',
      content: [
        'We use industry-standard encryption to protect your data.',
        'Access to your information is restricted to authorized personnel only.',
        'Regular security audits and updates are performed.',
        'We comply with HIPAA, GDPR, and other relevant data protection regulations.'
      ]
    },
    {
      title: 'Data Sharing',
      content: [
        'We do not sell your personal or medical information.',
        'We may share information with healthcare providers involved in your care.',
        'Information may be shared with service providers who assist in platform operations.',
        'We may disclose information if required by law or to protect rights and safety.'
      ]
    },
    {
      title: 'Your Rights',
      content: [
        'Right to access your personal and medical information.',
        'Right to correct inaccurate information.',
        'Right to request deletion of your data (subject to legal requirements).',
        'Right to object to certain processing activities.',
        'Right to data portability.'
      ]
    },
    {
      title: 'Cookies and Tracking',
      content: [
        'We use cookies to enhance your experience and analyze platform usage.',
        'You can control cookie preferences through your browser settings.',
        'Some features may not function properly if cookies are disabled.'
      ]
    },
    {
      title: 'Children\'s Privacy',
      content: [
        'Our services are not intended for children under 13 years of age.',
        'We do not knowingly collect information from children under 13.',
        'If you believe we have collected information from a child, please contact us immediately.'
      ]
    },
    {
      title: 'Changes to This Policy',
      content: [
        'We may update this privacy policy from time to time.',
        'Significant changes will be communicated through our platform or email.',
        'Continued use of our services after changes constitutes acceptance of the updated policy.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      {/* Page Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <FiShield className="text-5xl" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-xl text-teal-100 max-w-2xl">
                Last updated: January 2024. Learn how we collect, use, and protect your information.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Policy Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 p-6 bg-teal-50 rounded-2xl border-l-4 border-teal-600">
              <p className="text-gray-700 leading-relaxed">
                At MediWise, we are committed to protecting your privacy and ensuring the security of your personal 
                and medical information. This Privacy Policy explains how we collect, use, disclose, and safeguard 
                your information when you use our platform.
              </p>
            </div>

            <div className="space-y-12">
              {sections.map((section, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    {index === 0 && <FiLock className="text-teal-600" />}
                    {index === 2 && <FiShield className="text-teal-600" />}
                    {index === 4 && <FiEye className="text-teal-600" />}
                    {section.title}
                  </h2>
                  <ul className="space-y-3">
                    {section.content.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700 leading-relaxed">
                        <span className="text-teal-600 mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Contact Section */}
            <div className="mt-12 p-8 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Email:</strong> privacy@mediwise.com</li>
                <li><strong>Phone:</strong> +880 1234 567890</li>
                <li><strong>Address:</strong> 123 Medical Street, Healthcare City, Dhaka, Bangladesh</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}