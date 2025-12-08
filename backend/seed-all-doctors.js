import sequelize from './config/database.js';
import models from './models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAllDoctors = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // First, create all departments
    const allDepartments = [
      { name: 'Cardiology', description: 'Heart and cardiovascular diseases', icon: '❤️' },
      { name: 'Chest Surgery', description: 'Thoracic and chest surgery', icon: '🫁' },
      { name: 'Communicable Disease and Public Health', description: 'Infectious diseases and public health', icon: '🦠' },
      { name: 'Dermatology (Skin & VD)', description: 'Skin diseases and venereal diseases', icon: '🧴' },
      { name: 'Diabetes & Endocrinology', description: 'Diabetes and hormonal disorders', icon: '💉' },
      { name: 'ENT', description: 'Ear, Nose and Throat specialists', icon: '👂' },
      { name: 'Family Physician', description: 'General family medicine', icon: '👨‍⚕️' },
      { name: 'Gastroenterology', description: 'Digestive system disorders', icon: '🫀' },
      { name: 'General & Laparoscopic Surgery', description: 'General and minimal invasive surgery', icon: '🔪' },
      { name: 'General & Plastic Surgeon', description: 'Plastic and reconstructive surgery', icon: '✨' },
      { name: 'Gyane & Obstetrician', description: 'Gynecology and obstetrics', icon: '🤱' },
      { name: 'Haematology', description: 'Blood disorders and diseases', icon: '🩸' },
      { name: 'Medicine', description: 'General internal medicine', icon: '💊' },
      { name: 'Medicine & Gastroenterology', description: 'Internal medicine and digestive disorders', icon: '🫀' },
      { name: 'Medicine & Liver Specialist', description: 'Liver diseases and hepatology', icon: '🫐' },
      { name: 'Medicine Allergy Asthma & Chest', description: 'Allergy, asthma and chest diseases', icon: '😷' },
      { name: 'Nephrology & Medicine', description: 'Kidney diseases and internal medicine', icon: '🔬' },
      { name: 'Neuro Surgery', description: 'Brain and nervous system surgery', icon: '🧠' },
      { name: 'Neurology', description: 'Brain and nervous system disorders', icon: '🧠' },
      { name: 'Nutrition & Dietitian', description: 'Nutrition and dietary counseling', icon: '🥗' },
      { name: 'Oncology', description: 'Cancer treatment and care', icon: '🎗️' },
      { name: 'Oral & Maxillofacial Surgery', description: 'Oral and facial surgery', icon: '🦷' },
      { name: 'Orthopedics Surgery', description: 'Bones and joints surgery', icon: '🦴' },
      { name: 'Paediatric Surgery', description: 'Surgery for children', icon: '👶' },
      { name: 'Paediatrics', description: 'Children health care', icon: '👶' },
      { name: 'Pathology', description: 'Laboratory medicine and diagnostics', icon: '🔬' },
      { name: 'Physiotherapy', description: 'Physical therapy and rehabilitation', icon: '🏃' },
      { name: 'Psychiatry', description: 'Mental health and psychiatric care', icon: '🧘' },
      { name: 'Rheumatology', description: 'Arthritis and joint diseases', icon: '🦵' },
      { name: 'Urology', description: 'Urinary system and male reproductive health', icon: '💧' },
      { name: 'Vascular Surgery', description: 'Blood vessel surgery', icon: '🩺' },
    ];

    console.log('Creating/updating departments...');
    for (const dept of allDepartments) {
      const [department, created] = await models.Department.findOrCreate({
        where: { name: dept.name },
        defaults: dept,
      });
      if (created) {
        console.log(`Created department: ${dept.name}`);
      }
    }

    // Get all departments
    const departments = await models.Department.findAll();
    const deptMap = {};
    departments.forEach(d => { deptMap[d.name] = d; });

    // Real Bangladeshi doctors data
    const doctorsData = [
      // Cardiology
      { name: 'Prof. Dr. Abdul Wadud Chowdhury', email: 'wadud.chowdhury@mediwise.com', dept: 'Cardiology', spec: 'Interventional Cardiologist', exp: 25, qual: 'MBBS, FCPS (Medicine), MD (Cardiology), FACC', bio: 'Professor at BSMMU, pioneer in interventional cardiology in Bangladesh', fee: 2000, phone: '+880-1712-345678' },
      { name: 'Prof. Dr. AFM Saiful Islam', email: 'saiful.islam@mediwise.com', dept: 'Cardiology', spec: 'Cardiologist', exp: 30, qual: 'MBBS, FCPS, MD (Cardiology)', bio: 'Renowned cardiologist at National Heart Foundation, expert in preventive cardiology', fee: 1800, phone: '+880-1712-345679' },
      { name: 'Dr. Syed Ali Ahsan', email: 'ali.ahsan@mediwise.com', dept: 'Cardiology', spec: 'Cardiac Surgeon', exp: 22, qual: 'MBBS, FCPS (Surgery), MS (Cardiac Surgery)', bio: 'Leading cardiac surgeon at Apollo Hospitals Dhaka', fee: 2200, phone: '+880-1712-345680' },
      { name: 'Prof. Dr. AKM Monwarul Islam', email: 'monwarul.islam@mediwise.com', dept: 'Cardiology', spec: 'Cardiologist', exp: 28, qual: 'MBBS, FCPS (Medicine), MD (Cardiology)', bio: 'Professor at Dhaka Medical College, specialist in heart failure', fee: 1900, phone: '+880-1712-345681' },
      { name: 'Dr. Mir Jamal Uddin', email: 'jamal.uddin@mediwise.com', dept: 'Cardiology', spec: 'Pediatric Cardiologist', exp: 18, qual: 'MBBS, FCPS (Pediatrics), MD (Pediatric Cardiology)', bio: 'Expert in congenital heart diseases at BSMMU', fee: 2000, phone: '+880-1712-345682' },

      // Neurology
      { name: 'Prof. Dr. Quazi Deen Mohammad', email: 'deen.mohammad@mediwise.com', dept: 'Neurology', spec: 'Neurologist', exp: 30, qual: 'MBBS, FCPS, MD (Neurology), FRCP', bio: 'Professor at BSMMU, leading neurologist in Bangladesh', fee: 2000, phone: '+880-1712-345700' },
      { name: 'Prof. Dr. AKM Fazlul Haque', email: 'fazlul.haque@mediwise.com', dept: 'Neurology', spec: 'Neurologist', exp: 25, qual: 'MBBS, FCPS, MD (Neurology)', bio: 'Renowned for stroke treatment at National Institute of Neurosciences', fee: 1900, phone: '+880-1712-345701' },
      { name: 'Dr. Md. Badrul Alam', email: 'badrul.alam@mediwise.com', dept: 'Neurology', spec: 'Neurophysiologist', exp: 20, qual: 'MBBS, FCPS (Medicine), MD (Neurology)', bio: 'Expert in epilepsy and movement disorders', fee: 1800, phone: '+880-1712-345702' },

      // Neuro Surgery
      { name: 'Prof. Dr. AKM Habibur Rahman', email: 'habibur.rahman@mediwise.com', dept: 'Neuro Surgery', spec: 'Neurosurgeon', exp: 28, qual: 'MBBS, FCPS (Surgery), MS (Neurosurgery)', bio: 'Leading neurosurgeon at BSMMU, expert in brain tumor surgery', fee: 2500, phone: '+880-1712-345710' },
      { name: 'Prof. Dr. Kanak Kanti Barua', email: 'kanak.barua@mediwise.com', dept: 'Neuro Surgery', spec: 'Spine Surgeon', exp: 25, qual: 'MBBS, FCPS (Surgery), MS (Neurosurgery)', bio: 'Specialist in spinal surgery and trauma at NINS', fee: 2400, phone: '+880-1712-345711' },
      { name: 'Dr. Md. Shafiqul Islam', email: 'shafiqul.islam@mediwise.com', dept: 'Neuro Surgery', spec: 'Pediatric Neurosurgeon', exp: 18, qual: 'MBBS, FCPS (Surgery), MS (Neurosurgery)', bio: 'Expert in pediatric brain surgery', fee: 2300, phone: '+880-1712-345712' },

      // Pediatrics
      { name: 'Prof. Dr. Md. Abid Hossain Mollah', email: 'abid.mollah@mediwise.com', dept: 'Paediatrics', spec: 'Pediatrician', exp: 30, qual: 'MBBS, FCPS (Pediatrics), MD (Pediatrics)', bio: 'Professor at BSMMU, leading pediatrician in Bangladesh', fee: 1500, phone: '+880-1712-345720' },
      { name: 'Prof. Dr. Mohammad Shahidullah', email: 'shahidullah@mediwise.com', dept: 'Paediatrics', spec: 'Neonatologist', exp: 25, qual: 'MBBS, FCPS (Pediatrics), MD (Neonatology)', bio: 'Expert in newborn care and neonatal intensive care', fee: 1600, phone: '+880-1712-345721' },
      { name: 'Dr. Sayeeda Anwara', email: 'sayeeda.anwara@mediwise.com', dept: 'Paediatrics', spec: 'Pediatric Intensivist', exp: 20, qual: 'MBBS, FCPS (Pediatrics), MD (PICU)', bio: 'Specialist in pediatric critical care', fee: 1500, phone: '+880-1712-345722' },

      // Gynecology & Obstetrics
      { name: 'Prof. Dr. Ferdousi Begum', email: 'ferdousi.begum@mediwise.com', dept: 'Gyane & Obstetrician', spec: 'Gynecologist & Obstetrician', exp: 30, qual: 'MBBS, FCPS (Gynae & Obs), MRCOG', bio: 'Professor at BSMMU, leading gynecologist and obstetrician', fee: 1800, phone: '+880-1712-345730' },
      { name: 'Prof. Dr. Fatema Ashraf', email: 'fatema.ashraf@mediwise.com', dept: 'Gyane & Obstetrician', spec: 'Gynecologist', exp: 28, qual: 'MBBS, FCPS (Gynae & Obs), MD', bio: 'Expert in high-risk pregnancy and infertility', fee: 1900, phone: '+880-1712-345731' },
      { name: 'Dr. Farhana Dewan', email: 'farhana.dewan@mediwise.com', dept: 'Gyane & Obstetrician', spec: 'Gynecologist', exp: 22, qual: 'MBBS, FCPS (Gynae & Obs)', bio: 'Specialist in laparoscopic gynecological surgery', fee: 1800, phone: '+880-1712-345732' },

      // Orthopedics
      { name: 'Prof. Dr. Md. Abdul Kader', email: 'abdul.kader@mediwise.com', dept: 'Orthopedics Surgery', spec: 'Orthopedic Surgeon', exp: 30, qual: 'MBBS, FCPS (Surgery), MS (Orthopedics)', bio: 'Professor at BSMMU, leading orthopedic surgeon', fee: 2000, phone: '+880-1712-345740' },
      { name: 'Prof. Dr. Md. Quamrul Islam', email: 'quamrul.islam@mediwise.com', dept: 'Orthopedics Surgery', spec: 'Joint Replacement Surgeon', exp: 25, qual: 'MBBS, FCPS (Surgery), MS (Orthopedics)', bio: 'Expert in hip and knee replacement surgery', fee: 2200, phone: '+880-1712-345741' },
      { name: 'Dr. Ashraf Uddin Ahmed', email: 'ashraf.uddin@mediwise.com', dept: 'Orthopedics Surgery', spec: 'Spine Surgeon', exp: 20, qual: 'MBBS, FCPS (Surgery), MS (Orthopedics)', bio: 'Specialist in spinal surgery and trauma', fee: 2100, phone: '+880-1712-345742' },

      // Dermatology
      { name: 'Prof. Dr. MA Rashid', email: 'rashid@mediwise.com', dept: 'Dermatology (Skin & VD)', spec: 'Dermatologist', exp: 28, qual: 'MBBS, FCPS (Dermatology), MD', bio: 'Professor at BSMMU, leading dermatologist', fee: 1500, phone: '+880-1712-345750' },
      { name: 'Prof. Dr. MR Karim', email: 'mr.karim@mediwise.com', dept: 'Dermatology (Skin & VD)', spec: 'Dermatologist', exp: 25, qual: 'MBBS, FCPS (Dermatology)', bio: 'Expert in cosmetic dermatology and laser treatment', fee: 1600, phone: '+880-1712-345751' },
      { name: 'Dr. Fahmida Begum', email: 'fahmida.begum@mediwise.com', dept: 'Dermatology (Skin & VD)', spec: 'Dermatologist', exp: 20, qual: 'MBBS, FCPS (Dermatology)', bio: 'Specialist in pediatric dermatology', fee: 1500, phone: '+880-1712-345752' },

      // ENT
      { name: 'Prof. Dr. Manzoor Hussain', email: 'manzoor.hussain@mediwise.com', dept: 'ENT', spec: 'ENT Specialist', exp: 30, qual: 'MBBS, FCPS (ENT), MS (ENT)', bio: 'Professor at BSMMU, leading ENT specialist', fee: 1500, phone: '+880-1712-345760' },
      { name: 'Prof. Dr. Md. Golam Mostafa', email: 'golam.mostafa@mediwise.com', dept: 'ENT', spec: 'Head & Neck Surgeon', exp: 25, qual: 'MBBS, FCPS (ENT), MS (ENT)', bio: 'Expert in head and neck cancer surgery', fee: 1800, phone: '+880-1712-345761' },
      { name: 'Dr. Sharmin Ara', email: 'sharmin.ara@mediwise.com', dept: 'ENT', spec: 'Otolaryngologist', exp: 20, qual: 'MBBS, FCPS (ENT)', bio: 'Specialist in hearing disorders and cochlear implants', fee: 1600, phone: '+880-1712-345762' },

      // Gastroenterology
      { name: 'Prof. Dr. MA Maleque', email: 'maleque@mediwise.com', dept: 'Gastroenterology', spec: 'Gastroenterologist', exp: 30, qual: 'MBBS, FCPS (Medicine), MD (Gastroenterology)', bio: 'Professor at BSMMU, leading gastroenterologist', fee: 2000, phone: '+880-1712-345770' },
      { name: 'Prof. Dr. Mamun Al Mahtab', email: 'mamun.mahtab@mediwise.com', dept: 'Medicine & Liver Specialist', spec: 'Hepatologist', exp: 28, qual: 'MBBS, FCPS (Medicine), MD (Hepatology)', bio: 'Expert in liver diseases and transplantation', fee: 2100, phone: '+880-1712-345771' },
      { name: 'Dr. SM Fazlul Karim', email: 'fazlul.karim@mediwise.com', dept: 'Gastroenterology', spec: 'Gastroenterologist', exp: 22, qual: 'MBBS, FCPS (Medicine), MD (Gastroenterology)', bio: 'Specialist in endoscopic procedures', fee: 1900, phone: '+880-1712-345772' },

      // Diabetes & Endocrinology
      { name: 'Prof. Dr. AK Azad Khan', email: 'azad.khan@mediwise.com', dept: 'Diabetes & Endocrinology', spec: 'Endocrinologist', exp: 35, qual: 'MBBS, FCPS (Medicine), MD (Endocrinology)', bio: 'Professor and leading diabetes specialist in Bangladesh', fee: 1800, phone: '+880-1712-345780' },
      { name: 'Prof. Dr. Md. Fariduddin', email: 'fariduddin@mediwise.com', dept: 'Diabetes & Endocrinology', spec: 'Diabetologist', exp: 28, qual: 'MBBS, FCPS (Medicine), MD (Endocrinology)', bio: 'Expert in diabetes management and complications', fee: 1700, phone: '+880-1712-345781' },
      { name: 'Dr. Subhagata Chowdhury', email: 'subhagata.chowdhury@mediwise.com', dept: 'Diabetes & Endocrinology', spec: 'Endocrinologist', exp: 20, qual: 'MBBS, FCPS (Medicine), MD (Endocrinology)', bio: 'Specialist in thyroid and hormonal disorders', fee: 1600, phone: '+880-1712-345782' },

      // Oncology
      { name: 'Prof. Dr. Muntasir Mamun', email: 'muntasir.mamun@mediwise.com', dept: 'Oncology', spec: 'Medical Oncologist', exp: 30, qual: 'MBBS, FCPS (Medicine), MD (Oncology)', bio: 'Professor at BSMMU, leading cancer specialist', fee: 2000, phone: '+880-1712-345790' },
      { name: 'Prof. Dr. MA Hai', email: 'ma.hai@mediwise.com', dept: 'Oncology', spec: 'Surgical Oncologist', exp: 28, qual: 'MBBS, FCPS (Surgery), MS (Oncology)', bio: 'Expert in cancer surgery', fee: 2200, phone: '+880-1712-345791' },
      { name: 'Dr. Farzana Alam', email: 'farzana.alam@mediwise.com', dept: 'Oncology', spec: 'Pediatric Oncologist', exp: 22, qual: 'MBBS, FCPS (Pediatrics), MD (Pediatric Oncology)', bio: 'Specialist in childhood cancers', fee: 2000, phone: '+880-1712-345792' },

      // Urology
      { name: 'Prof. Dr. Md. Zahirul Islam', email: 'zahirul.islam@mediwise.com', dept: 'Urology', spec: 'Urologist', exp: 28, qual: 'MBBS, FCPS (Surgery), MS (Urology)', bio: 'Professor at BSMMU, leading urologist', fee: 2000, phone: '+880-1712-345800' },
      { name: 'Prof. Dr. M Amanullah', email: 'amanullah@mediwise.com', dept: 'Urology', spec: 'Urologist', exp: 25, qual: 'MBBS, FCPS (Surgery), MS (Urology)', bio: 'Expert in kidney stone treatment and prostate surgery', fee: 1900, phone: '+880-1712-345801' },
      { name: 'Dr. Md. Kamrul Hassan', email: 'kamrul.hassan@mediwise.com', dept: 'Urology', spec: 'Pediatric Urologist', exp: 18, qual: 'MBBS, FCPS (Surgery), MS (Urology)', bio: 'Specialist in pediatric urological disorders', fee: 2000, phone: '+880-1712-345802' },

      // Psychiatry
      { name: 'Prof. Dr. Gias Uddin Ahsan', email: 'gias.ahsan@mediwise.com', dept: 'Psychiatry', spec: 'Psychiatrist', exp: 30, qual: 'MBBS, FCPS (Psychiatry), MD (Psychiatry)', bio: 'Professor at BSMMU, leading psychiatrist', fee: 1500, phone: '+880-1712-345810' },
      { name: 'Prof. Dr. Helal Uddin Ahmed', email: 'helal.ahmed@mediwise.com', dept: 'Psychiatry', spec: 'Psychiatrist', exp: 28, qual: 'MBBS, FCPS (Psychiatry), MD', bio: 'Expert in child and adolescent psychiatry', fee: 1600, phone: '+880-1712-345811' },
      { name: 'Dr. Tahmeed Ahmed', email: 'tahmeed.ahmed@mediwise.com', dept: 'Psychiatry', spec: 'Psychiatrist', exp: 20, qual: 'MBBS, FCPS (Psychiatry)', bio: 'Specialist in mood disorders and anxiety', fee: 1500, phone: '+880-1712-345812' },

      // General Surgery
      { name: 'Prof. Dr. Md. Nurul Islam', email: 'nurul.islam@mediwise.com', dept: 'General & Laparoscopic Surgery', spec: 'Laparoscopic Surgeon', exp: 28, qual: 'MBBS, FCPS (Surgery), MS (Surgery)', bio: 'Professor at BSMMU, pioneer in laparoscopic surgery', fee: 2000, phone: '+880-1712-345820' },
      { name: 'Prof. Dr. Md. Abdur Rahim', email: 'abdur.rahim@mediwise.com', dept: 'General & Laparoscopic Surgery', spec: 'General Surgeon', exp: 25, qual: 'MBBS, FCPS (Surgery), MS', bio: 'Expert in minimally invasive surgery', fee: 1900, phone: '+880-1712-345821' },
      { name: 'Dr. Asif Mahmud', email: 'asif.mahmud@mediwise.com', dept: 'General & Laparoscopic Surgery', spec: 'Laparoscopic Surgeon', exp: 18, qual: 'MBBS, FCPS (Surgery), MS (Surgery)', bio: 'Specialist in advanced laparoscopic procedures', fee: 2000, phone: '+880-1712-345822' },

      // Medicine
      { name: 'Prof. Dr. ABM Abdullah', email: 'abm.abdullah@mediwise.com', dept: 'Medicine', spec: 'Internal Medicine', exp: 32, qual: 'MBBS, FCPS (Medicine), MD (Medicine)', bio: 'Professor at BSMMU, Dean of Faculty of Medicine', fee: 1800, phone: '+880-1712-345830' },
      { name: 'Prof. Dr. Md. Abu Shahin', email: 'abu.shahin@mediwise.com', dept: 'Medicine', spec: 'Internal Medicine', exp: 28, qual: 'MBBS, FCPS (Medicine), MD', bio: 'Expert in critical care medicine', fee: 1700, phone: '+880-1712-345831' },
      { name: 'Dr. Rumana Habib', email: 'rumana.habib@mediwise.com', dept: 'Medicine', spec: 'Internal Medicine', exp: 22, qual: 'MBBS, FCPS (Medicine)', bio: 'Specialist in general medicine and preventive care', fee: 1600, phone: '+880-1712-345832' },

      // Nephrology
      { name: 'Prof. Dr. MA Samad', email: 'ma.samad@mediwise.com', dept: 'Nephrology & Medicine', spec: 'Nephrologist', exp: 30, qual: 'MBBS, FCPS (Medicine), MD (Nephrology)', bio: 'Professor at BSMMU, leading nephrologist', fee: 2000, phone: '+880-1712-345840' },
      { name: 'Prof. Dr. Md. Rafiqul Islam', email: 'rafiqul.islam@mediwise.com', dept: 'Nephrology & Medicine', spec: 'Nephrologist', exp: 28, qual: 'MBBS, FCPS (Medicine), MD (Nephrology)', bio: 'Expert in kidney transplantation', fee: 2100, phone: '+880-1712-345841' },
      { name: 'Dr. Fatema Khatun', email: 'fatema.khatun@mediwise.com', dept: 'Nephrology & Medicine', spec: 'Nephrologist', exp: 20, qual: 'MBBS, FCPS (Medicine), MD (Nephrology)', bio: 'Specialist in dialysis and kidney diseases', fee: 1900, phone: '+880-1712-345842' },

      // Chest Surgery
      { name: 'Prof. Dr. Md. Mushfiqur Rahman', email: 'mushfiqur.rahman@mediwise.com', dept: 'Chest Surgery', spec: 'Cardiothoracic Surgeon', exp: 28, qual: 'MBBS, FCPS (Surgery), MS (Cardiothoracic)', bio: 'Professor at BSMMU, expert in chest and lung surgery', fee: 2200, phone: '+880-1712-345850' },
      { name: 'Prof. Dr. Kamrul Hasan', email: 'kamrul.hasan@mediwise.com', dept: 'Chest Surgery', spec: 'Thoracic Surgeon', exp: 25, qual: 'MBBS, FCPS (Surgery), MS (Cardiothoracic)', bio: 'Specialist in lung cancer surgery', fee: 2100, phone: '+880-1712-345851' },

      // Allergy, Asthma & Chest
      { name: 'Prof. Dr. Md. Abdullah Sadiq', email: 'abdullah.sadiq@mediwise.com', dept: 'Medicine Allergy Asthma & Chest', spec: 'Pulmonologist', exp: 30, qual: 'MBBS, FCPS (Medicine), MD (Chest)', bio: 'Professor at BSMMU, leading pulmonologist', fee: 1800, phone: '+880-1712-345860' },
      { name: 'Prof. Dr. Mohammad Mostafizur Rahman', email: 'mostafizur.rahman@mediwise.com', dept: 'Medicine Allergy Asthma & Chest', spec: 'Allergist', exp: 28, qual: 'MBBS, FCPS (Medicine), MD (Allergy)', bio: 'Expert in allergy and asthma management', fee: 1700, phone: '+880-1712-345861' },

      // Plastic Surgery
      { name: 'Prof. Dr. AKM Serajul Islam', email: 'serajul.islam@mediwise.com', dept: 'General & Plastic Surgeon', spec: 'Plastic Surgeon', exp: 28, qual: 'MBBS, FCPS (Surgery), MS (Plastic Surgery)', bio: 'Professor at BSMMU, leading plastic surgeon', fee: 2200, phone: '+880-1712-345870' },
      { name: 'Prof. Dr. Md. Abdul Hai', email: 'abdul.hai@mediwise.com', dept: 'General & Plastic Surgeon', spec: 'Reconstructive Surgeon', exp: 25, qual: 'MBBS, FCPS (Surgery), MS (Plastic Surgery)', bio: 'Expert in reconstructive and cosmetic surgery', fee: 2300, phone: '+880-1712-345871' },

      // Physiotherapy
      { name: 'Dr. Md. Shafiqul Islam', email: 'shafiqul.physio@mediwise.com', dept: 'Physiotherapy', spec: 'Physiotherapist', exp: 20, qual: 'BPT, MPT, PhD (Physiotherapy)', bio: 'Expert in orthopedic and sports physiotherapy', fee: 800, phone: '+880-1712-345880' },
      { name: 'Dr. Nasreen Sultana', email: 'nasreen.physio@mediwise.com', dept: 'Physiotherapy', spec: 'Physiotherapist', exp: 18, qual: 'BPT, MPT', bio: 'Specialist in neurological rehabilitation', fee: 800, phone: '+880-1712-345881' },

      // Nutrition
      { name: 'Dr. Kaniz Fatema', email: 'kaniz.fatema@mediwise.com', dept: 'Nutrition & Dietitian', spec: 'Clinical Nutritionist', exp: 15, qual: 'BSc (Nutrition), MSc (Nutrition), PhD', bio: 'Expert in clinical nutrition and diet planning', fee: 1000, phone: '+880-1712-345890' },
      { name: 'Dr. Shamima Akter', email: 'shamima.akter@mediwise.com', dept: 'Nutrition & Dietitian', spec: 'Dietitian', exp: 12, qual: 'BSc (Nutrition), MSc (Nutrition)', bio: 'Specialist in diabetic and cardiac diet management', fee: 900, phone: '+880-1712-345891' },

      // Pathology
      { name: 'Prof. Dr. Md. Abdul Bari', email: 'abdul.bari@mediwise.com', dept: 'Pathology', spec: 'Pathologist', exp: 30, qual: 'MBBS, FCPS (Pathology), MD (Pathology)', bio: 'Professor at BSMMU, leading pathologist', fee: 1200, phone: '+880-1712-345900' },
      { name: 'Prof. Dr. Fatema Begum', email: 'fatema.path@mediwise.com', dept: 'Pathology', spec: 'Histopathologist', exp: 28, qual: 'MBBS, FCPS (Pathology), MD', bio: 'Expert in cancer diagnosis and histopathology', fee: 1300, phone: '+880-1712-345901' },

      // Hematology
      { name: 'Prof. Dr. MA Khan', email: 'ma.khan@mediwise.com', dept: 'Haematology', spec: 'Hematologist', exp: 30, qual: 'MBBS, FCPS (Medicine), MD (Hematology)', bio: 'Professor at BSMMU, leading hematologist', fee: 1900, phone: '+880-1712-345910' },
      { name: 'Dr. Rashida Begum', email: 'rashida.haemat@mediwise.com', dept: 'Haematology', spec: 'Hematologist', exp: 22, qual: 'MBBS, FCPS (Medicine), MD (Hematology)', bio: 'Expert in blood disorders and coagulation', fee: 1800, phone: '+880-1712-345911' },

      // Oral & Maxillofacial Surgery
      { name: 'Prof. Dr. Md. Rafiqul Islam', email: 'rafiqul.oral@mediwise.com', dept: 'Oral & Maxillofacial Surgery', spec: 'Oral Surgeon', exp: 28, qual: 'BDS, FCPS (Oral Surgery), MS', bio: 'Professor at Dhaka Dental College, expert in facial surgery', fee: 2000, phone: '+880-1712-345920' },
      { name: 'Dr. Tahmina Begum', email: 'tahmina.oral@mediwise.com', dept: 'Oral & Maxillofacial Surgery', spec: 'Maxillofacial Surgeon', exp: 22, qual: 'BDS, FCPS (Oral Surgery)', bio: 'Specialist in jaw surgery and facial reconstruction', fee: 1900, phone: '+880-1712-345921' },

      // Pediatric Surgery
      { name: 'Prof. Dr. Md. Abdul Latif', email: 'abdul.latif@mediwise.com', dept: 'Paediatric Surgery', spec: 'Pediatric Surgeon', exp: 28, qual: 'MBBS, FCPS (Surgery), MS (Pediatric Surgery)', bio: 'Professor at BSMMU, leading pediatric surgeon', fee: 2200, phone: '+880-1712-345930' },
      { name: 'Prof. Dr. Munir Ahmed', email: 'munir.ahmed@mediwise.com', dept: 'Paediatric Surgery', spec: 'Pediatric Surgeon', exp: 25, qual: 'MBBS, FCPS (Surgery), MS (Pediatric Surgery)', bio: 'Expert in congenital anomalies and pediatric oncology surgery', fee: 2100, phone: '+880-1712-345931' },

      // Vascular Surgery
      { name: 'Prof. Dr. Md. Asaduzzaman', email: 'asaduzzaman@mediwise.com', dept: 'Vascular Surgery', spec: 'Vascular Surgeon', exp: 26, qual: 'MBBS, FCPS (Surgery), MS (Vascular Surgery)', bio: 'Professor at BSMMU, expert in vascular diseases', fee: 2100, phone: '+880-1712-345940' },
      { name: 'Dr. Mahmud Hasan', email: 'mahmud.hasan@mediwise.com', dept: 'Vascular Surgery', spec: 'Vascular Surgeon', exp: 20, qual: 'MBBS, FCPS (Surgery), MS (Vascular Surgery)', bio: 'Specialist in endovascular procedures', fee: 2000, phone: '+880-1712-345941' },

      // Rheumatology
      { name: 'Prof. Dr. Md. Anwarul Karim', email: 'anwarul.karim@mediwise.com', dept: 'Rheumatology', spec: 'Rheumatologist', exp: 28, qual: 'MBBS, FCPS (Medicine), MD (Rheumatology)', bio: 'Professor at BSMMU, leading rheumatologist', fee: 1800, phone: '+880-1712-345950' },
      { name: 'Dr. Sultana Razia', email: 'sultana.razia@mediwise.com', dept: 'Rheumatology', spec: 'Rheumatologist', exp: 22, qual: 'MBBS, FCPS (Medicine), MD (Rheumatology)', bio: 'Expert in arthritis and autoimmune diseases', fee: 1700, phone: '+880-1712-345951' },

      // Public Health
      { name: 'Prof. Dr. Md. Nazrul Islam', email: 'nazrul.islam@mediwise.com', dept: 'Communicable Disease and Public Health', spec: 'Public Health Specialist', exp: 30, qual: 'MBBS, MPH, PhD (Public Health)', bio: 'Professor at BSMMU, expert in public health and epidemiology', fee: 1500, phone: '+880-1712-345960' },
      { name: 'Dr. Mahmuda Begum', email: 'mahmuda.public@mediwise.com', dept: 'Communicable Disease and Public Health', spec: 'Epidemiologist', exp: 25, qual: 'MBBS, MPH, PhD', bio: 'Expert in infectious disease control and prevention', fee: 1400, phone: '+880-1712-345961' },

      // Family Physician
      { name: 'Dr. Md. Abdul Halim', email: 'abdul.halim@mediwise.com', dept: 'Family Physician', spec: 'Family Medicine', exp: 25, qual: 'MBBS, FCPS (Medicine), DFP', bio: 'Expert in primary healthcare and family medicine', fee: 1200, phone: '+880-1712-345970' },
      { name: 'Dr. Nasima Akter', email: 'nasima.family@mediwise.com', dept: 'Family Physician', spec: 'Family Medicine', exp: 20, qual: 'MBBS, FCPS (Medicine), DFP', bio: 'Specialist in preventive medicine and health screening', fee: 1100, phone: '+880-1712-345971' },
    ];

    console.log('\nCreating demo doctors...\n');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const docData of doctorsData) {
      try {
        const department = deptMap[docData.dept];
        if (!department) {
          console.log(`⚠️  Department "${docData.dept}" not found, skipping ${docData.name}`);
          skipped++;
          continue;
        }

        // Check if user exists
        let user = await models.User.findOne({ where: { email: docData.email } });
        
        if (!user) {
          user = await models.User.create({
            name: docData.name,
            email: docData.email,
            password: 'doctor123',
            role: 'doctor',
            phone: docData.phone,
          });
        }

        // Check if doctor profile exists
        let doctor = await models.Doctor.findOne({ where: { userId: user.id } });
        
        if (!doctor) {
          await models.Doctor.create({
            userId: user.id,
            departmentId: department.id,
            specialization: docData.spec,
            experience: docData.exp,
            qualification: docData.qual,
            bio: docData.bio,
            consultationFee: docData.fee,
            availableFrom: '09:00',
            availableTo: '17:00',
            isAvailable: true,
          });
          console.log(`✅ Created: ${docData.name} - ${docData.spec} (${docData.dept})`);
          created++;
        } else {
          await doctor.update({
            departmentId: department.id,
            specialization: docData.spec,
            experience: docData.exp,
            qualification: docData.qual,
            bio: docData.bio,
            consultationFee: docData.fee,
          });
          console.log(`🔄 Updated: ${docData.name} - ${docData.spec} (${docData.dept})`);
          updated++;
        }
      } catch (error) {
        console.error(`❌ Error creating ${docData.name}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${created} doctors`);
    console.log(`   🔄 Updated: ${updated} doctors`);
    console.log(`   ⚠️  Skipped: ${skipped} doctors`);
    console.log(`\n✅ Demo doctors seeding completed!`);
    console.log(`\n📝 Login credentials for all doctors:`);
    console.log(`   Password: doctor123`);
    console.log(`   Email: <doctor-email> from the list above\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
    console.error('Error details:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    process.exit(1);
  }
};

seedAllDoctors();

