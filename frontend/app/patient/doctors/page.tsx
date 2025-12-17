'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import PatientSidebar from '@/components/PatientSidebar';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import Link from 'next/link';
import { FiStar, FiMapPin, FiClock, FiDollarSign, FiSearch, FiCalendar, FiX } from 'react-icons/fi';
import { useNotification } from '@/context/NotificationContext';
import { formatDoctorName } from '@/utils/doctorName';

export default function PatientDoctorsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Booking modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
  });
  const [bookingError, setBookingError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  const fetchDoctors = useCallback(async (cursor?: string) => {
    try {
      setLoading(true);
      // Remove status filter to get all doctors from database (real-time)
      const params: any = { limit: 12 }; // Removed status: 'approved' to show all doctors
      if (cursor) params.cursor = cursor;
      if (selectedDept) params.departmentId = selectedDept;
      // Only include search if it's at least 2 characters and Enter was pressed
      // Don't auto-search on every keystroke

      const response = await api.get('/doctors', { params });
      console.log('Doctors API response:', response.data);
      const doctorsData = response.data.doctors || [];
      console.log('Doctors data:', doctorsData.length, 'doctors found');
      
      // Filter approved doctors on frontend for patient view
      const approvedDoctors = doctorsData.filter((doctor: any) => 
        doctor.status === 'approved' && (doctor.isAvailable !== false)
      );
      console.log('Approved and available doctors:', approvedDoctors.length);
      
      if (cursor) {
        // Filter out duplicates by doctor.id
        setDoctors((prev) => {
          const existingIds = new Set(prev.map(d => d.id));
          const newDoctors = approvedDoctors.filter((d: any) => !existingIds.has(d.id));
          return [...prev, ...newDoctors];
        });
      } else {
        // Remove duplicates from initial load as well
        const uniqueDoctors = approvedDoctors.filter((doctor: any, index: number, self: any[]) => 
          index === self.findIndex((d: any) => d.id === doctor.id)
        );
        console.log('Setting doctors:', uniqueDoctors.length);
        setDoctors(uniqueDoctors);
      }
      setNextCursor(response.data.pagination?.nextCursor || null);
      setHasMore(response.data.pagination?.hasMore || false);
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      console.error('Error response:', error.response?.data);
      showNotification(error.response?.data?.message || 'Failed to load doctors. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedDept, showNotification]);

  const searchDoctors = useCallback(async (query: string) => {
    try {
      const response = await api.get('/doctors/search', {
        params: { q: query, limit: 5 },
      });
      setSuggestions(response.data.doctors || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching doctors:', error);
    }
  }, []);

  // Read department from URL query parameter on mount
  useEffect(() => {
    const departmentParam = searchParams.get('department');
    if (departmentParam) {
      setSelectedDept(departmentParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'patient')) {
      router.push('/login');
      return;
    }
    if (user && user.role === 'patient') {
      fetchDepartments();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'patient') {
      // Reset doctors list when filter changes - always fetch fresh from database
      setDoctors([]);
      setNextCursor(null);
      setHasMore(false);
      fetchDoctors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedDept]); // fetchDoctors is stable enough - it only changes when selectedDept changes
  
  // Auto-refresh doctors list every 30 seconds for real-time updates from database
  useEffect(() => {
    if (user && user.role === 'patient') {
      const refreshInterval = setInterval(() => {
        console.log('Auto-refreshing doctors list from database...');
        fetchDoctors();
      }, 30000); // Refresh every 30 seconds for real-time updates
      
      return () => clearInterval(refreshInterval);
    }
  }, [user, fetchDoctors]);

  // Optimized debounced search with cleanup
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchDoctors(searchQuery);
      }, 400);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchDoctors]);


  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      // Reset cursor when searching
      setNextCursor(null);
      setHasMore(false);
      // Search when Enter is pressed with search query
      if (user && user.role === 'patient' && searchQuery.trim().length >= 2) {
        const searchDoctorsWithQuery = async () => {
          try {
            setLoading(true);
            const params: any = { limit: 12, status: 'approved', search: searchQuery.trim() };
            if (selectedDept) params.departmentId = selectedDept;
            
            const response = await api.get('/doctors', { params });
            const doctorsData = response.data.doctors || [];
            const uniqueDoctors = doctorsData.filter((doctor: any, index: number, self: any[]) => 
              index === self.findIndex((d: any) => d.id === doctor.id)
            );
            setDoctors(uniqueDoctors);
            setNextCursor(response.data.pagination?.nextCursor || null);
            setHasMore(response.data.pagination?.hasMore || false);
          } catch (error) {
            console.error('Error searching doctors:', error);
            showNotification('Failed to search doctors. Please try again.', 'error');
          } finally {
            setLoading(false);
          }
        };
        searchDoctorsWithQuery();
      } else if (user && user.role === 'patient') {
        // If search is cleared, fetch all doctors
        fetchDoctors();
      }
    }
  };


  const loadMore = () => {
    if (nextCursor && !loading) {
      fetchDoctors(nextCursor);
    }
  };

  const openBookingModal = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
    setAppointmentForm({ appointmentDate: '', appointmentTime: '', reason: '' });
    setAvailableSlots([]);
    setBookingError('');
  };

  const fetchAvailableSlots = async () => {
    if (!appointmentForm.appointmentDate || !selectedDoctor) return;
    
    try {
      setLoadingSlots(true);
      setBookingError('');
      const response = await api.get('/appointments/available-slots', {
        params: {
          doctorId: selectedDoctor.id,
          date: appointmentForm.appointmentDate,
        },
      });
      setAvailableSlots(response.data.availableSlots || []);
      if (response.data.isLimitReached) {
        setBookingError('This doctor has reached the daily appointment limit for this date.');
      }
    } catch (error: any) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
      setBookingError(error.response?.data?.message || 'Failed to fetch available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (appointmentForm.appointmentDate && showBookingModal && selectedDoctor) {
      fetchAvailableSlots();
    }
  }, [appointmentForm.appointmentDate, showBookingModal]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    if (!appointmentForm.appointmentDate || !appointmentForm.appointmentTime) {
      setBookingError('Please select both date and time');
      return;
    }

    try {
      setLoadingSlots(true);
      console.log('Booking appointment for doctor:', selectedDoctor.id);
      console.log('Appointment details:', appointmentForm);
      
      const response = await api.post('/appointments', {
        doctorId: selectedDoctor.id,
        appointmentDate: appointmentForm.appointmentDate,
        appointmentTime: appointmentForm.appointmentTime,
        reason: appointmentForm.reason || '',
      });
      
      console.log('Appointment booked successfully:', response.data);
      
      // Store appointment details for success modal
      const appointmentDetails = {
        doctor: selectedDoctor,
        date: appointmentForm.appointmentDate,
        time: appointmentForm.appointmentTime,
        reason: appointmentForm.reason,
        appointment: response.data.appointment,
      };
      setBookedAppointment(appointmentDetails);
      
      // Close booking modal
      setShowBookingModal(false);
      setAppointmentForm({ appointmentDate: '', appointmentTime: '', reason: '' });
      setAvailableSlots([]);
      
      // Show success confirmation modal
      setShowSuccessModal(true);
      
      // Show success notification
      showNotification('Appointment booked successfully! The doctor will see it in their appointments.', 'success');
      
    } catch (err: any) {
      console.error('Error booking appointment:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || 'Failed to book appointment';
      setBookingError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoadingSlots(false);
    }
  };

  const getAvailableDates = () => {
    if (!selectedDoctor?.availableDays) {
      console.log('No availableDays found for doctor:', selectedDoctor?.id);
      return [];
    }
    
    // Parse available days
    let days: string[] = [];
    try {
      if (Array.isArray(selectedDoctor.availableDays)) {
        days = selectedDoctor.availableDays;
      } else if (typeof selectedDoctor.availableDays === 'string') {
        // Try to parse as JSON first
        try {
          days = JSON.parse(selectedDoctor.availableDays);
        } catch {
          // If not JSON, try splitting by comma
          days = selectedDoctor.availableDays.split(',').map(d => d.trim()).filter(d => d);
        }
      }
    } catch (e) {
      console.error('Error parsing availableDays:', e, selectedDoctor.availableDays);
      return [];
    }
    
    console.log('Parsed available days:', days);
    
    if (days.length === 0) {
      console.warn('No available days parsed');
      return [];
    }
    
    // Normalize day names and map to day numbers
    const dayMap: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    // Convert available day names to numbers (case-insensitive)
    const availableDayNumbers = days
      .map((day: string) => {
        const normalizedDay = day.trim().toLowerCase();
        const dayNumber = dayMap[normalizedDay];
        if (dayNumber === undefined) {
          console.warn('Unknown day name:', day, 'normalized:', normalizedDay);
        }
        return dayNumber;
      })
      .filter((d: number | undefined) => d !== undefined && d >= 0 && d <= 6) as number[];
    
    console.log('Available day numbers:', availableDayNumbers);
    
    if (availableDayNumbers.length === 0) {
      console.warn('No valid available days found:', days);
      return [];
    }
    
    // Create a Set for faster lookup
    const availableDaysSet = new Set(availableDayNumbers);
    console.log('Available days set:', Array.from(availableDaysSet));
    
    const dates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get next 90 days and filter ONLY dates that fall on available days
    // CRITICAL: Only include dates where dayOfWeek is EXACTLY in availableDaysSet
    for (let i = 1; i <= 90; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
      
      // ABSOLUTE STRICT FILTERING: Double-check before adding
      if (!availableDaysSet.has(dayOfWeek)) {
        // Skip this date - it's not in available days
        continue;
      }
      
      // Format date as YYYY-MM-DD (local date, not UTC)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      // Verify once more before adding
      const verifyDate = new Date(year, date.getMonth(), date.getDate());
      const verifyDayOfWeek = verifyDate.getDay();
      
      if (availableDaysSet.has(verifyDayOfWeek)) {
        dates.push(dateString);
      }
    }
    
    // Final verification: remove any invalid dates due to timezone issues
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const validDates = dates.filter(d => {
      // Parse date string (YYYY-MM-DD) as local date
      const [year, month, day] = d.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day); // month is 0-indexed
      const dayOfWeek = dateObj.getDay();
      return availableDaysSet.has(dayOfWeek);
    });
    
    if (validDates.length !== dates.length) {
      const removed = dates.length - validDates.length;
      console.warn(`Removed ${removed} invalid date(s) due to timezone mismatch`);
    }
    
    console.log('Available dates filter:', {
      availableDays: days,
      availableDayNumbers: Array.from(availableDaysSet),
      totalDatesGenerated: 90,
      validDatesCount: validDates.length,
      sampleDates: validDates.slice(0, 3).map(d => {
        const [year, month, day] = d.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return dayNames[dateObj.getDay()] + ', ' + dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      })
    });
    
    return validDates;
  };

  if (authLoading) {
    return <Loading />;
  }

  if (!user || user.role !== 'patient') {
    return null; // Will redirect via useEffect
  }

  if (loading && doctors.length === 0) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <PatientSidebar user={user} logout={logout} />
        <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
          <Loading />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <PatientSidebar user={user} logout={logout} />
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        {/* Modern Header with Simple Color */}
        <header className="bg-teal-600 text-white shadow-xl">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Find Doctors</h1>
              <p className="text-sm sm:text-base text-teal-100">Browse and book appointments with our expert doctors</p>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
          {/* Search and Filter - Modern Design */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl z-10" />
                <input
                  type="text"
                  placeholder="Search doctors by name, specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  onFocus={() => {
                    if (searchQuery.length >= 2 && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white shadow-lg"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-teal-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {suggestions.map((doctor, index) => (
                      <div
                        key={doctor.id || `suggestion-${index}`}
                        onClick={async () => {
                          const doctorName = doctor.user?.name || '';
                          setSearchQuery(doctorName);
                          setShowSuggestions(false);
                          // Trigger search immediately with the selected doctor's name
                          try {
                            setLoading(true);
                            const params: any = { 
                              limit: 12, 
                              status: 'approved',
                              search: doctorName.trim()
                            };
                            if (selectedDept) params.departmentId = selectedDept;

                            const response = await api.get('/doctors', { params });
                            const doctorsData = response.data.doctors || [];
                            
                            const uniqueDoctors = doctorsData.filter((d: any, idx: number, self: any[]) => 
                              idx === self.findIndex((doc: any) => doc.id === d.id)
                            );
                            
                            setDoctors(uniqueDoctors);
                            setNextCursor(response.data.pagination?.nextCursor || null);
                            setHasMore(response.data.pagination?.hasMore || false);
                          } catch (error) {
                            console.error('Error searching doctors:', error);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 cursor-pointer transition-all"
                      >
                        <p className="font-semibold text-gray-800">{formatDoctorName(doctor.user?.name || '', doctor.qualification)}</p>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Department Filter Dropdown */}
              <select
                value={selectedDept || ''}
                onChange={(e) => setSelectedDept(e.target.value || null)}
                className="px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white min-w-[200px] md:min-w-[250px] shadow-lg font-semibold"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id || dept.name} value={dept.id || ''}>
                    {typeof dept.icon === 'string' ? dept.icon : ''} {typeof dept.name === 'string' ? dept.name : 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctors Grid */}
          {doctors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No doctors found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {doctors.map((doctor, index) => (
                  <div
                    key={doctor.id || `doctor-${index}`}
                    className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-105"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-20 h-20 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 text-2xl font-bold shadow-lg ring-4 ring-white ring-opacity-50">
                        {doctor.user?.name?.charAt(0)?.toUpperCase() || 'D'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {(() => {
                            return formatDoctorName(doctor.user?.name || '', doctor.qualification);
                          })()}
                        </h3>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <FiStar className="text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-gray-600">4.8</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      {doctor.department && (
                        <div className="flex items-center gap-2">
                          <FiMapPin className="text-gray-400" />
                          <span>{typeof doctor.department === 'string' ? doctor.department : doctor.department?.name || 'N/A'}</span>
                        </div>
                      )}
                      {doctor.experience && (
                        <div className="flex items-center gap-2">
                          <FiClock className="text-gray-400" />
                          <span>{doctor.experience} years experience</span>
                        </div>
                      )}
                      {doctor.consultationFee && (
                        <div className="flex items-center gap-2">
                          <FiDollarSign className="text-gray-400" />
                          <span>${doctor.consultationFee}</span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        openBookingModal(doctor);
                      }}
                      className="mt-4 w-full px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 hover:shadow-xl transition-all font-bold flex items-center justify-center gap-2 transform hover:scale-105"
                    >
                      <FiCalendar className="text-lg" />
                      Book Appointment
                    </button>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-6">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-8 py-4 bg-teal-600 text-white rounded-xl hover:bg-teal-700 hover:shadow-xl transition-all font-bold disabled:opacity-50 transform hover:scale-105"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Modern Professional Booking Modal */}
          {showBookingModal && selectedDoctor && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowBookingModal(false);
                setSelectedDoctor(null);
                setAppointmentForm({ appointmentDate: '', appointmentTime: '', reason: '' });
                setAvailableSlots([]);
                setBookingError('');
              }
            }}>
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Book Appointment</h2>
                      <p className="text-sm text-gray-500 mt-1">Schedule your visit with {formatDoctorName(selectedDoctor.user?.name || '', selectedDoctor.qualification)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowBookingModal(false);
                        setSelectedDoctor(null);
                        setAppointmentForm({ appointmentDate: '', appointmentTime: '', reason: '' });
                        setAvailableSlots([]);
                        setBookingError('');
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <FiX className="text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Doctor Info Card */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {selectedDoctor.user?.name?.charAt(0)?.toUpperCase() || 'D'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base">{formatDoctorName(selectedDoctor.user?.name || '', selectedDoctor.qualification)}</h3>
                      <p className="text-sm text-gray-600">{selectedDoctor.specialization}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {selectedDoctor.consultationFee && (
                          <span className="text-sm font-semibold text-white bg-teal-600 px-3 py-1 rounded-full inline-flex items-center">
                            ${parseFloat(selectedDoctor.consultationFee).toFixed(2)}
                          </span>
                        )}
                        {selectedDoctor.experience && (
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <FiClock className="text-xs" />
                            {selectedDoctor.experience} years experience
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleBookAppointment} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <FiCalendar className="text-teal-600 text-base" />
                      <span>Select Date <span className="text-red-500">*</span></span>
                    </label>
                    <select
                      value={appointmentForm.appointmentDate}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value, appointmentTime: '' })}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-white text-gray-900 text-sm"
                    >
                      <option value="">Choose a date</option>
                      {getAvailableDates().map((date) => {
                        const dateObj = new Date(date);
                        return (
                          <option key={date} value={date}>
                            {dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </option>
                        );
                      })}
                    </select>
                    {selectedDoctor.availableDays && (
                      <p className="text-xs text-gray-500 mt-2">
                        Available days: <span className="font-medium">{Array.isArray(selectedDoctor.availableDays) ? selectedDoctor.availableDays.join(', ') : JSON.parse(selectedDoctor.availableDays || '[]').join(', ')}</span>
                      </p>
                    )}
                  </div>

                  {/* Time Slots - Show after date is selected */}
                  {appointmentForm.appointmentDate && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <FiClock className="text-teal-600 text-base" />
                        <span>Select Time <span className="text-red-500">*</span></span>
                      </label>
                      {loadingSlots ? (
                        <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-teal-600 border-t-transparent"></div>
                          <p className="text-gray-600 text-sm mt-2">Loading available time slots...</p>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setAppointmentForm({ ...appointmentForm, appointmentTime: slot })}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                appointmentForm.appointmentTime === slot
                                  ? 'bg-teal-600 text-white shadow-md'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700 font-medium text-sm">No available slots for this date</p>
                          <p className="text-xs text-red-600 mt-1">Please select another date</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Reason for Visit <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={appointmentForm.reason}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                      placeholder="Briefly describe your reason for the appointment..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none text-gray-900 placeholder-gray-400 text-sm"
                    />
                  </div>

                  {/* Error Message */}
                  {bookingError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                      <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiX className="text-red-600 text-xs" />
                      </div>
                      <p className="text-sm text-red-700 font-medium flex-1">{bookingError}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingModal(false);
                        setSelectedDoctor(null);
                        setAppointmentForm({ appointmentDate: '', appointmentTime: '', reason: '' });
                        setAvailableSlots([]);
                        setBookingError('');
                      }}
                      className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!appointmentForm.appointmentDate || !appointmentForm.appointmentTime || loadingSlots}
                      className="flex-1 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      <FiCalendar className="text-base" />
                      Confirm Booking
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Success Confirmation Modal */}
          {showSuccessModal && bookedAppointment && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSuccessModal(false);
                setBookedAppointment(null);
                router.push('/patient/appointments');
              }
            }}>
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Success Header */}
                <div className="px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Appointment Confirmed!</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Your appointment has been successfully booked</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowSuccessModal(false);
                        setBookedAppointment(null);
                        router.push('/patient/appointments');
                      }}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-all"
                    >
                      <FiX className="text-xl" />
                    </button>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="px-8 py-6 space-y-4">
                  <div className="bg-white rounded-xl p-4 border-2 border-gray-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 font-bold">
                        {bookedAppointment.doctor.user?.name?.charAt(0)?.toUpperCase() || 'D'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{formatDoctorName(bookedAppointment.doctor.user?.name || '', bookedAppointment.doctor.qualification)}</h3>
                        <p className="text-sm text-gray-600">{bookedAppointment.doctor.specialization}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FiCalendar className="text-teal-600" />
                        <span className="font-medium">
                          {new Date(bookedAppointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <FiClock className="text-teal-600" />
                        <span className="font-medium">{bookedAppointment.time}</span>
                      </div>
                      {bookedAppointment.doctor.consultationFee && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <FiDollarSign className="text-teal-600" />
                          <span className="font-medium">Fee: ${bookedAppointment.doctor.consultationFee}</span>
                        </div>
                      )}
                      {bookedAppointment.reason && (
                        <div className="pt-2 border-t border-teal-200">
                          <p className="text-xs text-gray-500 uppercase mb-1">Reason</p>
                          <p className="text-gray-700">{bookedAppointment.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notification Message */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800 font-medium">
                      ✓ You'll receive a confirmation email shortly
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Check your appointments page to view all your scheduled visits
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      setBookedAppointment(null);
                      router.push('/patient/appointments');
                    }}
                    className="w-full px-6 py-3.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <FiCalendar className="text-lg" />
                    View My Appointments
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}