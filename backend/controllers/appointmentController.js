import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Message from '../models/Message.js';
import { processFeeSplit } from './paymentController.js';

export const createAppointment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { doctorId, appointmentDate, appointmentTime, reason } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'Authentication required. Please log in to book an appointment.' 
      });
    }

    if (req.user.role !== 'patient') {
      return res.status(403).json({ 
        message: 'Only patients can book appointments.' 
      });
    }

    const patientId = req.user.id;

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ 
        message: 'Missing required fields: doctorId, appointmentDate, and appointmentTime are required.' 
      });
    }
    
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found.' });
    }

    const dateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    if (isNaN(dateTime.getTime())) {
      return res.status(400).json({ 
        message: 'Invalid date or time format.' 
      });
    }

    const newAppointment = await Appointment.create({
      patientId: patientId,
      doctorId: doctorId,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      dateTime: dateTime,
      reason: reason,
      status: 'pending',
    }, { transaction: t });

    await t.commit();

    const appointmentWithDetails = await Appointment.findByPk(newAppointment.id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'name', 'email', 'phone'] },
        {
          model: Doctor,
          as: 'doctor',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      appointment: appointmentWithDetails,
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ Error in createAppointment:', error);
    res.status(500).json({ 
      message: 'Failed to create appointment. Please try again.',
      error: error.message
    });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const { cursor, limit = 10, status, doctorId } = req.query;
    
    console.log('=== getAppointments called ===');
    console.log('User:', req.user?.id, 'Role:', req.user?.role);
    console.log('Query params:', { cursor, limit, status, doctorId });
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { role } = req.user;

    // Use raw SQL for reliable appointment fetching (real-time from database)
    // Database uses snake_case: patient_id, doctor_id, etc.
    let sqlQuery = `
      SELECT 
        a.id,
        a.patient_id as "patientId",
        a.doctor_id as "doctorId",
        a.appointment_date as "appointmentDate",
        a.appointment_time as "appointmentTime",
        a.date_time as "dateTime",
        a.reason,
        a.status,
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        u.id as "patient.id",
        u.name as "patient.name",
        u.email as "patient.email",
        u.phone as "patient.phone",
        d.id as "doctor.id",
        d.specialization as "doctor.specialization",
        du.id as "doctor.user.id",
        du.name as "doctor.user.name",
        dept.id as "doctor.department.id",
        dept.name as "doctor.department.name"
      FROM appointments a
      LEFT JOIN users u ON a.patient_id = u.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE 1=1
    `;
    
    const replacements = {};
    
    // Filter by doctorId
    if (doctorId) {
      sqlQuery += ` AND a.doctor_id = :doctorId`;
      replacements.doctorId = doctorId;
      console.log('Filtering by doctorId:', doctorId);
    } else if (role === 'patient') {
      // Patient sees only their own appointments
      sqlQuery += ` AND a.patient_id = :patientId`;
      replacements.patientId = req.user.id;
      console.log('Filtering by patientId:', req.user.id);
    } else if (role === 'doctor') {
      // Doctor sees only their own appointments
      try {
        const doctorRows = await sequelize.query(`
          SELECT id FROM doctors WHERE user_id = :userId LIMIT 1;
        `, {
          replacements: { userId: req.user.id },
          type: sequelize.QueryTypes.SELECT,
        });
        
        if (doctorRows && Array.isArray(doctorRows) && doctorRows.length > 0 && doctorRows[0].id) {
          const doctorIdFromDb = doctorRows[0].id;
          sqlQuery += ` AND a.doctor_id = :doctorId`;
          replacements.doctorId = doctorIdFromDb;
          console.log('Doctor found, filtering by doctorId:', doctorIdFromDb);
        } else {
          console.log('No doctor profile found for user:', req.user.id);
          return res.json({ success: true, appointments: [], pagination: { hasMore: false, nextCursor: null } });
        }
      } catch (doctorError) {
        console.error('Error finding doctor:', doctorError);
        return res.json({ success: true, appointments: [], pagination: { hasMore: false, nextCursor: null } });
      }
    }
    // Admin sees all appointments (no additional filter)

    if (status) {
      sqlQuery += ` AND a.status = :status`;
      replacements.status = status;
    }

    if (cursor) {
      sqlQuery += ` AND a.id < :cursor`;
      replacements.cursor = cursor;
    }

    sqlQuery += ` ORDER BY a.created_at DESC LIMIT :limitValue`;
    replacements.limitValue = parseInt(limit) + 1;
    
    console.log('Executing appointments SQL query');
    console.log('SQL:', sqlQuery);
    console.log('Replacements:', replacements);
    
    const appointmentRows = await sequelize.query(sqlQuery, {
      replacements: replacements,
      type: sequelize.QueryTypes.SELECT,
    });
    
    console.log(`Found ${appointmentRows.length} appointments`);
    
    // Transform results
    const appointments = appointmentRows.map((row) => {
      const appointment = {
        id: row.id,
        patientId: row.patientId,
        doctorId: row.doctorId,
        appointmentDate: row.appointmentDate,
        appointmentTime: row.appointmentTime,
        dateTime: row.dateTime,
        reason: row.reason,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
      
      if (row['patient.id']) {
        appointment.patient = {
          id: row['patient.id'],
          name: row['patient.name'],
          email: row['patient.email'],
          phone: row['patient.phone'],
        };
      }
      
      if (row['doctor.id']) {
        appointment.doctor = {
          id: row['doctor.id'],
          specialization: row['doctor.specialization'],
          user: row['doctor.user.id'] ? {
            id: row['doctor.user.id'],
            name: row['doctor.user.name'],
          } : null,
          department: row['doctor.department.id'] ? {
            id: row['doctor.department.id'],
            name: row['doctor.department.name'],
          } : null,
        };
      }
      
      return appointment;
    });

    // Check if there are more results
    const hasMore = appointments.length > parseInt(limit);
    if (hasMore) {
      appointments = appointments.slice(0, parseInt(limit));
    }
    
    const nextCursor = hasMore && appointments.length > 0 
      ? appointments[appointments.length - 1].id 
      : null;
    
    console.log(`Returning ${appointments.length} appointments (hasMore: ${hasMore})`);

    res.json({
      success: true,
      appointments: appointments,
      pagination: {
        hasMore: hasMore,
        nextCursor: nextCursor,
      },
    });
  } catch (error) {
    console.error('Error in getAppointments:', error);
    res.status(500).json({ message: error.message });
  }
};

