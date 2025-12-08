import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Blog = sequelize.define('Blog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('tags');
      if (!value) return [];
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('tags', JSON.stringify(value));
    },
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  comments: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'author_id', // Database uses snake_case
    references: {
      model: User,
      key: 'id',
    },
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'approved_by', // Database uses snake_case
    references: {
      model: User,
      key: 'id',
    },
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'approved_at', // Database uses snake_case
  },
}, {
  tableName: 'blogs',
  timestamps: true,
  underscored: true, // Use snake_case for timestamp columns
  createdAt: 'created_at', // Explicit mapping
  updatedAt: 'updated_at', // Explicit mapping
});

// Associations
Blog.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
Blog.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

export default Blog;

