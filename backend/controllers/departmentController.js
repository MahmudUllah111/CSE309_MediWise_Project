import Department from '../models/Department.js';

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      departments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const department = await Department.create(req.body);

    res.status(201).json({
      success: true,
      department,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

