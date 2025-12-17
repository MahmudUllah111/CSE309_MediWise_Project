import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Job from './Job.js';

const JobApplication = sequelize.define('JobApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Job,
      key: 'id',
    },
  },
  applicantId: {
    type: DataTypes.UUID,
    allowNull: true, // Allow null for non-logged-in applicants
    references: {
      model: User,
      key: 'id',
    },
  },
  fullName: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(200),
    allowNull: false, // Phone is now mandatory
  },
  resume: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  salaryExpectation: {
    type: DataTypes.STRING(200),
    allowNull: true,
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
  tableName: 'job_applications',
  timestamps: true,
});

// Associations
JobApplication.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
JobApplication.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant' });

export default JobApplication;

