import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Department from './Department.js';

const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id', // Database uses snake_case
    references: {
      model: User,
      key: 'id',
    },
    unique: true,
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'department_id', // Database uses snake_case
    references: {
      model: Department,
      key: 'id',
    },
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  qualification: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  consultationFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    field: 'consultation_fee', // Database uses snake_case
  },
  availableFrom: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'available_from', // Database uses snake_case
  },
  availableTo: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'available_to', // Database uses snake_case
  },
  availableDays: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'available_days', // Database uses snake_case
    comment: 'Array of available days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]',
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_available', // Database uses snake_case
  },
  dailyAppointmentLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 18,
    allowNull: false,
    field: 'daily_appointment_limit', // Database uses snake_case
  },
  appointmentDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    field: 'appointment_duration', // Database uses snake_case
    comment: 'Appointment duration in minutes',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    allowNull: false,
  },
  cvResume: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cv_resume', // Database uses snake_case
    comment: 'Base64 encoded CV/Resume file content',
  },
  cvResumeFileName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'cv_resume_file_name', // Database uses snake_case
    comment: 'Original filename of CV/Resume',
  },
  cvResumeMimeType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'cv_resume_mime_type', // Database uses snake_case
    comment: 'MIME type of CV/Resume file (e.g., application/pdf)',
  },
  profileImage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'profile_image', // Database uses snake_case
    comment: 'Base64 encoded profile image',
  },
  profileImageMimeType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'profile_image_mime_type', // Database uses snake_case
    comment: 'MIME type of profile image (e.g., image/jpeg, image/png)',
  },
  previousJobs: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'previous_jobs', // Database uses snake_case
    comment: 'Array of previous job positions',
  },
  education: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of educational qualifications',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin notes for approval/rejection',
  },
}, {
  tableName: 'doctors',
  timestamps: true,
  underscored: true, // Use snake_case for timestamp columns
});

Doctor.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Doctor.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

export default Doctor;
