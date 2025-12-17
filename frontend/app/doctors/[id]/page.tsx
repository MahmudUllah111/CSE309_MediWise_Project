'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import Sidebar from '@/components/Sidebar';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { FiStar, FiClock, FiDollarSign, FiCalendar, FiX } from 'react-icons/fi';

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const [doctor, setDoctor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentForm, setAppointmentForm] = useState({
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [pageError, setPageError] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      fetchDoctorDetails();
    }
  }, [user, params.id]);

  useEffect(() => {
    if (appointmentForm.appointmentDate && showModal) {
      fetchAvailableSlots();
    }
  }, [appointmentForm.appointmentDate, showModal, params.id]);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/doctors/${params.id}`);
      if (response.data.success && response.data.doctor) {
        setDoctor(response.data.doctor);
        setReviews(response.data.reviews || []);
        setPageError('');
      } else {
        console.error('Invalid response format:', response.data);
        setPageError('Failed to load doctor details');
      }
    } catch (error: any) {
      console.error('Error fetching doctor details:', error);
      if (error.response?.status === 404) {
        setPageError('Doctor not found');
      } else {
        setPageError(error.response?.data?.message || 'Failed to load doctor details');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!appointmentForm.appointmentDate) return;
    
    try {
      setLoadingSlots(true);
      const response = await api.get('/appointments/available-slots', {
        params: {
          doctorId: params.id,
          date: appointmentForm.appointmentDate,
        },
      });
      setAvailableSlots(response.data.availableSlots || []);
      setLimitReached(response.data.isLimitReached || false);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!appointmentForm.appointmentDate || !appointmentForm.appointmentTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await api.post('/appointments', {
        doctorId: params.id,
        ...appointmentForm,
      });
      setShowModal(false);
      setAppointmentForm({ appointmentDate: '', appointmentTime: '', reason: '' });
      setAvailableSlots([]);
      showNotification('Appointment booked successfully!', 'success');
      router.push('/appointments');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to book appointment';
      setError(errorMessage);
      
      if (err.response?.data?.limitReached) {
        const contactAdmin = confirm(
          errorMessage + '\n\nWould you like to contact admin to request an override?'
        );
        if (contactAdmin) {
          // You can add a contact admin feature here
          router.push('/admin');
        }
      }
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  if (pageError) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700">{pageError}</p>
              <button
                onClick={() => router.back()}
                className="mt-4 text-teal-600 hover:underline"
              >
                ← Go Back
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!doctor) {
    return <Loading />;
  }

  const avgRating = doctor.rating?.avgRating || 0;
  const totalReviews = doctor.rating?.totalReviews || 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-4 text-teal-600 hover:underline"
          >
            ← Back to Doctors
          </button>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{doctor.user?.name}</h1>
                <p className="text-xl text-teal-600 mt-2">{doctor.specialization}</p>
                <p className="text-gray-600 mt-1">{doctor.department?.name}</p>
              </div>
              {doctor.department?.icon && (
                <span className="text-5xl">{doctor.department.icon}</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center text-gray-700">
                <FiStar className="mr-2 text-yellow-500" />
                <span className="font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-sm ml-1">({totalReviews} reviews)</span>
              </div>
              {doctor.experience && (
                <div className="flex items-center text-gray-700">
                  <FiClock className="mr-2" />
                  {doctor.experience} years experience
                </div>
              )}
              {doctor.consultationFee && (
                <div className="flex items-center text-gray-700">
                  <FiDollarSign className="mr-2" />
                  ${doctor.consultationFee}
                </div>
              )}
            </div>

            {doctor.bio && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">About</h2>
                <p className="text-gray-600">{doctor.bio}</p>
              </div>
            )}

            {doctor.qualification && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Qualifications</h2>
                <p className="text-gray-600 whitespace-pre-line">{doctor.qualification}</p>
              </div>
            )}

            {(doctor.availableFrom && doctor.availableTo) || (doctor.availableDays && doctor.availableDays.length > 0) ? (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Availability</h2>
                {doctor.availableDays && Array.isArray(doctor.availableDays) && doctor.availableDays.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-500 mb-2">Available Days:</p>
                    <div className="flex flex-wrap gap-2">
                      {doctor.availableDays.map((day: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {doctor.availableFrom && doctor.availableTo && (
                  <p className="text-gray-600">
                    Time: {doctor.availableFrom} - {doctor.availableTo}
                  </p>
                )}
              </div>
            ) : null}

            {user.role === 'patient' && (
              <button
                onClick={() => setShowModal(true)}
                className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
              >
                <FiCalendar className="text-xl" />
                Book Appointment
              </button>
            )}
          </div>

          {reviews.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Reviews</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-800">{review.patient?.name}</p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`${
                              i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-600">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Book Appointment</h2>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                {limitReached && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                    ⚠️ This doctor has reached the daily appointment limit. Please contact admin or choose another date.
                  </div>
                )}
                {doctor.availableFrom && doctor.availableTo && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                    📅 Available: {doctor.availableFrom} - {doctor.availableTo}
                  </div>
                )}
                <form onSubmit={handleBookAppointment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={appointmentForm.appointmentDate}
                      onChange={(e) => {
                        setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value, appointmentTime: '' });
                        setAvailableSlots([]);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    {loadingSlots ? (
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                        Loading available slots...
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <select
                        value={appointmentForm.appointmentTime}
                        onChange={(e) =>
                          setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Select time slot</option>
                        {availableSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    ) : appointmentForm.appointmentDate ? (
                      <div className="w-full px-4 py-2 border border-red-300 rounded-lg bg-red-50 text-red-700">
                        No available slots for this date. Please choose another date.
                      </div>
                    ) : (
                      <input
                        type="time"
                        value={appointmentForm.appointmentTime}
                        onChange={(e) =>
                          setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    )}
                    {availableSlots.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {availableSlots.length} available slot(s) for this date
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason
                    </label>
                    <textarea
                      value={appointmentForm.reason}
                      onChange={(e) =>
                        setAppointmentForm({ ...appointmentForm, reason: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Brief description of your condition"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setAppointmentForm({ appointmentDate: '', appointmentTime: '', reason: '' });
                        setAvailableSlots([]);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={limitReached && user?.role !== 'admin'}
                      className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Book Appointment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`${
                              i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-600">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Book Appointment</h2>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                {limitReached && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                    ⚠️ This doctor has reached the daily appointment limit. Please contact admin or choose another date.
                  </div>
                )}
                {doctor.availableFrom && doctor.availableTo && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                    📅 Available: {doctor.availableFrom} - {doctor.availableTo}
                  </div>
                )}
                <form onSubmit={handleBookAppointment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={appointmentForm.appointmentDate}
                      onChange={(e) => {
                        setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value, appointmentTime: '' });
                        setAvailableSlots([]);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    {loadingSlots ? (
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                        Loading available slots...
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <select
                        value={appointmentForm.appointmentTime}
                        onChange={(e) =>
                          setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Select time slot</option>
                        {availableSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    ) : appointmentForm.appointmentDate ? (
                      <div className="w-full px-4 py-2 border border-red-300 rounded-lg bg-red-50 text-red-700">
                        No available slots for this date. Please choose another date.
                      </div>
                    ) : (
                      <input
                        type="time"
                        value={appointmentForm.appointmentTime}
                        onChange={(e) =>
                          setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    )}
                    {availableSlots.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {availableSlots.length} available slot(s) for this date
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason
                    </label>
                    <textarea
                      value={appointmentForm.reason}
                      onChange={(e) =>
                        setAppointmentForm({ ...appointmentForm, reason: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Brief description of your condition"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setAppointmentForm({ appointmentDate: '', appointmentTime: '', reason: '' });
                        setAvailableSlots([]);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={limitReached && user?.role !== 'admin'}
                      className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Book Appointment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

