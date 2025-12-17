'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiEye, FiEyeOff, FiChevronDown, FiVideo } from 'react-icons/fi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('English (EN)');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        setError('Cannot connect to server. Please make sure the backend is running on port 5000.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials and try again.');
      }
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
        {/* Left Section - Login Form */}
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

          {/* Login Form Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 lg:p-10 max-w-md border border-white/20">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-600 mb-8">Welcome back! Please login to your account.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-gray-700 text-sm font-medium">Remember me</span>
                </label>
                <Link href="#" className="text-teal-600 text-sm font-medium hover:text-teal-700 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-4 rounded-xl font-bold text-lg hover:from-teal-700 hover:to-teal-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02]"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>

              {/* Can't access account */}
              <div className="text-center">
                <Link href="#" className="text-gray-600 text-sm font-medium hover:text-teal-600 hover:underline">
                  Can't access your account?
                </Link>
              </div>
            </form>

            {/* Create Account Link */}
            <div className="mt-6 text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600 text-sm mb-3">
                Don't have an account?
              </p>
              <Link 
                href="/register" 
                className="inline-block w-full bg-teal-50 hover:bg-teal-100 text-teal-600 py-3 rounded-xl font-semibold text-center transition-colors border border-teal-200"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="mt-6 w-full max-w-md mx-auto text-center">
            <Link 
              href="/" 
              className="text-white/90 hover:text-white font-semibold text-sm transition-colors inline-flex items-center gap-1 drop-shadow-md"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Right Section - Illustrative Area */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center px-8 xl:px-16">
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
          <div className="relative z-10">
            <div className="relative">
              <img 
                src="/images/auth/doctor-login.jpg" 
                alt="Doctor" 
                className="w-full max-w-2xl h-auto rounded-3xl shadow-2xl border-4 border-white/20"
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
