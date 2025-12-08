import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Staff from '../models/Staff.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// Get all payments
export const getAllPayments = async (req, res) => {
  try {
    const { type, month, status } = req.query;

    const whereClause = {};
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (month) whereClause.paymentMonth = month;

    const payments = await Payment.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'appointmentDate', 'appointmentTime', 'status'], // Removed optional fee fields
          required: false,
          include: [
            {
              model: User,
              as: 'patient',
              attributes: ['id', 'name', 'email'],
              required: false,
            },
            {
              model: Doctor,
              as: 'doctor',
              attributes: ['id'],
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'name'],
                  required: false,
                },
              ],
              required: false,
            },
          ],
        },
        {
          model: Doctor,
          as: 'doctor',
          attributes: ['id'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name'],
            },
          ],
          required: false,
        },
      ],
      order: [['paymentDate', 'DESC']],
    });

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message,
    });
  }
};

// Pay salary to staff/doctor
export const paySalary = async (req, res) => {
  try {
    const { recipientId, amount, paymentMonth, notes } = req.body;

    if (!recipientId || !amount || !paymentMonth) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID, amount, and payment month are required',
      });
    }

    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found',
      });
    }

    // Check if salary already paid for this month
    const existingPayment = await Payment.findOne({
      where: {
        recipientId,
        type: 'salary',
        paymentMonth,
        status: 'completed',
      },
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Salary already paid for this month',
      });
    }

    const payment = await Payment.create({
      type: 'salary',
      recipientId,
      amount: parseFloat(amount),
      paymentMonth,
      paymentDate: new Date(),
      status: 'completed',
      notes: notes || null,
    });

    const paymentWithDetails = await Payment.findByPk(payment.id, {
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Salary paid successfully',
      payment: paymentWithDetails,
    });
  } catch (error) {
    console.error('Error paying salary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pay salary',
      error: error.message,
    });
  }
};

// Process fee split when appointment is completed
export const processFeeSplit = async (appointmentId, consultationFee) => {
  try {
    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        {
          model: Doctor,
          as: 'doctor',
          include: [{ model: User, as: 'user' }],
        },
      ],
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const fee = parseFloat(consultationFee);
    const doctorShare = fee * 0.7; // 70% to doctor
    const companyShare = fee * 0.3; // 30% to company

    // Update appointment with fee information (only if columns exist)
    // Use raw SQL to safely update only if columns exist
    try {
      await sequelize.query(
        `UPDATE appointments 
         SET consultation_fee = :fee, 
             doctor_share = :doctorShare, 
             company_share = :companyShare, 
             fee_paid = true 
         WHERE id = :appointmentId`,
        {
          replacements: { 
            fee, 
            doctorShare, 
            companyShare, 
            appointmentId: appointment.id 
          },
          type: sequelize.QueryTypes.UPDATE,
        }
      );
    } catch (updateError) {
      // If columns don't exist, continue without updating fee fields
      console.log('Fee fields not available in database, skipping fee update:', updateError.message);
    }

    // Create payment record for doctor share
    const payment = await Payment.create({
      type: 'fee_split',
      recipientId: appointment.doctor.userId,
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      amount: doctorShare,
      doctorShare,
      companyShare,
      totalFee: fee,
      paymentDate: new Date(),
      status: 'completed',
    });

    // Update appointment with payment reference (only if column exists)
    try {
      await sequelize.query(
        `UPDATE appointments 
         SET payment_id = :paymentId 
         WHERE id = :appointmentId`,
        {
          replacements: { 
            paymentId: payment.id, 
            appointmentId: appointment.id 
          },
          type: sequelize.QueryTypes.UPDATE,
        }
      );
    } catch (updateError) {
      console.log('Payment ID field not available in database, skipping payment reference update:', updateError.message);
    }

    return {
      success: true,
      payment,
      doctorShare,
      companyShare,
    };
  } catch (error) {
    console.error('Error processing fee split:', error);
    throw error;
  }
};

// Get payment statistics
export const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause = { status: 'completed' };
    if (startDate && endDate) {
      whereClause.paymentDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const payments = await Payment.findAll({
      where: whereClause,
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

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalCompanyShare,
        totalDoctorPayments,
        totalSalaries,
        netProfit: totalCompanyShare - totalSalaries,
      },
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics',
      error: error.message,
    });
  }
};

