'use client';

import { Suspense, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PatientSidebar from '@/components/PatientSidebar';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import Link from 'next/link';
import { FiStar, FiMapPin, FiClock, FiDollarSign, FiBell, FiSearch, FiMessageCircle, FiMenu, FiX, FiUser, FiCalendar, FiAward, FiArrowRight } from 'react-icons/fi';
import { formatDoctorName } from '@/utils/doctorName';

function DoctorsPageContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Read department from URL query parameter on mount - must run first
  useEffect(() => {
    const departmentParam = searchParams.get('department');
    if (departmentParam) {
      setSelectedDept(departmentParam);
    } else {
      setSelectedDept('');
    }
  }, [searchParams]);

  // Fetch data without requiring authentication
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch doctors when selectedDept or searchQuery changes
  useEffect(() => {
    console.log('selectedDept changed to:', selectedDept, 'departments loaded:', departments.length);
    // Reset doctors list when filter changes
    setDoctors([]);
    setNextCursor(null);
    setHasMore(false);
    // Fetch doctors - don't wait for departments if no filter is set
    fetchDoctors();
  }, [selectedDept, searchQuery]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchDoctors();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDoctors = async (cursor?: string) => {
    try {
      setLoading(true);
      const params: any = { limit: 12, status: 'approved' };
      if (selectedDept) {
        params.departmentId = selectedDept;
        console.log('Fetching doctors for department:', selectedDept);
      }
      if (searchQuery && searchQuery.length >= 2) params.search = searchQuery;
      if (cursor) params.cursor = cursor;

      console.log('API params:', params);
      const response = await api.get('/doctors', { params });
      console.log('Received doctors:', response.data.doctors?.length || 0);
      
      if (cursor) {
        setDoctors((prev) => [...prev, ...response.data.doctors]);
      } else {
        setDoctors(response.data.doctors || []);
      }
      setNextCursor(response.data.pagination?.nextCursor);
      setHasMore(response.data.pagination?.hasMore || false);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchDoctors = async () => {
    try {
      const response = await api.get('/doctors/search', {
        params: { query: searchQuery, limit: 5 },
      });
      setSuggestions(response.data.doctors || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching doctors:', error);
    }
  };

  const handleSuggestionClick = (doctor: any) => {
    setSearchQuery(doctor.user.name);
    setShowSuggestions(false);
    setSelectedDept(doctor.departmentId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const loadMore = () => {
    if (nextCursor && !loading) {
      fetchDoctors(nextCursor);
    }
  };

  const handleViewProfile = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowProfileModal(true);
  };

  const handleBookAppointment = () => {
    if (user) {
      // If logged in, redirect to patient doctors page or booking
      router.push('/patient/doctors');
    } else {
      // If not logged in, redirect to register
      router.push('/register?redirect=/patient/doctors');
    }
  };

  // If user is logged in and is a patient, show the patient view
  if (!authLoading && user && user.role === 'patient') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <PatientSidebar user={user} logout={logout} />
        <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
          <div className="bg-teal-600 text-white px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Find a Doctor</h1>
            <p className="text-teal-100 text-sm sm:text-base mt-1">Browse our expert medical professionals</p>
          </div>
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                    placeholder="Search doctors by name..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {suggestions.map((doctor) => (
                        <div
                          key={doctor.id}
                          onClick={() => handleSuggestionClick(doctor)}
                          className="px-4 py-2 hover:bg-teal-50 cursor-pointer border-b border-gray-100 last:border-0"
                        >
                          <p className="font-semibold text-gray-800">{formatDoctorName(doctor.user?.name, doctor.qualification)}</p>
                          <p className="text-sm text-gray-600">{doctor.specialization}</p>
                          <p className="text-xs text-gray-500">{doctor.department?.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <select
                  value={selectedDept}
                  onChange={(e) => {
                    const deptId = e.target.value;
                    setSelectedDept(deptId);
                    // Update URL when department changes
                    if (deptId) {
                      router.push(`/doctors?department=${deptId}`);
                    } else {
                      router.push('/doctors');
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.icon} {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {loading && doctors.length === 0 ? (
                <Loading />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">
                              {formatDoctorName(doctor.user?.name, doctor.qualification)}
                            </h3>
                            <p className="text-teal-600 mt-1">{doctor.specialization}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {doctor.department?.name}
                            </p>
                          </div>
                          {doctor.department?.icon && (
                            <span className="text-3xl">{doctor.department.icon}</span>
                          )}
                        </div>

                        {doctor.bio && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{doctor.bio}</p>
                        )}

                        <div className="space-y-2 mb-4">
                          {doctor.experience && (
                            <div className="flex items-center text-sm text-gray-600">
                              <FiClock className="mr-2" />
                              {doctor.experience} years experience
                            </div>
                          )}
                          {doctor.consultationFee && (
                            <div className="flex items-center text-sm text-gray-600">
                              <FiDollarSign className="mr-2" />
                              ${doctor.consultationFee}
                            </div>
                          )}
                        </div>

                        <Link
                          href={`/patient/doctors`}
                          className="block w-full text-center bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                        >
                          View Profile
                        </Link>
                      </div>
                    ))}
                  </div>

                  {hasMore && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Public view - no login required
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
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
              <Link href="/" className="text-gray-700 hover:text-teal-600 transition-colors">Home</Link>
              <Link href="/about" className="text-gray-700 hover:text-teal-600 transition-colors">About Us</Link>
              <Link href="/departments" className="text-gray-700 hover:text-teal-600 transition-colors">Department</Link>
              <Link href="/doctors" className="text-teal-600 font-semibold">Doctors</Link>
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
                <Link href="/doctors" className="text-teal-600 font-semibold">Doctors</Link>
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

      {/* Page Header */}
      <header className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Our Expert Doctors</h1>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              Browse our team of experienced healthcare professionals. Book an appointment to get in touch.
            </p>
          </div>
        </div>
      </header>

      {/* Search and Filter Section */}
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  placeholder="Search doctors by name or specialization..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600 outline-none"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((doctor) => (
                      <div
                        key={doctor.id}
                        onClick={() => handleSuggestionClick(doctor)}
                        className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <p className="font-semibold text-gray-800">{formatDoctorName(doctor.user?.name, doctor.qualification)}</p>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                        <p className="text-xs text-gray-500">{doctor.department?.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={selectedDept}
                onChange={(e) => {
                  const deptId = e.target.value;
                  setSelectedDept(deptId);
                  // Update URL when department changes
                  if (deptId) {
                    router.push(`/doctors?department=${deptId}`);
                  } else {
                    router.push('/doctors');
                  }
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg focus:border-teal-600 focus:ring-2 focus:ring-teal-600 outline-none bg-white"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.icon} {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {selectedDept && (
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Showing doctors from:</span>
                <span className="text-sm font-semibold text-teal-600">
                  {departments.find(d => d.id === selectedDept)?.name || 'Selected Department'}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedDept('');
                  router.push('/doctors');
                }}
                className="text-sm text-teal-600 hover:text-teal-700 underline"
              >
                Clear filter
              </button>
            </div>
          )}
          {loading && doctors.length === 0 ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">No doctors found matching your criteria.</p>
              {selectedDept && (
                <button
                  onClick={() => {
                    setSelectedDept('');
                    router.push('/doctors');
                  }}
                  className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  View All Doctors
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 p-6 border border-gray-100"
                  >
                    <div className="text-center mb-4">
                      <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <FiUser className="text-4xl text-teal-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {formatDoctorName(doctor.user?.name, doctor.qualification)}
                      </h3>
                      <p className="text-teal-600 font-semibold mb-2">{doctor.specialization}</p>
                      <p className="text-sm text-gray-600">{doctor.department?.name}</p>
                    </div>

                    {doctor.bio && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3 text-center">{doctor.bio}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      {doctor.experience && (
                        <div className="flex items-center justify-center text-sm text-gray-600">
                          <FiClock className="mr-2 text-teal-600" />
                          <span>{doctor.experience} years experience</span>
                        </div>
                      )}
                      {doctor.consultationFee && (
                        <div className="flex items-center justify-center text-sm text-gray-600">
                          <FiDollarSign className="mr-2 text-teal-600" />
                          <span>${doctor.consultationFee} consultation fee</span>
                        </div>
                      )}
                      {doctor.qualification && (
                        <div className="flex items-center justify-center text-sm text-gray-600">
                          <FiAward className="mr-2 text-teal-600" />
                          <span className="line-clamp-1">{doctor.qualification}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleViewProfile(doctor)}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={handleBookAppointment}
                        className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <FiCalendar /> Book Appointment
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-12 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {loading ? 'Loading...' : (
                      <>
                        Load More <FiArrowRight />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Profile Modal */}
      {showProfileModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {formatDoctorName(selectedDoctor.user?.name, selectedDoctor.qualification)}
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FiX className="text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FiUser className="text-5xl text-teal-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {formatDoctorName(selectedDoctor.user?.name, selectedDoctor.qualification)}
                </h3>
                <p className="text-teal-600 font-semibold text-lg mb-1">{selectedDoctor.specialization}</p>
                <p className="text-gray-600">{selectedDoctor.department?.name}</p>
              </div>

              <div className="space-y-4 mb-6">
                {selectedDoctor.bio && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedDoctor.bio}</p>
                  </div>
                )}

                {selectedDoctor.qualification && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Qualification</h4>
                    <p className="text-gray-600">{selectedDoctor.qualification}</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {selectedDoctor.experience && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FiClock className="text-teal-600 text-xl" />
                      <div>
                        <p className="text-sm text-gray-600">Experience</p>
                        <p className="font-semibold text-gray-900">{selectedDoctor.experience} years</p>
                      </div>
                    </div>
                  )}
                  {selectedDoctor.consultationFee && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FiDollarSign className="text-teal-600 text-xl" />
                      <div>
                        <p className="text-sm text-gray-600">Consultation Fee</p>
                        <p className="font-semibold text-gray-900">${selectedDoctor.consultationFee}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Note: Contact information is hidden for public view */}
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <p className="text-sm text-teal-800">
                    <strong>Note:</strong> To book an appointment and view contact information, please create an account or login.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={handleBookAppointment}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <FiCalendar /> Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DoctorsPage = () => (
  <Suspense fallback={<Loading />}>
    <DoctorsPageContent />
  </Suspense>
);

export default DoctorsPage;