// Note: Old Sequelize-based code removed - now using raw SQL for reliable real-time database access

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const { role } = req.user;
    if (role === 'doctor') {
      const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
      if (doctor && appointment.doctorId !== doctor.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (role === 'patient' && appointment.patientId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If status is being changed to 'completed', process fee split and enable chat
    if (status === 'completed' && appointment.status !== 'completed') {
      const doctor = await Doctor.findByPk(appointment.doctorId, {
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      });
      
      if (doctor && doctor.consultationFee) {
        try {
          await processFeeSplit(appointment.id, doctor.consultationFee);
        } catch (feeError) {
          console.error('Error processing fee split:', feeError);
          // Continue with status update even if fee split fails
        }
      }

      // Enable chat between doctor and patient by creating a welcome message
      // This ensures both users appear in each other's chat lists
      try {
        const patient = await User.findByPk(appointment.patientId);
        const doctorUser = doctor?.user;

        if (patient && doctorUser) {
          // Check if a message already exists between them
          const existingMessage = await Message.findOne({
            where: {
              [Op.or]: [
                { senderId: doctorUser.id, receiverId: patient.id },
                { senderId: patient.id, receiverId: doctorUser.id },
              ],
            },
            limit: 1,
          });

          // If no messages exist, create a welcome message from doctor to patient
          if (!existingMessage) {
            await Message.create({
              senderId: doctorUser.id,
              receiverId: patient.id,
              content: `Hello ${patient.name || 'there'}, your appointment has been completed. Feel free to reach out if you have any questions or concerns.`,
              isRead: false,
            });
            console.log(`✅ Welcome message created: Doctor ${doctorUser.name} -> Patient ${patient.name}`);
          } else {
            console.log(`ℹ️  Messages already exist between doctor and patient - skipping welcome message`);
          }
        }
      } catch (chatError) {
        console.error('Error creating welcome message for chat:', chatError);
        // Continue with status update even if chat setup fails
      }
    }

    await appointment.update({ status });

    const updatedAppointment = await Appointment.findByPk(id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'name', 'email', 'phone'] },
        {
          model: Doctor,
          as: 'doctor',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
        },
      ],
    });

    res.json({
      success: true,
      appointment: updatedAppointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAvailableTimeSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor ID and date are required' });
    }

    // Get doctor information
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if doctor is available
    if (!doctor.isAvailable) {
      return res.json({
        success: true,
        availableSlots: [],
        isLimitReached: false,
        message: 'Doctor is not available',
      });
    }

    // Parse available days
    let availableDays = [];
    if (doctor.availableDays) {
      if (typeof doctor.availableDays === 'string') {
        availableDays = JSON.parse(doctor.availableDays);
      } else {
        availableDays = doctor.availableDays;
      }
    }

    // Check if the requested date is in available days
    const requestedDate = new Date(date);
    const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (!availableDays.includes(dayName)) {
      return res.json({
        success: true,
        availableSlots: [],
        isLimitReached: false,
        message: `Doctor is not available on ${dayName}`,
      });
    }

    // Get doctor's working hours
    const availableFrom = doctor.availableFrom || '09:00:00';
    const availableTo = doctor.availableTo || '17:00:00';
    const appointmentDuration = doctor.appointmentDuration || 30;
    const dailyLimit = doctor.dailyAppointmentLimit || 18;

    // Parse time strings (HH:MM:SS format)
    const parseTime = (timeString) => {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes; // Convert to minutes
    };

    const formatTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    const startMinutes = parseTime(availableFrom);
    const endMinutes = parseTime(availableTo);

    // Generate all possible time slots
    const allSlots = [];
    for (let current = startMinutes; current < endMinutes; current += appointmentDuration) {
      allSlots.push(formatTime(current));
    }

    // Get existing appointments for this doctor on this date
    // Use raw query with snake_case column names (database uses snake_case)
    const existingAppointments = await sequelize.query(
      `SELECT id, appointment_time::text as "appointmentTime", status 
       FROM appointments 
       WHERE doctor_id = :doctorId 
       AND DATE(appointment_date) = DATE(:date)
       AND status IN ('pending', 'confirmed', 'completed')`,
      {
        replacements: { doctorId, date },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Check if daily limit is reached
    if (existingAppointments.length >= dailyLimit) {
      return res.json({
        success: true,
        availableSlots: [],
        isLimitReached: true,
        message: 'Daily appointment limit reached',
      });
    }

    // Extract booked time slots - handle both string and Date objects
    const bookedSlots = new Set(
      existingAppointments.map(apt => {
        const time = apt.appointmentTime;
        // If it's a Date object, format it as HH:MM
        if (time instanceof Date) {
          const hours = String(time.getHours()).padStart(2, '0');
          const minutes = String(time.getMinutes()).padStart(2, '0');
          return `${hours}:${minutes}`;
        }
        // If it's already a string, extract HH:MM format
        if (typeof time === 'string') {
          // Handle formats like "HH:MM:SS" or "HH:MM" or just time string
          const timeMatch = time.match(/^(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            const hours = String(parseInt(timeMatch[1])).padStart(2, '0');
            const minutes = timeMatch[2];
            return `${hours}:${minutes}`;
          }
          return time;
        }
        return String(time);
      })
    );

    // Filter out booked slots - compare in HH:MM format
    const availableSlots = allSlots.filter(slot => {
      const slotTime = slot.substring(0, 5); // Get HH:MM format
      return !bookedSlots.has(slotTime);
    });

    res.json({
      success: true,
      availableSlots,
      isLimitReached: false,
      totalBooked: existingAppointments.length,
      dailyLimit,
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ message: error.message });
  }
};
