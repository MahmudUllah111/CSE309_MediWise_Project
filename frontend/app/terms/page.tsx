'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { FiFileText, FiAlertCircle } from 'react-icons/fi';

export default function TermsPage() {
  const sections = [
    {
      title: 'Acceptance of Terms',
      content: [
        'By accessing and using MediWise, you accept and agree to be bound by these Terms and Conditions.',
        'If you do not agree to these terms, you must not use our services.',
        'We reserve the right to modify these terms at any time, and such modifications will be effective immediately.'
      ]
    },
    {
      title: 'Use of Services',
      content: [
        'You must be at least 18 years old to use our services, or have parental consent if under 18.',
        'You agree to provide accurate and complete information when using our platform.',
        'You are responsible for maintaining the confidentiality of your account credentials.',
        'You agree not to use our services for any unlawful purpose or in any way that could damage our platform.'
      ]
    },
    {
      title: 'Medical Services Disclaimer',
      content: [
        'MediWise is a platform that connects patients with healthcare providers. We do not provide medical advice.',
        'The information on our platform is for informational purposes only and should not replace professional medical advice.',
        'Always consult with qualified healthcare professionals for medical diagnosis and treatment.',
        'We are not liable for any medical decisions made based on information from our platform.'
      ]
    },
    {
      title: 'User Accounts',
      content: [
        'You are responsible for all activities that occur under your account.',
        'You must notify us immediately of any unauthorized use of your account.',
        'We reserve the right to suspend or terminate accounts that violate these terms.',
        'You may not share your account credentials with others.'
      ]
    },
    {
      title: 'Intellectual Property',
      content: [
        'All content on MediWise, including text, graphics, logos, and software, is our property or licensed to us.',
        'You may not reproduce, distribute, or create derivative works without our permission.',
        'You retain ownership of any content you submit, but grant us a license to use it on our platform.'
      ]
    },
    {
      title: 'Payment Terms',
      content: [
        'Payment for services must be made according to the pricing terms specified.',
        'All fees are non-refundable unless otherwise stated.',
        'We reserve the right to change our pricing with notice.',
        'You are responsible for any applicable taxes.'
      ]
    },
    {
      title: 'Limitation of Liability',
      content: [
        'MediWise is provided "as is" without warranties of any kind.',
        'We are not liable for any indirect, incidental, or consequential damages.',
        'Our total liability is limited to the amount you paid for our services.',
        'We are not responsible for the actions of third-party healthcare providers.'
      ]
    },
    {
      title: 'Termination',
      content: [
        'We may terminate or suspend your access to our services at any time, with or without cause.',
        'You may terminate your account at any time by contacting us.',
        'Upon termination, your right to use our services will immediately cease.',
        'Provisions that should survive termination will remain in effect.'
      ]
    },
    {
      title: 'Governing Law',
      content: [
        'These terms are governed by the laws of Bangladesh.',
        'Any disputes will be resolved through arbitration in Dhaka, Bangladesh.',
        'You agree to submit to the jurisdiction of courts in Bangladesh.'
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
              <FiFileText className="text-5xl" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Terms & Conditions</h1>
              <p className="text-xl text-teal-100 max-w-2xl">
                Last updated: January 2024. Please read these terms carefully before using our services.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Terms Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 p-6 bg-yellow-50 rounded-2xl border-l-4 border-yellow-500">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="text-yellow-600 text-2xl flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-700 leading-relaxed font-semibold mb-2">Important Notice</p>
                  <p className="text-gray-700 leading-relaxed">
                    By using MediWise, you agree to these Terms and Conditions. Please read them carefully. 
                    If you have any questions, contact us before using our services.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              {sections.map((section, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                    {index + 1}. {section.title}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About These Terms?</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Email:</strong> legal@mediwise.com</li>
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


import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { FiFileText, FiAlertCircle } from 'react-icons/fi';

export default function TermsPage() {
  const sections = [
    {
      title: 'Acceptance of Terms',
      content: [
        'By accessing and using MediWise, you accept and agree to be bound by these Terms and Conditions.',
        'If you do not agree to these terms, you must not use our services.',
        'We reserve the right to modify these terms at any time, and such modifications will be effective immediately.'
      ]
    },
    {
      title: 'Use of Services',
      content: [
        'You must be at least 18 years old to use our services, or have parental consent if under 18.',
        'You agree to provide accurate and complete information when using our platform.',
        'You are responsible for maintaining the confidentiality of your account credentials.',
        'You agree not to use our services for any unlawful purpose or in any way that could damage our platform.'
      ]
    },
    {
      title: 'Medical Services Disclaimer',
      content: [
        'MediWise is a platform that connects patients with healthcare providers. We do not provide medical advice.',
        'The information on our platform is for informational purposes only and should not replace professional medical advice.',
        'Always consult with qualified healthcare professionals for medical diagnosis and treatment.',
        'We are not liable for any medical decisions made based on information from our platform.'
      ]
    },
    {
      title: 'User Accounts',
      content: [
        'You are responsible for all activities that occur under your account.',
        'You must notify us immediately of any unauthorized use of your account.',
        'We reserve the right to suspend or terminate accounts that violate these terms.',
        'You may not share your account credentials with others.'
      ]
    },
    {
      title: 'Intellectual Property',
      content: [
        'All content on MediWise, including text, graphics, logos, and software, is our property or licensed to us.',
        'You may not reproduce, distribute, or create derivative works without our permission.',
        'You retain ownership of any content you submit, but grant us a license to use it on our platform.'
      ]
    },
    {
      title: 'Payment Terms',
      content: [
        'Payment for services must be made according to the pricing terms specified.',
        'All fees are non-refundable unless otherwise stated.',
        'We reserve the right to change our pricing with notice.',
        'You are responsible for any applicable taxes.'
      ]
    },
    {
      title: 'Limitation of Liability',
      content: [
        'MediWise is provided "as is" without warranties of any kind.',
        'We are not liable for any indirect, incidental, or consequential damages.',
        'Our total liability is limited to the amount you paid for our services.',
        'We are not responsible for the actions of third-party healthcare providers.'
      ]
    },
    {
      title: 'Termination',
      content: [
        'We may terminate or suspend your access to our services at any time, with or without cause.',
        'You may terminate your account at any time by contacting us.',
        'Upon termination, your right to use our services will immediately cease.',
        'Provisions that should survive termination will remain in effect.'
      ]
    },
    {
      title: 'Governing Law',
      content: [
        'These terms are governed by the laws of Bangladesh.',
        'Any disputes will be resolved through arbitration in Dhaka, Bangladesh.',
        'You agree to submit to the jurisdiction of courts in Bangladesh.'
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
              <FiFileText className="text-5xl" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Terms & Conditions</h1>
              <p className="text-xl text-teal-100 max-w-2xl">
                Last updated: January 2024. Please read these terms carefully before using our services.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Terms Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 p-6 bg-yellow-50 rounded-2xl border-l-4 border-yellow-500">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="text-yellow-600 text-2xl flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-700 leading-relaxed font-semibold mb-2">Important Notice</p>
                  <p className="text-gray-700 leading-relaxed">
                    By using MediWise, you agree to these Terms and Conditions. Please read them carefully. 
                    If you have any questions, contact us before using our services.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              {sections.map((section, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                    {index + 1}. {section.title}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About These Terms?</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Email:</strong> legal@mediwise.com</li>
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

