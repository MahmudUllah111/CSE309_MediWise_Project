import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Doctor from './Doctor.js';

const PrescriptionTemplate = sequelize.define('PrescriptionTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Doctor,
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Untitled Template',
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  medicines: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tests: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rules: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  advice: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  followUp: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'prescription_templates',
  timestamps: true,
});

PrescriptionTemplate.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

export default PrescriptionTemplate;











