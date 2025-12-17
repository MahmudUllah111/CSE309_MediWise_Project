import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Doctor from './Doctor.js';
import Appointment from './Appointment.js';

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Payment type: salary for staff, fee_split for doctor fee, refund for refunds',
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    comment: 'User who receives the payment (doctor, staff, etc.)',
  },
  appointmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Appointment,
      key: 'id',
    },
    comment: 'Associated appointment (for fee splits)',
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Doctor,
      key: 'id',
    },
    comment: 'Doctor ID (for fee splits)',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Payment amount',
  },
  doctorShare: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Doctor share (70% of fee)',
  },
  companyShare: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Company share (30% of fee)',
  },
  totalFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Total consultation fee',
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  paymentMonth: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Month for salary payments (YYYY-MM format)',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'payments',
  timestamps: true,
});

Payment.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
Payment.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Payment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

export default Payment;

