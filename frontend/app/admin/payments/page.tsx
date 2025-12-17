'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import Loading from '@/components/Loading';
import api from '@/lib/api';
import { format } from 'date-fns';
import { 
  FiDollarSign, 
  FiCalendar, 
  FiPlus,
  FiX
} from 'react-icons/fi';

export default function AdminPaymentsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCompanyShare: 0,
    totalDoctorPayments: 0,
    totalSalaries: 0,
    netProfit: 0,
  });
  const [filterType, setFilterType] = useState<'all' | 'salary' | 'fee_split'>('all');
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    recipientId: '',
    amount: '',
    paymentMonth: '',
    notes: '',
  });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchPayments();
    fetchStats();
    fetchStaffAndDoctors();
  }, [user, authLoading, router, filterType]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterType !== 'all') {
        params.type = filterType;
      }
      const response = await api.get('/payments', { params });
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      showNotification('Failed to fetch payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/payments/stats');
      setStats(response.data.stats || {
        totalRevenue: 0,
        totalCompanyShare: 0,
        totalDoctorPayments: 0,
        totalSalaries: 0,
        netProfit: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchStaffAndDoctors = async () => {
    try {
      const [staffResponse, doctorsResponse] = await Promise.all([
        api.get('/staff'),
        api.get('/doctors'),
      ]);
      setStaffList(staffResponse.data.staff || []);
      setDoctorsList(doctorsResponse.data.doctors || []);
    } catch (error) {
      console.error('Error fetching staff/doctors:', error);
    }
  };

  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!salaryForm.recipientId || !salaryForm.amount || !salaryForm.paymentMonth) {
        showNotification('Please fill all required fields', 'error');
        return;
      }

      await api.post('/payments/salary', salaryForm);
      showNotification('Salary paid successfully', 'success');
      setShowSalaryModal(false);
      setSalaryForm({
        recipientId: '',
        amount: '',
        paymentMonth: '',
        notes: '',
      });
      fetchPayments();
      fetchStats();
    } catch (error: any) {
      console.error('Error paying salary:', error);
      showNotification(error.response?.data?.message || 'Failed to pay salary', 'error');
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'salary':
        return 'Salary';
      case 'fee_split':
        return 'Fee Split';
      case 'refund':
        return 'Refund';
      default:
        return type;
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'salary':
        return 'bg-blue-100 text-blue-700';
      case 'fee_split':
        return 'bg-green-100 text-green-700';
      case 'refund':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const allRecipients = [
    ...staffList.map((s: any) => ({ id: s.userId, name: s.user?.name, type: 'staff' })),
    ...doctorsList.map((d: any) => ({ id: d.userId, name: d.user?.name, type: 'doctor' })),
  ];

  const filteredPayments = filterType === 'all' 
    ? payments 
    : payments.filter(p => p.type === filterType);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar />
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        <AdminHeader 
          title="Payment Management"
          actionButton={{
            label: 'Pay Salary',
            onClick: () => setShowSalaryModal(true),
            icon: <FiPlus />
          }}
        />

        <div className="p-6 lg:p-8">
          {/* Simple Filter Tabs */}
          <div className="mb-6">
            <div className="inline-flex bg-white rounded-lg shadow p-1 border border-gray-200">
              {(['all', 'salary', 'fee_split'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterType === tab
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab === 'all' ? 'All Payments' : tab === 'salary' ? 'Salaries' : 'Fee Splits'}
                </button>
              ))}
            </div>
          </div>

          {/* Simple Payments Table */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment History
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredPayments.length} {filteredPayments.length === 1 ? 'record' : 'records'})
                </span>
              </h3>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FiDollarSign className="text-3xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No payments found</h3>
                <p className="text-gray-600 mb-6">Payment records will appear here once transactions are made</p>
                <button
                  onClick={() => setShowSalaryModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg"
                >
                  <FiPlus /> Pay Salary
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Type</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Details</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Recipient</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Amount</th>
                      {(filterType === 'fee_split' || filterType === 'all') && (
                        <>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Doctor (70%)</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Company (30%)</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Total Fee</th>
                        </>
                      )}
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Date</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                            payment.type === 'salary' 
                              ? 'bg-blue-100 text-blue-700' 
                              : payment.type === 'fee_split'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {getPaymentTypeLabel(payment.type)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {payment.appointment ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                <FiCalendar className="text-teal-600" />
                                Appointment #{payment.appointment.id?.substring(0, 8)}
                              </div>
                              {payment.appointment.patient?.name && (
                                <div className="text-xs text-gray-600">Patient: {payment.appointment.patient.name}</div>
                              )}
                              <div className="text-xs text-gray-500">
                                {payment.appointment.appointmentDate 
                                  ? format(new Date(payment.appointment.appointmentDate), 'MMM dd, yyyy')
                                  : 'N/A'}
                                {payment.appointment.appointmentTime && ` • ${payment.appointment.appointmentTime}`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">{payment.recipient?.name || 'N/A'}</div>
                          {payment.doctor && payment.doctor.user && (
                            <div className="text-xs text-gray-500">Dr. {payment.doctor.user.name}</div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900">
                            ${parseFloat(payment.amount || 0).toLocaleString()}
                          </div>
                        </td>
                        {(filterType === 'fee_split' || filterType === 'all') && payment.type === 'fee_split' ? (
                          <>
                            <td className="py-4 px-6">
                              <div className="font-semibold text-blue-600">
                                ${parseFloat(payment.doctorShare || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-semibold text-teal-600">
                                ${parseFloat(payment.companyShare || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-semibold text-gray-700">
                                ${parseFloat(payment.totalFee || 0).toLocaleString()}
                              </div>
                            </td>
                          </>
                        ) : (filterType === 'fee_split' || filterType === 'all') ? (
                          <>
                            <td className="py-4 px-6 text-gray-300">-</td>
                            <td className="py-4 px-6 text-gray-300">-</td>
                            <td className="py-4 px-6 text-gray-300">-</td>
                          </>
                        ) : null}
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600">
                            {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-gray-400">
                            {format(new Date(payment.paymentDate), 'hh:mm a')}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            payment.status === 'completed' 
                              ? 'bg-green-100 text-green-700'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Pay Salary Modal */}
        {showSalaryModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Pay Salary</h2>
                <button
                  onClick={() => {
                    setShowSalaryModal(false);
                    setSalaryForm({
                      recipientId: '',
                      amount: '',
                      paymentMonth: '',
                      notes: '',
                    });
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FiX className="text-gray-600" />
                </button>
              </div>

              <form onSubmit={handlePaySalary} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient *</label>
                  <select
                    value={salaryForm.recipientId}
                    onChange={(e) => setSalaryForm({ ...salaryForm, recipientId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  >
                    <option value="">Select recipient</option>
                    {allRecipients.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipient.name} ({recipient.type === 'staff' ? 'Staff' : 'Doctor'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={salaryForm.amount}
                    onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Month *</label>
                  <input
                    type="month"
                    value={salaryForm.paymentMonth}
                    onChange={(e) => setSalaryForm({ ...salaryForm, paymentMonth: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={salaryForm.notes}
                    onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                    placeholder="Optional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                  >
                    Pay Salary
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSalaryModal(false);
                      setSalaryForm({
                        recipientId: '',
                        amount: '',
                        paymentMonth: '',
                        notes: '',
                      });
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
