import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Get database configuration from environment variables
const DB_NAME = process.env.DB_NAME || 'mediwise';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

const sequelize = new Sequelize(
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true, // Use snake_case for database columns (matches model field mappings)
    },
    dialectOptions: {
      connectTimeout: 30000, // 30 seconds
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000, // 60 seconds
      idle: 10000
    },
    retry: {
      max: 5,
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNREFUSED/,
        /ECONNRESET/,
        /ETIMEDOUT/,
        /ESOCKETTIMEDOUT/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ]
    }
  }
);

export default sequelize;

