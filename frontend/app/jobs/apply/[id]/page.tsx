'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import api from '@/lib/api';
import { format } from 'date-fns';
import {
  FiBriefcase,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiCalendar,
  FiArrowLeft,
  FiUpload,
  FiCheck,
  FiUser,
  FiFileText,
  FiEdit3,
  FiPhone,
  FiChevronDown,
} from 'react-icons/fi';

export default function JobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    countryCode: '+880', // Default to Bangladesh
    coverLetter: '',
    salaryExpectation: '',
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Country codes with flags and patterns for auto-detection
  const countries = [
    { code: '+880', name: 'Bangladesh', flag: '🇧🇩', pattern: /^(\+?880|0)?1[3-9]\d{8}$/ },
    { code: '+91', name: 'India', flag: '🇮🇳', pattern: /^(\+?91|0)?[6-9]\d{9}$/ },
    { code: '+1', name: 'USA/Canada', flag: '🇺🇸', pattern: /^(\+?1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/ },
    { code: '+44', name: 'UK', flag: '🇬🇧', pattern: /^(\+?44|0)?[1-9]\d{8,9}$/ },
    { code: '+92', name: 'Pakistan', flag: '🇵🇰', pattern: /^(\+?92|0)?3\d{9}$/ },
    { code: '+971', name: 'UAE', flag: '🇦🇪', pattern: /^(\+?971|0)?[2-9]\d{8}$/ },
    { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', pattern: /^(\+?966|0)?[1-9]\d{8}$/ },
    { code: '+65', name: 'Singapore', flag: '🇸🇬', pattern: /^(\+?65|0)?[689]\d{7}$/ },
    { code: '+60', name: 'Malaysia', flag: '🇲🇾', pattern: /^(\+?60|0)?[1-9]\d{8,9}$/ },
    { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', pattern: /^(\+?94|0)?[1-9]\d{8}$/ },
    { code: '+86', name: 'China', flag: '🇨🇳', pattern: /^(\+?86|0)?1[3-9]\d{9}$/ },
    { code: '+81', name: 'Japan', flag: '🇯🇵', pattern: /^(\+?81|0)?[789]\d{9}$/ },
    { code: '+82', name: 'South Korea', flag: '🇰🇷', pattern: /^(\+?82|0)?1\d{9}$/ },
    { code: '+61', name: 'Australia', flag: '🇦🇺', pattern: /^(\+?61|0)?4\d{8}$/ },
    { code: '+27', name: 'South Africa', flag: '🇿🇦', pattern: /^(\+?27|0)?[6-9]\d{8}$/ },
  ];

  useEffect(() => {
    if (params.id) {
      fetchJob();
      if (user) {
        setFormData(prev => ({
          ...prev,
          fullName: user.name || '',
          email: user.email || '',
        }));
      }
    }
  }, [params.id, user]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/${params.id}`);
      setJob(response.data.job);
    } catch (error: any) {
      console.error('Error fetching job:', error);
      showNotification('Failed to load job details', 'error');
      router.push('/support/career');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showNotification('Resume file size must be less than 10MB', 'error');
        return;
      }
      setResumeFile(file);
    }
  };

  // Auto-detect country based on phone number
  const detectCountry = (phoneNumber: string) => {
    // Remove spaces and special characters for pattern matching
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check if number starts with a country code
    for (const country of countries) {
      const codeWithoutPlus = country.code.replace('+', '');
      if (cleanNumber.startsWith(codeWithoutPlus)) {
        return country.code;
      }
    }
    
    // Pattern matching for number format
    for (const country of countries) {
      if (country.pattern.test(cleanNumber)) {
        return country.code;
      }
    }
    return formData.countryCode; // Return current if no match
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let phoneValue = e.target.value;
    
    // Remove country code if user types it (we'll add it from dropdown)
    for (const country of countries) {
      const codeWithoutPlus = country.code.replace('+', '');
      if (phoneValue.startsWith(country.code) || phoneValue.startsWith(codeWithoutPlus)) {
        phoneValue = phoneValue.replace(new RegExp(`^\\+?${codeWithoutPlus}`), '');
        break;
      }
    }
    
    // Only allow digits, spaces, hyphens, and parentheses
    phoneValue = phoneValue.replace(/[^\d\s\-\(\)]/g, '');
    
    setFormData({ ...formData, phone: phoneValue });
    
    // Auto-detect country when user types (after 5 digits)
    if (phoneValue.replace(/\D/g, '').length > 5) {
      const detectedCode = detectCountry(phoneValue);
      if (detectedCode !== formData.countryCode) {
        setFormData(prev => ({ ...prev, countryCode: detectedCode }));
      }
    }
  };

  const handleCountrySelect = (countryCode: string) => {
    setFormData({ ...formData, countryCode });
    setShowCountryDropdown(false);
  };

  const getSelectedCountry = () => {
    return countries.find(c => c.code === formData.countryCode) || countries[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone) {
      showNotification('Full Name, Email, and Phone Number are required', 'error');
      return;
    }

    // Combine country code with phone number
    // Remove spaces, hyphens, parentheses and any leading country code
    let cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
    
    // Remove country code if user typed it
    for (const country of countries) {
      const codeWithoutPlus = country.code.replace('+', '');
      if (cleanPhone.startsWith(codeWithoutPlus)) {
        cleanPhone = cleanPhone.substring(codeWithoutPlus.length);
        break;
      }
    }
    
    // Combine with selected country code
    const fullPhoneNumber = formData.countryCode + cleanPhone;

    try {
      setSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append('jobId', params.id as string);
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', fullPhoneNumber);
      formDataToSend.append('coverLetter', formData.coverLetter);
      formDataToSend.append('salaryExpectation', formData.salaryExpectation);
      
      if (resumeFile) {
        formDataToSend.append('resume', resumeFile);
      }

      const response = await api.post('/job-applications', formDataToSend);
      
      if (response.data.success) {
        setSubmitSuccess(true);
        showNotification('Application submitted successfully!', 'success');
      } else {
        throw new Error(response.data.message || 'Failed to submit application');
      }
      
      // Reset form after 3 seconds
      setTimeout(() => {
        router.push('/support/career');
      }, 3000);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      showNotification(
        error.response?.data?.message || 'Failed to submit application',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-8">The job you're looking for doesn't exist.</p>
          <Link
            href="/support/career"
            className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700"
          >
            <FiArrowLeft /> Back to Careers
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      
      {/* Header */}
      <header className="bg-teal-600 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/support/career"
            className="inline-flex items-center gap-2 text-teal-100 hover:text-white mb-4 transition-colors"
          >
            <FiArrowLeft /> Back to Careers
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold">Apply for Position</h1>
          <p className="text-teal-100 mt-2">Submit your application for this exciting opportunity</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Job Details */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-300">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h2>
                  {job.department && (
                    <span className="inline-block px-4 py-2 bg-teal-100 text-teal-600 rounded-full text-sm font-semibold mb-4">
                      {job.department}
                    </span>
                  )}
                </div>
                <FiBriefcase className="text-5xl text-teal-600" />
              </div>

              <div className="space-y-4 mb-6">
                {job.location && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FiMapPin className="text-teal-600 text-xl" />
                    <span className="font-medium">{job.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-700">
                  <FiClock className="text-teal-600 text-xl" />
                  <span className="font-medium capitalize">{job.type?.replace('-', ' ')}</span>
                </div>
                {job.salary && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FiDollarSign className="text-teal-600 text-xl" />
                    <span className="font-medium">{job.salary}</span>
                  </div>
                )}
                {job.applicationDeadline && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FiCalendar className="text-teal-600 text-xl" />
                    <span className="font-medium">
                      Deadline: {format(new Date(job.applicationDeadline), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Job Description</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed mb-6">
                  {job.description}
                </p>

                {job.requirements && (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Requirements</h3>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {job.requirements}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Application Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Form</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiUser className="text-teal-600" /> Personal Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        {/* Country Code Selector */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                            className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-colors min-w-[140px]"
                          >
                            <span className="text-xl">{getSelectedCountry().flag}</span>
                            <span className="text-sm font-medium">{getSelectedCountry().code}</span>
                            <FiChevronDown className="text-gray-500" />
                          </button>
                          
                          {showCountryDropdown && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowCountryDropdown(false)}
                              />
                              <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto w-64">
                                {countries.map((country) => (
                                  <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleCountrySelect(country.code)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-teal-50 transition-colors text-left ${
                                      formData.countryCode === country.code ? 'bg-teal-50' : ''
                                    }`}
                                  >
                                    <span className="text-xl">{country.flag}</span>
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">{country.name}</div>
                                      <div className="text-sm text-gray-500">{country.code}</div>
                                    </div>
                                    {formData.countryCode === country.code && (
                                      <FiCheck className="text-teal-600" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Phone Number Input */}
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          required
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder={
                            formData.countryCode === '+880' ? '1712345678' :
                            formData.countryCode === '+91' ? '9876543210' :
                            formData.countryCode === '+1' ? '(555) 123-4567' :
                            formData.countryCode === '+44' ? '7123456789' :
                            'Enter phone number'
                          }
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Selected: {getSelectedCountry().flag} {getSelectedCountry().name} ({formData.countryCode})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resume Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiFileText className="text-teal-600" /> Resume
                  </h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Resume (PDF, DOC, DOCX - Max 10MB)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeChange}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="block w-full px-6 py-4 bg-teal-50 border-2 border-dashed border-teal-300 rounded-xl hover:bg-teal-100 transition-colors cursor-pointer text-center"
                    >
                      <FiUpload className="text-3xl text-teal-600 mx-auto mb-2" />
                      <span className="text-teal-600 font-semibold">
                        {resumeFile ? resumeFile.name : 'Click to upload resume'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Salary Expectation */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiDollarSign className="text-teal-600" /> Salary Expectation
                  </h3>
                  <input
                    type="text"
                    value={formData.salaryExpectation}
                    onChange={(e) => setFormData({ ...formData, salaryExpectation: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., $50,000 - $70,000 or Negotiable"
                  />
                </div>

                {/* Cover Letter */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiEdit3 className="text-teal-600" /> Cover Letter
                  </h3>
                  <textarea
                    value={formData.coverLetter}
                    onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Write a cover letter explaining why you're interested in this position and how you're a good fit..."
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t-2 border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting || submitSuccess}
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-500 relative overflow-hidden ${
                      submitSuccess
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                        : submitting
                        ? 'bg-teal-400 text-white cursor-not-allowed'
                        : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                    }`}
                  >
                    {/* Background Animation */}
                    {submitting && (
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-teal-500 to-teal-400 opacity-80" style={{
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite',
                      }}></div>
                    )}
                    
                    {/* Content */}
                    <span className={`relative z-10 flex items-center justify-center gap-2 ${
                      submitting ? 'opacity-90' : ''
                    }`}>
                      {submitSuccess ? (
                        <>
                          <div className="relative">
                            <div className="w-6 h-6 border-[3px] border-white rounded-full flex items-center justify-center">
                              <FiCheck className="text-white text-lg" style={{
                                animation: 'scaleIn 0.3s ease-out',
                              }} />
                            </div>
                            <div className="absolute inset-0 border-[3px] border-white rounded-full opacity-0" style={{
                              animation: 'ping 0.6s ease-out',
                            }}></div>
                          </div>
                          <span style={{
                            animation: 'fadeIn 0.3s ease-out',
                          }}>Application Submitted Successfully!</span>
                        </>
                      ) : submitting ? (
                        <>
                          <div className="relative w-6 h-6">
                            <div className="absolute inset-0 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-1 border-2 border-white border-b-transparent rounded-full" style={{
                              animation: 'spin-reverse 1s linear infinite',
                            }}></div>
                          </div>
                          <span>Submitting Application...</span>
                        </>
                      ) : (
                        <>
                          <FiCheck className="text-xl" />
                          Submit Application
                        </>
                      )}
                    </span>
                    
                    {/* Success Confetti Effect */}
                    {submitSuccess && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(30)].map((_, i) => {
                          const angle = (i * 12) * (Math.PI / 180);
                          const distance = 50 + Math.random() * 30;
                          return (
                            <div
                              key={i}
                              className="absolute w-2 h-2 bg-white rounded-full"
                              style={{
                                left: '50%',
                                top: '50%',
                                transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
                                animation: `confetti 1s ease-out forwards`,
                                animationDelay: `${i * 0.02}s`,
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </button>
                  
                  {submitSuccess && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center gap-2 text-green-600 font-semibold animate-pulse">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="ml-2">Redirecting to careers page...</span>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

