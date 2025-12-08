import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Department from '../models/Department.js';

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, dateOfBirth } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Clean up empty strings and invalid dates
    const cleanedDateOfBirth = dateOfBirth && dateOfBirth.trim() !== '' && dateOfBirth !== 'Invalid date' 
      ? dateOfBirth 
      : null;
    const cleanedAddress = address && address.trim() !== '' ? address : null;
    const cleanedPhone = phone && phone.trim() !== '' ? phone : null;

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'patient',
      phone: cleanedPhone,
      address: cleanedAddress,
      dateOfBirth: cleanedDateOfBirth,
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user has a valid password hash
    if (!user.password) {
      console.error(`User ${user.id} has no password set`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    try {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    let doctorInfo = null;
    if (user.role === 'doctor') {
      try {
        const doctor = await Doctor.findOne({
          where: { userId: user.id },
          include: [{ model: Department, as: 'department' }],
        });
        doctorInfo = doctor;
      } catch (err) {
        console.error('Error fetching doctor info:', err);
        // Continue without doctor info if there's an error
      }
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      doctor: doctorInfo,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    let doctorInfo = null;
    if (user.role === 'doctor') {
      doctorInfo = await Doctor.findOne({
        where: { userId: user.id },
        include: [{ association: 'department' }],
      });
    }

    res.json({
      success: true,
      user,
      doctor: doctorInfo,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

