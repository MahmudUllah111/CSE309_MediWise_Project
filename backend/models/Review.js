import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Doctor from './Doctor.js';

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Doctor,
      key: 'id',
    },
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'reviews',
  timestamps: true,
});

Review.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
Review.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

export default Review;

