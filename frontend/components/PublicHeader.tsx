'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FiMenu, FiX } from 'react-icons/fi';

interface PublicHeaderProps {
  activePage?: string;
}

export default function PublicHeader({ activePage = '' }: PublicHeaderProps) {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
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
            <Link href="/" className={activePage === 'home' ? 'text-teal-600 font-semibold' : 'text-gray-700 hover:text-teal-600 transition-colors'}>Home</Link>
            <Link href="/about" className={activePage === 'about' ? 'text-teal-600 font-semibold' : 'text-gray-700 hover:text-teal-600 transition-colors'}>About Us</Link>
            <Link href="/departments" className={activePage === 'departments' ? 'text-teal-600 font-semibold' : 'text-gray-700 hover:text-teal-600 transition-colors'}>Department</Link>
            <Link href="/doctors" className={activePage === 'doctors' ? 'text-teal-600 font-semibold' : 'text-gray-700 hover:text-teal-600 transition-colors'}>Doctors</Link>
            <Link href="/blog" className={activePage === 'blog' ? 'text-teal-600 font-semibold' : 'text-gray-700 hover:text-teal-600 transition-colors'}>Blog</Link>
            <Link href="/contact" className={activePage === 'contact' ? 'text-teal-600 font-semibold' : 'text-gray-700 hover:text-teal-600 transition-colors'}>Contact Us</Link>
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
              <Link href="/" className={activePage === 'home' ? 'text-teal-600 font-semibold' : 'text-gray-700 hover:text-teal-600'}>Home</Link>
              <Link href="/about" className={activePage === 'about' ? 'text-teal-600 font-semibold' : 'text-gray-700 hover:text-teal-600'}>About Us</Link>
              <Link href="/departments" className={activePage === 'departments' ? 'text-teal-600 font-semibold' : 'text-gray-700 hover:text-teal-600'}>Department</Link>
              <Link href="/doctors" className={activePage === 'doctors' ? 'text-teal-600 font-semibold' : 'text-gray-700 hover:text-teal-600'}>Doctors</Link>
              <Link href="/blog" className={activePage === 'blog' ? 'text-teal-600 font-semibold' : 'text-gray-700 hover:text-teal-600'}>Blog</Link>
              <Link href="/contact" className={activePage === 'contact' ? 'text-teal-600 font-semibold' : 'text-gray-700 hover:text-teal-600'}>Contact Us</Link>
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
  );
}












