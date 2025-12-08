import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Department from './Department.js';

const Ad = sequelize.define('Ad', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'image_url', // Map to snake_case database column
  },
  link: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  targetAudience: {
    type: DataTypes.ENUM('all', 'patient', 'doctor'),
    defaultValue: 'all',
    field: 'target_audience', // Map to snake_case database column
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active', // Map to snake_case database column
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'start_date', // Map to snake_case database column
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'end_date', // Map to snake_case database column
  },
  clickCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'click_count', // Map to snake_case database column
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'department_id', // Map to snake_case database column
    references: {
      model: 'departments',
      key: 'id',
    },
  },
  medicineName: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'medicine_name', // Map to snake_case database column
  },
  indications: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Diseases/conditions this medicine helps with (e.g., Hypertension, Heart Disease, Angina)',
  },
  isNewMedicine: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_new_medicine', // Map to snake_case database column
  },
}, {
  tableName: 'ads',
  timestamps: true,
  underscored: true, // Use snake_case for timestamp columns (created_at, updated_at)
});

// Associations
Ad.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

export default Ad;

