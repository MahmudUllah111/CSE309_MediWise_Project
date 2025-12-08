import sequelize from './config/database.js';
import models from './models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const seedDoctors = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Get departments
    const departments = await models.Department.findAll();
    if (departments.length === 0) {
      console.log('No departments found. Please run the server first to create departments.');
      process.exit(1);
    }

    // Find or create demo users for doctors
    const demoDoctors = [
      {
        user: {
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@mediwise.com',
          password: 'doctor123',
          role: 'doctor',
          phone: '+1-555-0101',
          address: '123 Medical Center Drive, Health City',
        },
        doctor: {
          specialization: 'Cardiologist',
          experience: 15,
          qualification: 'MBBS, MD (Cardiology), FACC\nBoard Certified in Cardiovascular Medicine',
          bio: 'Dr. Sarah Johnson is a renowned cardiologist with over 15 years of experience in treating heart diseases. She specializes in interventional cardiology and has performed over 2000 successful cardiac procedures.',
          consultationFee: 150.00,
          availableFrom: '09:00',
          availableTo: '17:00',
          isAvailable: true,
        },
        departmentName: 'Cardiology',
      },
      {
        user: {
          name: 'Dr. Michael Chen',
          email: 'michael.chen@mediwise.com',
          password: 'doctor123',
          role: 'doctor',
          phone: '+1-555-0102',
          address: '456 Neurology Lane, Medical District',
        },
        doctor: {
          specialization: 'Neurologist',
          experience: 12,
          qualification: 'MBBS, MD (Neurology), PhD\nFellowship in Stroke Medicine',
          bio: 'Dr. Michael Chen is an expert neurologist specializing in stroke treatment and neurological disorders. He has published over 50 research papers in international journals.',
          consultationFee: 180.00,
          availableFrom: '10:00',
          availableTo: '18:00',
          isAvailable: true,
        },
        departmentName: 'Neurology',
      },
      {
        user: {
          name: 'Dr. Emily Rodriguez',
          email: 'emily.rodriguez@mediwise.com',
          password: 'doctor123',
          role: 'doctor',
          phone: '+1-555-0103',
          address: '789 Ortho Street, Healthcare Plaza',
        },
        doctor: {
          specialization: 'Orthopedic Surgeon',
          experience: 18,
          qualification: 'MBBS, MS (Orthopedics), FACS\nSpecialized in Joint Replacement Surgery',
          bio: 'Dr. Emily Rodriguez is a leading orthopedic surgeon with expertise in joint replacement, sports medicine, and trauma surgery. She has successfully performed over 3000 surgeries.',
          consultationFee: 200.00,
          availableFrom: '08:00',
          availableTo: '16:00',
          isAvailable: true,
        },
        departmentName: 'Orthopedics',
      },
      {
        user: {
          name: 'Dr. James Wilson',
          email: 'james.wilson@mediwise.com',
          password: 'doctor123',
          role: 'doctor',
          phone: '+1-555-0104',
          address: '321 Pediatrics Avenue, Children Hospital',
        },
        doctor: {
          specialization: 'Pediatrician',
          experience: 10,
          qualification: 'MBBS, MD (Pediatrics), MRCPCH\nCertified in Pediatric Emergency Medicine',
          bio: 'Dr. James Wilson is a dedicated pediatrician with a passion for children\'s health. He specializes in pediatric emergency medicine and developmental pediatrics.',
          consultationFee: 120.00,
          availableFrom: '09:00',
          availableTo: '17:00',
          isAvailable: true,
        },
        departmentName: 'Pediatrics',
      },
      {
        user: {
          name: 'Dr. Priya Sharma',
          email: 'priya.sharma@mediwise.com',
          password: 'doctor123',
          role: 'doctor',
          phone: '+1-555-0105',
          address: '654 Dermatology Center, Skin Care Plaza',
        },
        doctor: {
          specialization: 'Dermatologist',
          experience: 8,
          qualification: 'MBBS, MD (Dermatology), DNB\nCertified in Cosmetic Dermatology',
          bio: 'Dr. Priya Sharma is a skilled dermatologist specializing in skin diseases, cosmetic procedures, and hair restoration. She provides comprehensive dermatological care.',
          consultationFee: 130.00,
          availableFrom: '10:00',
          availableTo: '18:00',
          isAvailable: true,
        },
        departmentName: 'Dermatology',
      },
      {
        user: {
          name: 'Dr. Robert Brown',
          email: 'robert.brown@mediwise.com',
          password: 'doctor123',
          role: 'doctor',
          phone: '+1-555-0106',
          address: '987 General Medicine Clinic, Healthcare Hub',
        },
        doctor: {
          specialization: 'General Physician',
          experience: 20,
          qualification: 'MBBS, MD (General Medicine), MRCP\nDiploma in Family Medicine',
          bio: 'Dr. Robert Brown is an experienced general physician with over 20 years of practice. He provides comprehensive primary healthcare services and preventive medicine.',
          consultationFee: 100.00,
          availableFrom: '08:00',
          availableTo: '16:00',
          isAvailable: true,
        },
        departmentName: 'General Medicine',
      },
    ];

    console.log('Creating demo doctors...');

    for (const demo of demoDoctors) {
      // Find the department
      const department = departments.find(d => d.name === demo.departmentName);
      if (!department) {
        console.log(`Department ${demo.departmentName} not found, skipping...`);
        continue;
      }

      // Check if user already exists
      let user = await models.User.findOne({ where: { email: demo.user.email } });
      
      if (!user) {
        // Create user
        user = await models.User.create(demo.user);
        console.log(`Created user: ${user.name}`);
      } else {
        console.log(`User already exists: ${user.name}`);
      }

      // Check if doctor profile already exists
      let doctor = await models.Doctor.findOne({ where: { userId: user.id } });
      
      if (!doctor) {
        // Create doctor profile
        doctor = await models.Doctor.create({
          ...demo.doctor,
          userId: user.id,
          departmentId: department.id,
        });
        console.log(`Created doctor profile for: ${user.name} - ${demo.doctor.specialization}`);
      } else {
        // Update existing doctor profile with full details
        await doctor.update({
          ...demo.doctor,
          departmentId: department.id,
        });
        console.log(`Updated doctor profile for: ${user.name}`);
      }
    }

    console.log('\n✅ Demo doctors seeded successfully!');
    console.log('\nLogin credentials for all doctors:');
    console.log('Email: <doctor-email>');
    console.log('Password: doctor123\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding doctors:', error);
    console.error('Error details:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    process.exit(1);
  }
};

seedDoctors();

