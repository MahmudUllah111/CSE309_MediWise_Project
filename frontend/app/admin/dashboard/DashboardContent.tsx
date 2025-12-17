'use client';

import React from 'react';
import { FiUsers, FiCalendar, FiUser, FiDollarSign, FiClock, FiArrowRight, FiEdit, FiTrash2 } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { formatDoctorName } from '@/utils/doctorName';

interface DashboardContentProps {
  stats: any;
  onRefresh: () => void;
}

export default function DashboardContent({ stats, onRefresh }: DashboardContentProps) {
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return num?.toLocaleString() || '0';
  };

  // Get recent appointments (latest 5)
  const recentAppointments = stats?.recentAppointments?.slice(0, 5) || [];

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <Link href="/admin/patients" className="bg-white rounded p-4 border border-gray-200 hover:border-teal-500 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.stats?.totalPatients || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded bg-teal-100 flex items-center justify-center">
              <FiUsers className="text-teal-600 text-xl" />
            </div>
          </div>
        </Link>

        {/* Total Doctors */}
        <Link href="/admin/doctors" className="bg-white rounded p-4 border border-gray-200 hover:border-teal-500 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Doctors</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.stats?.totalDoctors || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded bg-blue-100 flex items-center justify-center">
              <FiUser className="text-blue-600 text-xl" />
            </div>
          </div>
        </Link>

        {/* Total Appointments */}
        <Link href="/admin/appointments" className="bg-white rounded p-4 border border-gray-200 hover:border-teal-500 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.stats?.totalAppointments || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded bg-green-100 flex items-center justify-center">
              <FiCalendar className="text-green-600 text-xl" />
            </div>
          </div>
        </Link>

        {/* Pending Appointments */}
        <Link href="/admin/appointments" className="bg-white rounded p-4 border border-gray-200 hover:border-teal-500 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.stats?.pendingAppointments || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded bg-orange-100 flex items-center justify-center">
              <FiClock className="text-orange-600 text-xl" />
            </div>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Appointments */}
        <div className="lg:col-span-2 bg-white rounded p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Recent Appointments</h3>
            <Link 
              href="/admin/appointments"
              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View All
              <FiArrowRight className="text-xs" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiCalendar className="text-3xl mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((appt: any) => {
                const age = calculateAge(appt.patient?.dateOfBirth);
                return (
                  <div key={appt.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {appt.patient?.name || 'Unknown'}
                          </p>
                          {age && (
                            <span className="text-xs text-gray-500">({age} years)</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {formatDoctorName(appt.doctor?.user?.name || 'Doctor', appt.doctor?.qualification)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{format(parseISO(appt.appointmentDate), 'MMM dd, yyyy')}</span>
                          <span>{appt.appointmentTime}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                            appt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                            appt.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {appt.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions & Payment Summary */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded p-4 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link 
                href="/admin/patients"
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700">Manage Patients</span>
                <FiArrowRight className="text-xs text-gray-400" />
              </Link>
              <Link 
                href="/admin/doctors"
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700">Manage Doctors</span>
                <FiArrowRight className="text-xs text-gray-400" />
              </Link>
              <Link 
                href="/admin/appointments"
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700">View Appointments</span>
                <FiArrowRight className="text-xs text-gray-400" />
              </Link>
              <Link 
                href="/admin/payments"
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700">Payment Management</span>
                <FiArrowRight className="text-xs text-gray-400" />
              </Link>
              <Link 
                href="/admin/departments"
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700">Departments</span>
                <FiArrowRight className="text-xs text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Payment Summary</h3>
              <Link 
                href="/admin/payments"
                className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                View All
                <FiArrowRight className="text-xs" />
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="text-sm font-semibold text-gray-900">
                  ${formatNumber(stats?.stats?.paymentStats?.totalRevenue || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Company Share</span>
                <span className="text-sm font-semibold text-gray-900">
                  ${formatNumber(stats?.stats?.paymentStats?.totalCompanyShare || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Doctor Payments</span>
                <span className="text-sm font-semibold text-gray-900">
                  ${formatNumber(stats?.stats?.paymentStats?.totalDoctorPayments || 0)}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Net Profit</span>
                  <span className={`text-sm font-semibold ${
                    (stats?.stats?.paymentStats?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${formatNumber(Math.abs(stats?.stats?.paymentStats?.netProfit || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
