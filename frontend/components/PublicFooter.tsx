'use client';

import Link from 'next/link';
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter, FiInstagram, FiLinkedin } from 'react-icons/fi';

export default function PublicFooter() {
  return (
    <footer className="bg-teal-900 text-white py-16">
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
  );
}












