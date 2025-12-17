import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Doctor from './Doctor.js';

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'patient_id', // Database uses snake_case
    references: {
      model: User,
      key: 'id',
    },
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'doctor_id', // Database uses snake_case
    references: {
      model: Doctor,
      key: 'id',
    },
  },
  appointmentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'appointment_date', // Database uses snake_case
  },
  appointmentTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'appointment_time', // Database uses snake_case
  },
  dateTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'date_time', // Combined date and time column
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Optional fields - only define if columns exist in database
  // consultationFee, doctorShare, companyShare, feePaid, paymentId
  // These are commented out to avoid column errors
}, {
  tableName: 'appointments',
  timestamps: true,
  underscored: true, // Database uses snake_case for columns
});

Appointment.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

export default Appointment;

