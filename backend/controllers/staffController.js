import Staff from '../models/Staff.js';
import User from '../models/User.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

// Get all staff members
export const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'role'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff',
      error: error.message,
    });
  }
};

// Create staff member
export const createStaff = async (req, res) => {
  try {
    const { name, email, password, phone, position, department, salary, joiningDate } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create user with staff role
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || null,
      role: 'staff',
    });

    // Create staff record
    const staff = await Staff.create({
      userId: user.id,
      position: position || null,
      department: department || null,
      salary: salary ? parseFloat(salary) : 0,
      joiningDate: joiningDate || new Date(),
      status: 'active',
    });

    const staffWithUser = await Staff.findByPk(staff.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'role'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      staff: staffWithUser,
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff member',
      error: error.message,
    });
  }
};

// Update staff member
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, position, department, salary, status, joiningDate } = req.body;

    const staff = await Staff.findByPk(id, {
      include: [{ model: User, as: 'user' }],
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    // Update user info
    if (name || email || phone) {
      await staff.user.update({
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
      });
    }

    // Update staff info
    await staff.update({
      ...(position && { position }),
      ...(department && { department }),
      ...(salary !== undefined && { salary: parseFloat(salary) }),
      ...(status && { status }),
      ...(joiningDate && { joiningDate }),
    });

    const updatedStaff = await Staff.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'role'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      staff: updatedStaff,
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff member',
      error: error.message,
    });
  }
};

// Delete staff member
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByPk(id, {
      include: [{ model: User, as: 'user' }],
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    const userId = staff.userId;

    // Delete staff record
    await staff.destroy();

    // Delete user account
    await User.destroy({ where: { id: userId } });

    res.json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff member',
      error: error.message,
    });
  }
};

