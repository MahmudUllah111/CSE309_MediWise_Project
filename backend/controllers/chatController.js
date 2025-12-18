import { Op, Sequelize } from 'sequelize';
import sequelize from '../config/database.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';

// Get all users that can be chatted with (patients for doctors, doctors/admins for patients)
export const getChatUsers = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized',
        users: []
      });
    }
    
    const userId = req.user.id;
    const { role } = req.user;

    let users = [];
    
    if (role === 'doctor') {
      // Doctors can chat only with their own patients (patients who have appointments with this doctor)
      const doctor = await Doctor.findOne({ where: { userId } });
      if (!doctor) {
        console.log('❌ Doctor profile not found for user:', userId);
        return res.json({ success: true, users: [] });
      }

      console.log('🔍 Doctor found:', doctor.id, 'Fetching patients with appointments...');

      // Use raw SQL to get distinct patient IDs who have appointments with this doctor
      // This ensures we get patients regardless of appointment status
      const appointmentRows = await sequelize.query(`
        SELECT DISTINCT patient_id
        FROM appointments
        WHERE doctor_id::text = :doctorId::text
        AND patient_id IS NOT NULL
      `, {
        replacements: { doctorId: String(doctor.id).trim() },
        type: sequelize.QueryTypes.SELECT,
      });

      console.log('📋 Appointment rows found:', appointmentRows?.length || 0);

      const patientIds = appointmentRows && Array.isArray(appointmentRows)
        ? [...new Set(appointmentRows.map((row) => row.patient_id).filter(Boolean))]
        : [];

      console.log('👥 Unique patient IDs:', patientIds.length, patientIds);

      if (patientIds.length === 0) {
        console.log('⚠️  No patients found with appointments for this doctor');
        // Still return admins even if no patients
        const admins = await User.findAll({
          where: { role: 'admin' },
          attributes: ['id', 'name', 'email', 'role', 'phone'],
          order: [['name', 'ASC']],
        });
        return res.json({ success: true, users: admins || [] });
      }

      // Get all patients who have appointments with this doctor
      const patients = await User.findAll({
        where: {
          id: { [Op.in]: patientIds },
          role: 'patient',
        },
        attributes: ['id', 'name', 'email', 'role', 'phone'],
        order: [['name', 'ASC']],
      });

      console.log('✅ Patients found:', patients.length);
      
      // Also get all admins - doctors can always chat with admins
      const admins = await User.findAll({
        where: {
          role: 'admin',
        },
        attributes: ['id', 'name', 'email', 'role', 'phone'],
        order: [['name', 'ASC']],
      });
      
      // Combine patients and admins
      users = [...patients, ...admins];
      console.log('📊 Total users for doctor:', users.length, '(patients:', patients.length, ', admins:', admins.length, ')');
    } else if (role === 'patient') {
      // Patients can chat only with doctors whose appointments status is "completed"
      // and admins
      
      // Get all appointments for this patient that are completed
      const appointments = await Appointment.findAll({
        where: {
          patientId: userId,
          status: 'completed',
        },
        include: [
          {
            model: Doctor,
            as: 'doctor',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'role', 'phone'],
              },
            ],
          },
        ],
      });

      // Extract doctor user IDs from appointments
      const doctorUserIds = appointments
        .map((apt) => apt.doctor?.user?.id)
        .filter(Boolean);

      // Get all doctors who have completed appointments with this patient
      const doctors = await User.findAll({
        where: {
          id: { [Op.in]: doctorUserIds },
          role: 'doctor',
        },
        attributes: ['id', 'name', 'email', 'role', 'phone'],
        order: [['name', 'ASC']],
      });
      
      // Also get all admins - patients can always chat with admins
      const admins = await User.findAll({
        where: {
          role: 'admin',
        },
        attributes: ['id', 'name', 'email', 'role', 'phone'],
        order: [['name', 'ASC']],
      });
      
      // Combine doctors and admins
      users = [...doctors, ...admins];
    } else if (role === 'admin') {
      // Admins can chat with all users (patients and doctors) - full access
      users = await User.findAll({
        where: {
          role: { [Op.in]: ['patient', 'doctor'] },
        },
        attributes: ['id', 'name', 'email', 'role', 'phone'],
        order: [['name', 'ASC']],
      });
    }

    // Get unread counts for each user
    let unreadMap = {};
    try {
      const unreadCounts = await Message.findAll({
        where: {
          receiverId: userId,
          isRead: false,
        },
        attributes: ['senderId', [Message.sequelize.fn('COUNT', Message.sequelize.col('id')), 'count']],
        group: ['senderId'],
        raw: true,
      });

      unreadCounts.forEach((item) => {
        if (item && item.senderId) {
          unreadMap[item.senderId] = parseInt(item.count) || 0;
        }
      });
    } catch (unreadError) {
      console.error('Error fetching unread counts:', unreadError);
      // Continue with empty unreadMap
    }

    // Get last message for each user
    let lastMessageMap = {};
    try {
      const lastMessages = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
        include: [
          { model: User, as: 'sender', attributes: ['id'], required: false },
          { model: User, as: 'receiver', attributes: ['id'], required: false },
        ],
        order: [['createdAt', 'DESC']],
        limit: 100, // Limit to prevent too many queries
      });

      lastMessages.forEach((msg) => {
        if (msg) {
          const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
          if (partnerId && !lastMessageMap[partnerId]) {
            lastMessageMap[partnerId] = {
              content: msg.content || 'No messages yet',
              time: msg.createdAt || new Date(),
            };
          }
        }
      });
    } catch (lastMessageError) {
      console.error('Error fetching last messages:', lastMessageError);
      // Continue with empty lastMessageMap
    }

    // Combine users with unread counts and last messages
    const usersWithDetails = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      unreadCount: unreadMap[user.id] || 0,
      lastMessage: lastMessageMap[user.id]?.content || 'No messages yet',
      lastMessageTime: lastMessageMap[user.id]?.time || new Date(),
    }));

    res.json({
      success: true,
      users: usersWithDetails,
    });
  } catch (error) {
    console.error('Error fetching chat users:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    // Return empty array instead of 500 error for better UX
    res.status(200).json({ 
      success: true,
      users: [],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized',
        conversations: []
      });
    }
    
    const userId = req.user.id;
    const { role } = req.user;

    // Get all unique users that have sent or received messages from this user
    // Order by createdAt DESC to get newest messages first
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email', 'role', 'phone'], required: false },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'email', 'role', 'phone'], required: false },
      ],
      order: [['createdAt', 'DESC']], // Newest messages first
      limit: 1000, // Limit to prevent too many queries
    });
    
    console.log('📨 Total messages fetched:', messages.length);
    if (messages.length > 0) {
      console.log('📨 First message (newest):', {
        content: messages[0].content?.substring(0, 30),
        createdAt: messages[0].createdAt,
        senderId: messages[0].senderId,
        receiverId: messages[0].receiverId
      });
      console.log('📨 Last message (oldest):', {
        content: messages[messages.length - 1].content?.substring(0, 30),
        createdAt: messages[messages.length - 1].createdAt,
        senderId: messages[messages.length - 1].senderId,
        receiverId: messages[messages.length - 1].receiverId
      });
    }

    // If patient, get list of doctors with completed appointments OR doctors who have sent messages
    let allowedDoctorUserIds = [];
    if (role === 'patient') {
      // Get doctors with completed appointments
      const appointments = await Appointment.findAll({
        where: {
          patientId: userId,
          status: 'completed',
        },
        include: [
          {
            model: Doctor,
            as: 'doctor',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id'],
              },
            ],
          },
        ],
      });
      allowedDoctorUserIds = appointments
        .map((apt) => apt.doctor?.user?.id)
        .filter(Boolean);
      
      // ALSO include doctors who have sent messages to this patient (even without completed appointment)
      // This allows patients to see conversations with doctors who initiated contact
      try {
        const doctorMessages = await Message.findAll({
          where: {
            receiverId: userId,
          },
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'role'],
              required: true,
            },
          ],
        });
        
        // Filter to get only doctors and extract unique sender IDs
        const doctorIdsFromMessages = doctorMessages
          .filter((msg) => msg.sender && msg.sender.role === 'doctor')
          .map((msg) => msg.senderId || msg.sender?.id)
          .filter(Boolean);
        
        // Combine both lists
        allowedDoctorUserIds = [...new Set([...allowedDoctorUserIds, ...doctorIdsFromMessages])];
      } catch (error) {
        console.error('Error fetching doctors who messaged:', error);
        // Continue with just appointments-based doctors if this fails
      }
      
      console.log('Patient allowed doctor IDs:', allowedDoctorUserIds);
    }

    // Group by conversation partner
    const conversationsMap = new Map();
    
    messages.forEach((msg) => {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      
      if (!partner) {
        console.warn('Message has no partner:', msg.id);
        return;
      }
      
      // For admins: Show all conversations (patients and doctors) - full access
      if (role === 'admin') {
        // Allow all conversations - no restrictions
      }
      
      // For patients: Include admins (always allowed) and doctors who have sent messages OR have completed appointments
      if (role === 'patient') {
        if (partner.role === 'doctor') {
          if (!allowedDoctorUserIds.includes(partnerId)) {
            console.log(`Skipping conversation with doctor ${partnerId} - not in allowed list`);
            return; // Skip this conversation
          }
        } else if (partner.role === 'admin') {
          // Allow admin conversations - no restrictions
          // Continue to add admin to conversations
        } else if (partner.role === 'patient') {
          // Patient cannot chat with other patients
          return;
        }
      }
      
      // For doctors: Include admins (always allowed) and patients
      if (role === 'doctor') {
        if (partner.role === 'admin') {
          // Allow admin conversations - no restrictions
          // Continue to add admin to conversations
        } else if (partner.role === 'patient') {
          // Doctors can chat with patients - implicit allow
        } else if (partner.role === 'doctor') {
          // Doctors cannot chat with other doctors
          return;
        }
      }
      
      if (!conversationsMap.has(partnerId)) {
        // Get unread count for this conversation
        const unreadCount = messages.filter(
          (m) => 
            ((m.senderId === partnerId && m.receiverId === userId) || 
             (m.senderId === userId && m.receiverId === partnerId)) &&
            !m.isRead && m.receiverId === userId
        ).length;

        // Get the most recent message for this conversation
        // Since messages are already sorted DESC, first matching message is the latest
        const latestMessage = messages.find(
          (m) => 
            (m.senderId === partnerId && m.receiverId === userId) || 
            (m.senderId === userId && m.receiverId === partnerId)
        );

        conversationsMap.set(partnerId, {
          id: partnerId,
          name: partner.name,
          email: partner.email,
          role: partner.role,
          phone: partner.phone || null,
          lastMessage: latestMessage?.content || msg.content,
          lastMessageTime: latestMessage?.createdAt || msg.createdAt,
          unreadCount,
          avatar: partner.role === 'doctor' ? null : null, // Can be extended
        });
      } else {
        // Update existing conversation - find the latest message for this conversation
        const existing = conversationsMap.get(partnerId);
        const latestMessageForConv = messages.find(
          (m) => 
            (m.senderId === partnerId && m.receiverId === userId) || 
            (m.senderId === userId && m.receiverId === partnerId)
        );
        
        if (latestMessageForConv) {
          const latestTime = new Date(latestMessageForConv.createdAt).getTime();
          const existingTime = existing.lastMessageTime ? new Date(existing.lastMessageTime).getTime() : 0;
          
          // Update if this message is newer
          if (latestTime > existingTime) {
            existing.lastMessage = latestMessageForConv.content;
            existing.lastMessageTime = latestMessageForConv.createdAt;
            // Update unread count
            const unreadCount = messages.filter(
              (m) => 
                ((m.senderId === partnerId && m.receiverId === userId) || 
                 (m.senderId === userId && m.receiverId === partnerId)) &&
                !m.isRead && m.receiverId === userId
            ).length;
            existing.unreadCount = unreadCount;
          }
        }
      }
    });

    const conversations = Array.from(conversationsMap.values());
    
    // Sort by last message time (newest first) - handle null/undefined properly
    conversations.sort((a, b) => {
      try {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA; // Newest first (larger timestamp = more recent)
      } catch (err) {
        console.error('Error sorting conversations:', err, { a: a.name, b: b.name });
        return 0; // Keep original order on error
      }
    });
    
    console.log('📊 Backend sorted conversations:', conversations.map(c => ({
      name: c.name,
      lastMessageTime: c.lastMessageTime,
      timestamp: c.lastMessageTime ? new Date(c.lastMessageTime).getTime() : 0
    })));

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    // Return empty array instead of 500 error for better UX
    res.status(200).json({ 
      success: true,
      conversations: [],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get messages between two users
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { role } = req.user;

    // If patient is trying to view messages, verify access
    if (role === 'patient') {
      const receiver = await User.findByPk(userId);
      if (receiver && receiver.role === 'doctor') {
        // Check if patient has a completed appointment with this doctor
        const doctor = await Doctor.findOne({ where: { userId } });
        if (doctor) {
          const appointment = await Appointment.findOne({
            where: {
              patientId: currentUserId,
              doctorId: doctor.id,
              status: 'completed',
            },
          });

          if (!appointment) {
            return res.status(403).json({ 
              message: 'You can only view messages with doctors with whom you have completed appointments.' 
            });
          }
        }
      } else if (receiver && receiver.role === 'admin') {
        // Patients can always view messages with admins - no restrictions
        // Allow the request to proceed
      }
    }

    // Use raw SQL to fetch messages reliably
    console.log('=== Fetching messages with raw SQL ===');
    console.log('Current user:', currentUserId, 'Other user:', userId);
    
    const messagesRows = await sequelize.query(`
      SELECT 
        m.id,
        m."senderId" as "senderId",
        m."receiverId" as "receiverId",
        m.content,
        m."isRead",
        m."readAt",
        m."createdAt",
        m."updatedAt",
        s.id as "sender.id",
        s.name as "sender.name",
        s.email as "sender.email",
        s.role as "sender.role",
        s.phone as "sender.phone",
        r.id as "receiver.id",
        r.name as "receiver.name",
        r.email as "receiver.email",
        r.role as "receiver.role",
        r.phone as "receiver.phone"
      FROM messages m
      LEFT JOIN users s ON m."senderId"::text = s.id::text
      LEFT JOIN users r ON m."receiverId"::text = r.id::text
      WHERE (m."senderId"::text = :currentUserId::text AND m."receiverId"::text = :userId::text)
         OR (m."senderId"::text = :userId::text AND m."receiverId"::text = :currentUserId::text)
      ORDER BY m."createdAt" ASC;
    `, {
      replacements: { 
        currentUserId: String(currentUserId).trim(),
        userId: String(userId).trim()
      },
      type: sequelize.QueryTypes.SELECT,
    });

    console.log('📨 Messages fetched from database:', messagesRows?.length || 0);

    // Transform to expected format
    const messages = (messagesRows || []).map((row) => ({
      id: row.id,
      senderId: row.senderId,
      receiverId: row.receiverId,
      content: row.content,
      isRead: row.isRead,
      readAt: row.readAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      sender: row['sender.id'] ? {
        id: row['sender.id'],
        name: row['sender.name'],
        email: row['sender.email'],
        role: row['sender.role'],
        phone: row['sender.phone'],
      } : null,
      receiver: row['receiver.id'] ? {
        id: row['receiver.id'],
        name: row['receiver.name'],
        email: row['receiver.email'],
        role: row['receiver.role'],
        phone: row['receiver.phone'],
      } : null,
    }));

    console.log('✅ Transformed messages:', messages.length);

    // Mark messages as read using raw SQL
    try {
      await sequelize.query(`
        UPDATE messages
        SET "isRead" = true, "readAt" = NOW()
        WHERE "senderId"::text = :userId::text
          AND "receiverId"::text = :currentUserId::text
          AND "isRead" = false;
      `, {
        replacements: { 
          userId: String(userId).trim(),
          currentUserId: String(currentUserId).trim()
        },
        type: sequelize.QueryTypes.UPDATE,
      });
      console.log('✅ Marked messages as read');
    } catch (markReadError) {
      console.error('⚠️  Error marking messages as read:', markReadError.message);
      // Continue anyway
    }

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    // If table doesn't exist, return empty array instead of 500
    if (error.message?.includes('relation "messages" does not exist') || 
        error.message?.includes('does not exist')) {
      console.log('⚠️  Messages table does not exist, returning empty array');
      return res.status(200).json({
        success: true,
        messages: [],
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(200).json({
      success: true,
      messages: [],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;
    const { role } = req.user;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }

    if (role === 'patient') {
      const receiver = await User.findByPk(receiverId);
      if (receiver && receiver.role === 'doctor') {
        const doctor = await Doctor.findOne({ where: { userId: receiverId } });
        if (doctor) {
          const appointment = await Appointment.findOne({
            where: {
              patientId: senderId,
              doctorId: doctor.id,
              status: 'completed',
            },
          });

          if (!appointment) {
            return res.status(403).json({ 
              message: 'You can only message doctors with whom you have completed appointments.' 
            });
          }
        }
      }
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      content,
    }, { transaction: t });

    await t.commit();

    const messageWithDetails = await Message.findByPk(newMessage.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'email', 'role'] },
      ],
    });

    res.status(201).json({
      success: true,
      message: messageWithDetails,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.json({
        success: true,
        count: 0,
      });
    }

    const count = await Message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    res.json({
      success: true,
      count: count || 0,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    // Return 0 instead of 500 error for better UX
    res.status(200).json({ 
      success: true,
      count: 0,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



