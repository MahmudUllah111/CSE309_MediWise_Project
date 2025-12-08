import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship'),
    allowNull: false,
    defaultValue: 'full-time',
  },
  department: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  salary: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  applicationDeadline: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  postedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
}, {
  tableName: 'jobs',
  timestamps: true,
});

// Associations
Job.belongsTo(User, { foreignKey: 'postedBy', as: 'poster' });

export default Job;