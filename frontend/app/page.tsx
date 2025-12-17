'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  FiMenu, 
  FiX, 
  FiSearch, 
  FiCalendar, 
  FiUser, 
  FiArrowRight,
  FiCheck,
  FiStar,
  FiMail,
  FiPhone,
  FiMapPin,
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiChevronLeft,
  FiChevronRight,
  FiPlay
} from 'react-icons/fi';
import { FiClipboard, FiActivity, FiMonitor, FiHeart, FiShield, FiAward } from 'react-icons/fi';
import Image from 'next/image';
import api from '@/lib/api';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [email, setEmail] = useState('');
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  // Don't auto-redirect - let users see the landing page
  // They can navigate to login/dashboard from here

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await api.get('/blogs', { params: { limit: 3 } });
      setBlogPosts(response.data.blogs || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setBlogPosts([]);
    } finally {
      setLoadingBlogs(false);
    }
  };

  const services = [
    {
      icon: <FiClipboard className="text-5xl" />,
      title: 'Diagnosis',
      description: 'Comprehensive medical diagnosis with advanced technology and expert doctors.',
      highlighted: false
    },
    {
      icon: <FiActivity className="text-5xl" />,
      title: 'Consultancy',
      description: 'Expert medical consultation from experienced healthcare professionals.',
      highlighted: true
    },
    {
      icon: <FiMonitor className="text-5xl" />,
      title: 'Tracking',
      description: 'Track your health records and appointments all in one place.',
      highlighted: false
    }
  ];

  const doctors = [
    { name: 'Dr. Christopher Doe', specialization: 'Heart Specialist', image: '/images/doctors/doctor-1.jpg' },
    { name: 'Dr. Mark Wane', specialization: 'Heart Doctor', image: '/images/doctors/doctor-2.jpg', highlighted: true },
    { name: 'Dr. Sarah Smith', specialization: 'Pediatrician', image: '/images/doctors/doctor-3.jpg' },
    { name: 'Dr. John Brown', specialization: 'Neurologist', image: '/images/doctors/doctor-4.jpg' }
  ];

  const pricingPlans = [
    {
      icon: '🎯',
      name: 'Standard',
      price: '$29',
      period: '/Month',
      features: ['24/7 Full General Service', '2 Clinic Hours', '2 Doctor Hours', '1 Book Appointment', '1 Orthopedic Deal'],
      highlighted: false
    },
    {
      icon: '👑',
      name: 'Pro Business',
      price: '$49',
      period: '/Month',
      features: ['24/7 Full General Service', '4 Clinic Hours', '4 Doctor Hours', '3 Book Appointment', '2 Orthopedic Deal'],
      highlighted: true
    },
    {
      icon: '🏆',
      name: 'Enterprise',
      price: '$99',
      period: '/Month',
      features: ['24/7 Full General Service', 'Unlimited Clinic Hours', 'Unlimited Doctor Hours', 'Unlimited Book Appointment', '5 Orthopedic Deal'],
      highlighted: false
    }
  ];

  const faqs = [
    {
      question: 'How to make an appointment at MediWise?',
      answer: 'You can easily book an appointment through our online platform. Simply select your preferred doctor, choose a date and time, and confirm your booking.'
    },
    {
      question: 'What services does MediWise provide?',
      answer: 'MediWise provides comprehensive healthcare services including diagnosis, consultation, health tracking, prescription management, and more.'
    },
    {
      question: 'How can I contact MediWise?',
      answer: 'You can contact us through our website, email, or phone. Our support team is available 24/7 to assist you.'
    },
    {
      question: 'Is my medical information secure?',
      answer: 'Yes, we use advanced encryption and security measures to protect all your medical information and ensure complete privacy.'
    }
  ];

  const testimonials = [
    {
      text: 'MediWise has transformed how I manage my health. The platform is easy to use and the doctors are highly professional.',
      name: 'Christopher Doe',
      role: 'Happy Patient',
      rating: 5,
      image: '/images/testimonials/patient-1.jpg'
    },
    {
      text: 'Excellent service! I can book appointments easily and track my medical records all in one place.',
      name: 'Jane Smith',
      role: 'Happy Patient',
      rating: 5,
      image: '/images/testimonials/patient-2.jpg'
    },
    {
      text: 'The best healthcare platform I have used. Highly recommend MediWise to everyone.',
      name: 'Michael Johnson',
      role: 'Happy Patient',
      rating: 5,
      image: '/images/testimonials/patient-3.jpg'
    }
  ];


  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    alert('Thank you for subscribing!');
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="MediWise Logo" className="w-10 h-10 object-contain" onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }} />
              <span className="text-2xl font-bold text-teal-600">MediWise</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <Link href="#home" className="text-gray-700 hover:text-teal-600 transition-colors">Home</Link>
              <Link href="/about" className="text-gray-700 hover:text-teal-600 transition-colors">About Us</Link>
              <Link href="/departments" className="text-gray-700 hover:text-teal-600 transition-colors">Department</Link>
              <Link href="/doctors" className="text-gray-700 hover:text-teal-600 transition-colors">Doctors</Link>
              <Link href="/blog" className="text-gray-700 hover:text-teal-600 transition-colors">Blog</Link>
              <Link href="/contact" className="text-gray-700 hover:text-teal-600 transition-colors">Contact Us</Link>
            </div>

            {/* Action Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <>
                  <Link 
                    href={user.role === 'admin' ? '/admin/dashboard' : user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} 
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link href="/register" className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                    Appointment
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                    Login
                  </Link>
                  <Link href="/register" className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                    Appointment
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700"
            >
              {mobileMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t">
              <div className="flex flex-col gap-4">
                <Link href="/" className="text-gray-700 hover:text-teal-600">Home</Link>
                <Link href="/about" className="text-gray-700 hover:text-teal-600">About Us</Link>
                <Link href="/departments" className="text-gray-700 hover:text-teal-600">Department</Link>
                <Link href="/doctors" className="text-gray-700 hover:text-teal-600">Doctors</Link>
                <Link href="/blog" className="text-gray-700 hover:text-teal-600">Blog</Link>
                <Link href="/contact" className="text-gray-700 hover:text-teal-600">Contact Us</Link>
                <div className="flex gap-4 pt-4">
                  {user ? (
                    <>
                      <Link 
                        href={user.role === 'admin' ? '/admin/dashboard' : user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} 
                        className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg text-center"
                      >
                        Dashboard
                      </Link>
                      <Link href="/register" className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg text-center">
                        Appointment
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg text-center">
                        Login
                      </Link>
                      <Link href="/register" className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg text-center">
                        Appointment
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              We Care About Your <span className="text-teal-600">Health</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              We implement safety protocols and have good doctors for all your health problems. 
              Get the best medical care with MediWise - your trusted healthcare partner.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                Get Started <FiArrowRight />
              </Link>
              <button className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors text-lg font-semibold">
                <FiPlay /> Watch Video
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl group">
              <img 
                src="/images/hero-doctor.jpg" 
                alt="Professional Doctor" 
                className="w-full h-[500px] object-cover transition-transform duration-500 group-hover:scale-110"
                loading="eager"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23e0f2f1" width="800" height="600"/%3E%3Ctext x="50%25" y="50%25" font-size="48" text-anchor="middle" fill="%23006666"%3E🩺 Doctor%3C/text%3E%3C/svg%3E';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-teal-100 rounded-full opacity-50 blur-3xl -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-teal-200 rounded-full opacity-50 blur-3xl -z-10"></div>
          </div>
        </div>
      </section>

      {/* Search/Appointment Bar */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-12 mb-20">
        <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 border border-gray-100">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-teal-600 transition-colors bg-gray-50">
              <FiCalendar className="text-teal-600 text-xl flex-shrink-0" />
              <input type="date" className="flex-1 outline-none text-gray-700 bg-transparent" />
            </div>
            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-teal-600 transition-colors bg-gray-50">
              <FiActivity className="text-teal-600 text-xl flex-shrink-0" />
              <select 
                id="department-select"
                className="flex-1 outline-none text-gray-700 bg-transparent cursor-pointer"
                onChange={(e) => {
                  const deptId = e.target.value;
                  if (deptId) {
                    router.push(`/doctors?department=${deptId}`);
                  }
                }}
              >
                <option value="">Department</option>
                <option value="1">Cardiology</option>
                <option value="2">Neurology</option>
                <option value="3">Orthopedics</option>
                <option value="4">Pediatrics</option>
                <option value="5">Dermatology</option>
              </select>
            </div>
            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-teal-600 transition-colors bg-gray-50">
              <FiUser className="text-teal-600 text-xl flex-shrink-0" />
              <select className="flex-1 outline-none text-gray-700 bg-transparent">
                <option>Doctor</option>
              </select>
            </div>
          </div>
          <button 
            onClick={() => {
              const deptSelect = document.getElementById('department-select') as HTMLSelectElement;
              const deptId = deptSelect?.value;
              if (deptId) {
                router.push(`/doctors?department=${deptId}`);
              } else {
                router.push('/doctors');
              }
            }}
            className="w-full sm:w-auto sm:ml-auto sm:block px-8 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            <FiSearch /> Search
          </button>
        </div>
      </section>

      {/* Services Section */}
      <section id="departments" className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-teal-600 text-sm font-semibold uppercase tracking-wider mb-2">OUR SERVICES</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Best Medical Services Makes You Happy
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We provide comprehensive healthcare services to ensure your well-being and happiness. 
            Our expert team is dedicated to delivering the best medical care.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className={`p-8 rounded-2xl transition-all hover:shadow-xl hover:scale-105 ${
                service.highlighted
                  ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-2xl'
                  : 'bg-white text-gray-900 shadow-lg border border-gray-100'
              }`}
            >
              <div className={`mb-6 ${service.highlighted ? 'text-white' : 'text-teal-600'}`}>
                {service.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
              <p className={service.highlighted ? 'text-teal-50' : 'text-gray-600'}>
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="bg-gradient-to-br from-gray-50 to-teal-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-teal-600 text-sm font-semibold uppercase tracking-wider mb-2">ABOUT US</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Find The Right Doctor Right At Your Fingertips
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                MediWise connects you with the best healthcare professionals. Our platform makes it easy 
                to find, book, and manage your medical appointments all in one place.
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-4xl font-bold text-teal-600 mb-2">10+</div>
                  <div className="text-gray-600 text-sm">Years of Experience</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-4xl font-bold text-teal-600 mb-2">100+</div>
                  <div className="text-gray-600 text-sm">Happy Clients</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-md">
                  <div className="text-4xl font-bold text-teal-600 mb-2">5k+</div>
                  <div className="text-gray-600 text-sm">Success Stories</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl group">
                <img 
                  src="/images/about-doctor.jpg" 
                  alt="Medical Professional" 
                  className="w-full h-[400px] object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400"%3E%3Crect fill="%23e0f2f1" width="600" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="36" text-anchor="middle" fill="%23006666"%3E👨‍⚕️ Doctor%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-teal-600 rounded-full opacity-20 blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl group">
              <img 
                src="/images/welcome-doctor.jpg" 
                alt="Welcoming Doctor" 
                className="w-full h-[450px] object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="450"%3E%3Crect fill="%23e0f2f1" width="600" height="450"/%3E%3Ctext x="50%25" y="50%25" font-size="36" text-anchor="middle" fill="%23006666"%3E👨‍⚕️ Welcome%3C/text%3E%3C/svg%3E';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-teal-200 rounded-full opacity-30 blur-xl"></div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-teal-600 text-sm font-semibold uppercase tracking-wider mb-2">WHY CHOOSE US</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              A Warm Welcome and a Beautiful Experience
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              We provide state-of-the-art facilities and safety measures to ensure the best healthcare experience. 
              Our team is committed to your well-being.
            </p>
            <div className="space-y-4 mb-8">
              {['24/7 Full Medical Services', 'Various Specialized Services', 'Emergency Care Available', 'Online Consultation Available'].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiCheck className="text-white text-sm" />
                  </div>
                  <span className="text-gray-700 text-lg">{item}</span>
                </div>
              ))}
            </div>
            <Link 
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold shadow-lg"
            >
              Get Started <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Doctors Team Section */}
      <section id="doctors" className="bg-gradient-to-br from-teal-50 to-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-teal-600 text-sm font-semibold uppercase tracking-wider mb-2">FOR MEDI WISE</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Our Specialist Doctors Team
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Meet our team of experienced and dedicated healthcare professionals committed to your health and well-being.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doctor, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl transition-all hover:shadow-xl hover:scale-105 group ${
                  doctor.highlighted
                    ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-2xl'
                    : 'bg-white text-gray-900 shadow-lg border border-gray-100'
                }`}
              >
                <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <img 
                    src={doctor.image} 
                    alt={doctor.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect fill="%23e0f2f1" width="128" height="128"/%3E%3Ctext x="50%25" y="50%25" font-size="48" text-anchor="middle" fill="%23006666"%3E👤%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">{doctor.name}</h3>
                <p className={`text-center ${doctor.highlighted ? 'text-teal-100' : 'text-gray-600'}`}>
                  {doctor.specialization}
                </p>
                <Link 
                  href="/doctors"
                  className={`mt-4 flex items-center justify-center gap-2 ${
                    doctor.highlighted ? 'text-white' : 'text-teal-600'
                  } hover:underline font-semibold`}
                >
                  Read More <FiArrowRight />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-teal-600 text-sm font-semibold uppercase tracking-wider mb-2">PRICING</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Our Pricing Best Plans
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the plan that best fits your healthcare needs. All plans include access to our expert medical team.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`p-8 rounded-2xl transition-all hover:shadow-xl ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-2xl scale-105 border-4 border-teal-500'
                  : 'bg-white text-gray-900 shadow-lg border border-gray-100'
              }`}
            >
              <div className="text-6xl mb-6 text-center">{plan.icon}</div>
              <h3 className="text-2xl font-bold text-center mb-2">{plan.name}</h3>
              <div className="text-center mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={plan.highlighted ? 'text-teal-100' : 'text-gray-600'}>{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-3">
                    <FiCheck className={plan.highlighted ? 'text-white' : 'text-teal-600'} />
                    <span className={plan.highlighted ? 'text-teal-50' : 'text-gray-700'}>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.highlighted
                    ? 'bg-white text-teal-600 hover:bg-teal-50'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
                }`}
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gradient-to-br from-gray-50 to-teal-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <p className="text-teal-600 text-sm font-semibold uppercase tracking-wider mb-2">INFO ABOUT</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600 mb-8">
                Find answers to common questions about MediWise and our services.
              </p>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                <img 
                  src="/images/faq-team.jpg" 
                  alt="Medical Team" 
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400"%3E%3Crect fill="%23e0f2f1" width="600" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="36" text-anchor="middle" fill="%23006666"%3E👥 Team%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100"
                >
                  <button
                    onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                    <FiArrowRight
                      className={`text-teal-600 transition-transform flex-shrink-0 ${
                        faqOpen === index ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                  {faqOpen === index && (
                    <div className="px-6 pb-6 text-gray-600 leading-relaxed">{faq.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-teal-600 text-sm font-semibold uppercase tracking-wider mb-2">TESTIMONIALS</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Our Special Patients Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Read what our patients have to say about their experience with MediWise.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="text-teal-600 text-4xl mb-4">"</div>
              <p className="text-gray-600 mb-6 leading-relaxed">{testimonial.text}</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-teal-100 flex-shrink-0 shadow-md">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23e0f2f1" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" font-size="32" text-anchor="middle" fill="%23006666"%3E👤%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="flex gap-1 mt-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FiStar key={i} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="bg-gradient-to-br from-teal-50 to-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-teal-600 text-sm font-semibold uppercase tracking-wider mb-2">LATEST NEWS</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Updated Blog & News
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Stay updated with the latest healthcare news, tips, and insights from our medical experts.
            </p>
          </div>

          {loadingBlogs ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading blogs...</p>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No blogs available yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.id}`} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-100">
                  <div className="relative h-48 overflow-hidden group">
                    {post.image ? (
                      <img 
                        src={post.image.startsWith('http') ? post.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${post.image}`}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect fill="%23e0f2f1" width="400" height="250"/%3E%3Ctext x="50%25" y="50%25" font-size="24" text-anchor="middle" fill="%23006666"%3E📰 Blog%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-6xl">
                        📰
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 left-4 bg-teal-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                      {post.views || 0} Views • {post.comments || 0} Comments
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{post.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt || post.content?.substring(0, 150) + '...'}</p>
                    <span className="text-teal-600 font-semibold flex items-center gap-2 hover:underline">
                      Read More <FiArrowRight />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl p-8 lg:p-12 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="text-center lg:text-left">
              <div className="text-6xl mb-4">💚</div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Subscribe Our Newsletter
              </h2>
              <p className="text-teal-100 text-lg">
                Subscribe to our newsletter and never miss our offers and health tips.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email here"
                className="flex-1 px-6 py-4 rounded-lg outline-none text-gray-900 shadow-lg"
                required
              />
              <button
                type="submit"
                className="px-8 py-4 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-semibold shadow-lg"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-teal-900 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Logo and Description */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="MediWise Logo" className="w-10 h-10 object-contain" onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }} />
                <span className="text-2xl font-bold">MediWise</span>
              </div>
              <p className="text-teal-200 mb-6">
                Your trusted healthcare partner. We provide comprehensive medical services 
                to ensure your well-being and happiness.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-teal-800 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors">
                  <FiFacebook />
                </a>
                <a href="#" className="w-10 h-10 bg-teal-800 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors">
                  <FiTwitter />
                </a>
                <a href="#" className="w-10 h-10 bg-teal-800 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors">
                  <FiInstagram />
                </a>
                <a href="#" className="w-10 h-10 bg-teal-800 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors">
                  <FiLinkedin />
          </a>
        </div>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-xl font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-teal-200">
                <li><Link href="/support/teams" className="hover:text-white transition-colors">Teams</Link></li>
                <li><Link href="/support/career" className="hover:text-white transition-colors">Career</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/support/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>

            {/* Products */}
            <div>
              <h3 className="text-xl font-bold mb-4">Products</h3>
              <ul className="space-y-2 text-teal-200">
                <li><Link href="/products/clinical-board" className="hover:text-white transition-colors">Clinical Board</Link></li>
                <li><Link href="/products/events" className="hover:text-white transition-colors">Events</Link></li>
                <li><Link href="/products/service" className="hover:text-white transition-colors">Service</Link></li>
              </ul>
            </div>

            {/* Contact Us */}
            <div>
              <h3 className="text-xl font-bold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-teal-200">
                <li className="flex items-center gap-3">
                  <FiPhone className="text-teal-400" />
                  <span>+880 1234 567890</span>
                </li>
                <li className="flex items-center gap-3">
                  <FiMail className="text-teal-400" />
                  <span>info@mediwise.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiMapPin className="text-teal-400 mt-1" />
                  <span>123 Medical Street, Healthcare City, BD</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-teal-800 pt-8 mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-teal-200">
              <p>© 2024 MediWise. All rights reserved.</p>
              <div className="flex gap-6">
                <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms & Condition</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
