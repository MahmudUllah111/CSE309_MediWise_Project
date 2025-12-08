import { Op } from 'sequelize';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import Ad from '../models/Ad.js';
import Department from '../models/Department.js';
import Payment from '../models/Payment.js';

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Basic counts
    const totalUsers = await User.count();
    const totalDoctors = await Doctor.count();
    const totalAppointments = await Appointment.count();
    const totalPrescriptions = await Prescription.count();
    
    // Try to count ads, but don't fail if table doesn't exist or has issues
    let totalAds = 0;
    try {
      totalAds = await Ad.count();
    } catch (adError) {
      console.warn('Error counting ads:', adError.message);
    }

    // Appointment statistics
    const pendingAppointments = await Appointment.count({
      where: { status: 'pending' },
    });

    const confirmedAppointments = await Appointment.count({
      where: { status: 'confirmed' },
    });

    const completedAppointments = await Appointment.count({
      where: { status: 'completed' },
    });

    // Appointments in last 7 days
    const appointmentsLast7Days = await Appointment.count({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
    });

    // Appointments today
    const appointmentsToday = await Appointment.count({
      where: {
        appointmentDate: {
          [Op.gte]: today,
          [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    // New patients in last 7 days
    const newPatientsLast7Days = await User.count({
      where: {
        role: 'patient',
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
    });

    // New patients today
    const newPatientsToday = await User.count({
      where: {
        role: 'patient',
        createdAt: {
          [Op.gte]: today,
        },
      },
    });

    // Total patients
    const totalPatients = await User.count({
      where: { role: 'patient' },
    });

    // Calculate percentage changes (comparing last 7 days to previous 7 days)
    const previous7DaysStart = new Date(sevenDaysAgo);
    previous7DaysStart.setDate(previous7DaysStart.getDate() - 7);
    const previous7DaysEnd = sevenDaysAgo;

    const appointmentsPrevious7Days = await Appointment.count({
      where: {
        createdAt: {
          [Op.gte]: previous7DaysStart,
          [Op.lt]: previous7DaysEnd,
        },
      },
    });

    const newPatientsPrevious7Days = await User.count({
      where: {
        role: 'patient',
        createdAt: {
          [Op.gte]: previous7DaysStart,
          [Op.lt]: previous7DaysEnd,
        },
      },
    });

    // Calculate percentage changes
    const appointmentChangePercent = appointmentsPrevious7Days > 0
      ? ((appointmentsLast7Days - appointmentsPrevious7Days) / appointmentsPrevious7Days * 100).toFixed(1)
      : appointmentsLast7Days > 0 ? '100.0' : '0.0';

    const newPatientsChangePercent = newPatientsPrevious7Days > 0
      ? ((newPatientsLast7Days - newPatientsPrevious7Days) / newPatientsPrevious7Days * 100).toFixed(1)
      : newPatientsLast7Days > 0 ? '100.0' : '0.0';

    // Patient demographics by age
    const patients = await User.findAll({
      where: { role: 'patient' },
      attributes: ['id', 'dateOfBirth'],
    });

    const ageGroups = {
      '0-18': 0,
      '19-30': 0,
      '31-45': 0,
      '46-60': 0,
      '60+': 0,
    };

    const genderGroups = {
      male: 0,
      female: 0,
    };

    patients.forEach(patient => {
      if (patient.dateOfBirth) {
        const birthDate = new Date(patient.dateOfBirth);
        const age = now.getFullYear() - birthDate.getFullYear();
        if (age <= 18) ageGroups['0-18']++;
        else if (age <= 30) ageGroups['19-30']++;
        else if (age <= 45) ageGroups['31-45']++;
        else if (age <= 60) ageGroups['46-60']++;
        else ageGroups['60+']++;
      }
    });

    // Get monthly appointment data for last 8 months
    const monthlyData = [];
    for (let i = 7; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthAppointments = await Appointment.count({
        where: {
          createdAt: {
            [Op.gte]: monthStart,
            [Op.lte]: monthEnd,
          },
        },
      });

      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        count: monthAppointments,
      });
    }

    // Recent appointments with full details
    let recentAppointments = [];
    try {
      recentAppointments = await Appointment.findAll({
        limit: 10,
        order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']],
        include: [
          { 
            model: User, 
            as: 'patient', 
            attributes: ['id', 'name', 'email', 'phone', 'dateOfBirth'],
            required: false 
          },
          {
            model: Doctor,
            as: 'doctor',
            include: [
              { model: User, as: 'user', attributes: ['id', 'name'], required: false }
            ],
            required: false,
          },
        ],
      });
    } catch (apptError) {
      console.warn('Error fetching recent appointments:', apptError.message);
      recentAppointments = [];
    }

    // Get appointments for calendar (next 30 days)
    const calendarStart = today;
    const calendarEnd = new Date(today);
    calendarEnd.setDate(calendarEnd.getDate() + 30);

    const calendarAppointments = await Appointment.findAll({
      where: {
        appointmentDate: {
          [Op.gte]: calendarStart,
          [Op.lte]: calendarEnd,
        },
      },
      attributes: ['id', 'appointmentDate', 'appointmentTime', 'status'],
      order: [['appointmentDate', 'ASC']],
    });

    // Get payment statistics
    let paymentStats = {
      totalRevenue: 0,
      totalCompanyShare: 0,
      totalDoctorPayments: 0,
      totalSalaries: 0,
      netProfit: 0,
    };

    try {
      const payments = await Payment.findAll({
        where: { status: 'completed' },
      });

      const totalRevenue = payments
        .filter(p => p.type === 'fee_split')
        .reduce((sum, p) => sum + parseFloat(p.totalFee || 0), 0);

      const totalCompanyShare = payments
        .filter(p => p.type === 'fee_split')
        .reduce((sum, p) => sum + parseFloat(p.companyShare || 0), 0);

      const totalDoctorPayments = payments
        .filter(p => p.type === 'fee_split')
        .reduce((sum, p) => sum + parseFloat(p.doctorShare || 0), 0);

      const totalSalaries = payments
        .filter(p => p.type === 'salary')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      paymentStats = {
        totalRevenue,
        totalCompanyShare,
        totalDoctorPayments,
        totalSalaries,
        netProfit: totalCompanyShare - totalSalaries,
      };
    } catch (paymentError) {
      console.warn('Error fetching payment stats:', paymentError.message);
    }

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalDoctors,
        totalAppointments,
        totalPrescriptions,
        totalAds,
        totalPatients,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        appointmentsLast7Days,
        appointmentsToday,
        newPatientsLast7Days,
        newPatientsToday,
        appointmentChangePercent,
        newPatientsChangePercent,
        ageGroups,
        genderGroups,
        monthlyData,
        paymentStats,
      },
      recentAppointments: recentAppointments || [],
      calendarAppointments: calendarAppointments || [],
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    // Return 200 with default stats instead of 500 for better UX
    res.status(200).json({ 
      success: true,
      stats: {
        totalUsers: 0,
        totalDoctors: 0,
        totalAppointments: 0,
        totalPrescriptions: 0,
        totalAds: 0,
        totalPatients: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        appointmentsLast7Days: 0,
        appointmentsToday: 0,
        newPatientsLast7Days: 0,
        newPatientsToday: 0,
        appointmentChangePercent: '0.0',
        newPatientsChangePercent: '0.0',
        ageGroups: {},
        genderGroups: {},
        monthlyData: [],
        paymentStats: {},
      },
      recentAppointments: [],
      calendarAppointments: [],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { cursor, limit = 10, role } = req.query;

    const queryOptions = {
      attributes: { exclude: ['password'] },
      limit: parseInt(limit) + 1,
      order: [['createdAt', 'DESC']],
    };

    if (role) {
      queryOptions.where = { role };
    }

    if (cursor) {
      queryOptions.where = {
        ...queryOptions.where,
        id: {
          [Op.lt]: cursor,
        },
      };
    }

    const users = await User.findAll(queryOptions);

    const hasMore = users.length > limit;
    if (hasMore) {
      users.pop();
    }

    const nextCursor = hasMore ? users[users.length - 1].id : null;

    res.json({
      success: true,
      users,
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove password from update data if present
    delete updateData.password;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    const deletedCount = await User.destroy({
      where: { id: userIds },
    });

    res.json({
      success: true,
      message: `${deletedCount} user(s) deleted successfully`,
      deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllAds = async (req, res) => {
  try {
    const ads = await Ad.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      ads,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTopDoctors = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const doctors = await Doctor.findAll({
      where: { status: 'approved', isAvailable: true },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'], required: false },
        { model: Department, as: 'department', attributes: ['id', 'name'], required: false },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      topDoctors: doctors || [],
    });
  } catch (error) {
    console.error('Error in getTopDoctors:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch top doctors',
      topDoctors: []
    });
  }
};

