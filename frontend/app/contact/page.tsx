'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { FiMail, FiPhone, FiMapPin, FiSend, FiClock, FiMessageCircle } from 'react-icons/fi';
import { useNotification } from '@/context/NotificationContext';

export default function ContactUsPage() {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    showNotification('Thank you for your message! We will get back to you soon.', 'success');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactInfo = [
    {
      icon: <FiPhone className="text-3xl" />,
      title: 'Phone',
      details: ['+880 1234 567890', '+880 9876 543210'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <FiMail className="text-3xl" />,
      title: 'Email',
      details: ['info@mediwise.com', 'support@mediwise.com'],
      color: 'from-teal-500 to-teal-600'
    },
    {
      icon: <FiMapPin className="text-3xl" />,
      title: 'Address',
      details: ['123 Medical Street', 'Healthcare City, Dhaka', 'Bangladesh'],
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <FiClock className="text-3xl" />,
      title: 'Working Hours',
      details: ['Monday - Friday: 9:00 AM - 6:00 PM', 'Saturday: 9:00 AM - 2:00 PM', 'Sunday: Closed'],
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader activePage="contact" />
      {/* Page Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              We're here to help! Get in touch with us for any questions, concerns, or support you may need.
            </p>
          </div>
        </div>
      </header>

      {/* Contact Info Cards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${info.color} rounded-full flex items-center justify-center text-white mb-4`}>
                  {info.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{info.title}</h3>
                <ul className="space-y-1">
                  {info.details.map((detail, i) => (
                    <li key={i} className="text-gray-600">{detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form and Map */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600 outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600 outline-none"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-gray-700 font-semibold mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600 outline-none"
                    placeholder="+880 1234 567890"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-gray-700 font-semibold mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600 outline-none"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="appointment">Appointment Booking</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600 outline-none resize-none"
                    placeholder="Your message here..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <FiSend /> Send Message
                </button>
              </form>
            </div>

            {/* Map/Additional Info */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Visit Our Office</h2>
              <div className="bg-gray-100 rounded-2xl h-96 mb-6 flex items-center justify-center">
                <div className="text-center">
                  <FiMapPin className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Map integration can be added here</p>
                  <p className="text-gray-500 text-sm mt-2">123 Medical Street, Healthcare City, Dhaka, Bangladesh</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiMessageCircle className="text-teal-600" />
                  Quick Response
                </h3>
                <p className="text-gray-700 mb-4">
                  We typically respond to all inquiries within 24 hours during business days. 
                  For urgent matters, please call us directly.
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                    Emergency support available 24/7
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                    Online consultation available
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                    Multilingual support team
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}