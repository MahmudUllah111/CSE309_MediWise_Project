'use client';

import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { FiCheck, FiUsers, FiAward, FiHeart, FiTarget, FiShield } from 'react-icons/fi';

export default function AboutUsPage() {
  const stats = [
    { number: '10+', label: 'Years of Experience', icon: <FiAward className="text-4xl" /> },
    { number: '100+', label: 'Happy Clients', icon: <FiUsers className="text-4xl" /> },
    { number: '5k+', label: 'Success Stories', icon: <FiHeart className="text-4xl" /> },
    { number: '50+', label: 'Expert Doctors', icon: <FiTarget className="text-4xl" /> }
  ];

  const values = [
    {
      icon: <FiHeart className="text-5xl" />,
      title: 'Patient Care First',
      description: 'We prioritize patient well-being above all else, ensuring compassionate and personalized healthcare.'
    },
    {
      icon: <FiShield className="text-5xl" />,
      title: 'Trust & Safety',
      description: 'Your health data is protected with advanced security measures and strict privacy protocols.'
    },
    {
      icon: <FiAward className="text-5xl" />,
      title: 'Excellence',
      description: 'We maintain the highest standards of medical care through continuous improvement and innovation.'
    },
    {
      icon: <FiTarget className="text-5xl" />,
      title: 'Innovation',
      description: 'We leverage cutting-edge technology to provide the best healthcare solutions.'
    }
  ];

  const milestones = [
    { year: '2014', title: 'Founded', description: 'MediWise was established with a vision to revolutionize healthcare.' },
    { year: '2016', title: '1000 Patients', description: 'Reached our first milestone of serving 1000 patients.' },
    { year: '2018', title: 'Digital Platform', description: 'Launched our comprehensive digital healthcare platform.' },
    { year: '2020', title: 'National Recognition', description: 'Recognized as a leading healthcare service provider.' },
    { year: '2024', title: '5k+ Success Stories', description: 'Celebrated over 5000 successful patient outcomes.' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader activePage="about" />
      {/* Page Header */}
      <header className="bg-teal-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">About MediWise</h1>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              Your trusted healthcare partner, committed to providing exceptional medical care and innovative health solutions.
            </p>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-2xl shadow-lg">
                <div className="text-teal-600 mb-4 flex justify-center">{stat.icon}</div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-2xl">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To make quality healthcare accessible to everyone through innovative technology and compassionate care. 
                We strive to connect patients with the best medical professionals and provide comprehensive health solutions.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our mission is to transform healthcare delivery by leveraging digital innovation while maintaining 
                the human touch that makes medical care truly effective.
              </p>
            </div>
            <div className="bg-gradient-to-br from-teal-100 to-teal-200 p-8 rounded-2xl">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To become the leading digital healthcare platform that empowers individuals to take control of their health. 
                We envision a future where quality medical care is just a click away.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We aim to create a healthcare ecosystem that is patient-centric, technology-driven, and accessible to all, 
                regardless of location or background.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do at MediWise
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-lg text-center">
                <div className="text-teal-600 mb-4 flex justify-center">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Our Story</h2>
              <p className="text-gray-600">
                A journey of growth, innovation, and dedication to healthcare excellence
              </p>
            </div>
            <div className="space-y-8">
              <p className="text-lg text-gray-700 leading-relaxed">
                MediWise was founded in 2014 with a simple yet powerful vision: to make quality healthcare 
                accessible to everyone. What started as a small initiative has grown into a comprehensive 
                digital healthcare platform serving thousands of patients.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Over the years, we have continuously evolved, adopting new technologies and expanding our 
                services to meet the changing needs of our patients. Our commitment to excellence and 
                patient-centered care has earned us the trust of thousands of families.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Today, MediWise stands as a testament to what is possible when technology meets compassion. 
                We are proud of our journey and excited about the future of healthcare.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-gray-600">Key milestones in our growth</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {milestone.year}
                    </div>
                  </div>
                  <div className="flex-1 bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Join Us on Our Mission
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Experience the future of healthcare with MediWise. Get started today and take control of your health.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-semibold text-lg"
            >
              Get Started
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-teal-600 transition-colors font-semibold text-lg"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}

