import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'patient',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  weight: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  height: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  homePhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  workPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  allergies: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
  },
  bloodPressure: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pulse: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profileImage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Base64 encoded profile image',
  },
  profileImageMimeType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'MIME type of profile image (e.g., image/jpeg, image/png)',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true, // Use snake_case for timestamp columns (created_at, updated_at)
  hooks: {
    beforeCreate: async (user) => {
      // Normalize email to lowercase
      if (user.email) {
        user.email = user.email.toLowerCase().trim();
      }
      // Hash password
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      // Normalize email to lowercase if changed
      if (user.changed('email') && user.email) {
        user.email = user.email.toLowerCase().trim();
      }
      // Hash password if changed
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
  },
});

User.prototype.comparePassword = async function(candidatePassword) {
  try {
    // Check if password exists and is valid
    if (!this.password) {
      console.error('User password is missing');
      return false;
    }
    
    // Check if candidate password is provided
    if (!candidatePassword || typeof candidatePassword !== 'string') {
      console.error('Invalid candidate password provided');
      return false;
    }
    
    // Check if stored password is a valid bcrypt hash (starts with $2a$, $2b$, or $2y$)
    if (!this.password.startsWith('$2')) {
      console.error('Stored password is not a valid bcrypt hash');
      return false;
    }
    
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparing password:', error.message);
    return false;
  }
};

export default User;
