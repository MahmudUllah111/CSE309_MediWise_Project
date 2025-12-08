import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Staff = sequelize.define('Staff', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    unique: true,
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Job position/title (e.g., Receptionist, Nurse, Accountant)',
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Department where staff works',
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Monthly salary',
  },
  joiningDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'on_leave'),
    defaultValue: 'active',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'staff',
  timestamps: true,
});

Staff.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Staff;

