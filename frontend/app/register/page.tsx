'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiEye, FiEyeOff, FiChevronDown, FiVideo, FiUser } from 'react-icons/fi';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient' as 'patient' | 'doctor' | 'admin',
    phone: '',
    address: '',
    dateOfBirth: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('English (EN)');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, dateOfBirth, address, ...registerData } = formData;
      // Only include dateOfBirth and address if they have valid values
      const cleanedData = {
        ...registerData,
        ...(dateOfBirth && dateOfBirth.trim() !== '' ? { dateOfBirth } : {}),
        ...(address && address.trim() !== '' ? { address } : {}),
      };
      await register(cleanedData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Professional Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/auth/medical-background.jpg)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/85 via-teal-800/80 to-blue-900/85"></div>
        <div className="absolute inset-0 bg-[url(/images/auth/pattern-overlay.png)] opacity-10"></div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Section - Registration Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-16 py-12 backdrop-blur-sm">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="MediWise Logo" 
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <span className="text-3xl font-bold text-white drop-shadow-lg">MediWise</span>
            </Link>
          </div>

          {/* Registration Form Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 lg:p-10 max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600 mb-8">Join MediWise today and start your healthcare journey.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Grid Layout for Side-by-Side Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full px-4 py-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-900 transition-all"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      className="w-full px-4 py-4 pr-12 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <FiEyeOff className="text-xl" /> : <FiEye className="text-xl" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                      className="w-full px-4 py-4 pr-12 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <FiEyeOff className="text-xl" /> : <FiEye className="text-xl" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-4 rounded-xl font-bold text-lg hover:from-teal-700 hover:to-teal-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02] mt-2"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600 text-sm mb-3">
                Already have an account?
              </p>
              <Link 
                href="/login" 
                className="inline-block w-full bg-teal-50 hover:bg-teal-100 text-teal-600 py-3 rounded-xl font-semibold text-center transition-colors border border-teal-200"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="mt-6 w-full max-w-2xl mx-auto text-center">
            <Link 
              href="/" 
              className="text-white/90 hover:text-white font-semibold text-sm transition-colors inline-flex items-center gap-1 drop-shadow-md"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Right Section - Illustrative Area */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center px-4 xl:px-8">
          {/* Language Selector */}
          <div className="absolute top-8 right-8 z-20">
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="bg-white/90 backdrop-blur-md text-teal-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-white transition-colors shadow-lg border border-white/20"
              >
                <span>{language}</span>
                <FiChevronDown className="text-sm" />
              </button>
              {showLanguageDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[180px] z-30">
                  <button
                    onClick={() => {
                      setLanguage('English (EN)');
                      setShowLanguageDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    English (EN)
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('বাংলা (BN)');
                      setShowLanguageDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    বাংলা (BN)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Doctor Image */}
          <div className="relative z-10 w-full">
            <div className="relative">
              <img 
                src="/images/auth/doctor-register.jpg" 
                alt="Doctor" 
                className="w-full h-auto rounded-3xl shadow-2xl border-4 border-white/20"
                style={{ maxWidth: 'none', width: '100%', height: 'auto' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Crect fill="%23e0f2f1" width="400" height="600"/%3E%3Ctext x="50%25" y="50%25" font-size="48" text-anchor="middle" fill="%23006666"%3E👩‍⚕️ Doctor%3C/text%3E%3C/svg%3E';
                }}
              />
              
              {/* Connect with Doctor Card */}
              <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 z-20 max-w-[200px] border border-white/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                    <FiVideo className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold text-sm mb-1">Connect with a Doctor</p>
                    <p className="text-gray-500 text-xs">24/7 Online Consultation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View - Language Selector */}
      <div className="lg:hidden fixed bottom-8 right-8 z-20">
        <button
          onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
          className="bg-white/90 backdrop-blur-md text-teal-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-white transition-colors shadow-lg border border-white/20"
        >
          <span>{language}</span>
          <FiChevronDown className="text-sm" />
        </button>
        {showLanguageDropdown && (
          <div className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[180px] z-30">
            <button
              onClick={() => {
                setLanguage('English (EN)');
                setShowLanguageDropdown(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              English (EN)
            </button>
            <button
              onClick={() => {
                setLanguage('বাংলা (BN)');
                setShowLanguageDropdown(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              বাংলা (BN)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}