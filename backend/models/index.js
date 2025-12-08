import sequelize from '../config/database.js';
import User from './User.js';
import Department from './Department.js';
import Doctor from './Doctor.js';
import Appointment from './Appointment.js';
import Prescription from './Prescription.js';
import PrescriptionTemplate from './PrescriptionTemplate.js';
import Ad from './Ad.js';
import Review from './Review.js';
import Message from './Message.js';
import Job from './Job.js';
import Blog from './Blog.js';
import JobApplication from './JobApplication.js';
import Staff from './Staff.js';
import Payment from './Payment.js';

const models = {
  User,
  Department,
  Doctor,
  Appointment,
  Prescription,
  PrescriptionTemplate,
  Ad,
  Review,
  Message,
  Job,
  Blog,
  JobApplication,
  Staff,
  Payment,
  sequelize,
};

export default models;

export {
  User,
  Department,
  Doctor,
  Appointment,
  Prescription,
  PrescriptionTemplate,
  Ad,
  Review,
  Message,
  Job,
  Blog,
  JobApplication,
  Staff,
  Payment,
  sequelize,
};
