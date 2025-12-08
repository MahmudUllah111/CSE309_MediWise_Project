// Medical terms translation from English to Bengali - Comprehensive Dictionary
const medicalTranslations = {
  // Qualifications
  'MBBS': 'এমবিবিএস',
  'MD': 'এমডি',
  'FCPS': 'এফসিপিএস',
  'MRCP': 'এমআরসিপি',
  'FRCP': 'এফআরসিপি',
  'FRCP (Glasgow)': 'এফআরসিপি (গ্লাসগো)',
  'PGT': 'পিজিটি',
  'Diploma': 'ডিপ্লোমা',
  'Gynae & Obs': 'গাইনী ও অবস',
  'Gynae': 'গাইনী',
  'Obs': 'অবস',
  'Medicine': 'মেডিসিন',
  'Fellow Pulmonology': 'ফেলো পালমনোলজি',
  'Fellow Pulmonology (China)': 'ফেলো পালমনোলজি (চীন)',
  
  // Specializations - Complete List
  'Gynecologist': 'স্ত্রীরোগ বিশেষজ্ঞ',
  'Obstetrician': 'প্রসূতি বিশেষজ্ঞ',
  'Gyne & Obstetrician': 'স্ত্রীরোগ ও প্রসূতি বিশেষজ্ঞ',
  'Gyane & Obstetrician': 'স্ত্রীরোগ ও প্রসূতি বিশেষজ্ঞ',
  'Cardiologist': 'হৃদরোগ বিশেষজ্ঞ',
  'Pediatrician': 'শিশুরোগ বিশেষজ্ঞ',
  'Neurologist': 'স্নায়ুরোগ বিশেষজ্ঞ',
  'Orthopedic': 'অস্থিরোগ বিশেষজ্ঞ',
  'Dermatologist': 'চর্মরোগ বিশেষজ্ঞ',
  'Psychiatrist': 'মানসিক রোগ বিশেষজ্ঞ',
  'General Physician': 'সাধারণ চিকিৎসক',
  'Surgery': 'সার্জারি',
  'Chest Diseases': 'বক্ষরোগ',
  'Medicine and Chest Diseases Specialist': 'মেডিসিন ও বক্ষরোগ বিশেষজ্ঞ',
  'Chest Disease Specialist': 'বক্ষরোগ বিশেষজ্ঞ',
  
  // Job Titles
  'Former Professor': 'প্রাক্তন অধ্যাপক',
  'Former Professor of Medicine': 'প্রাক্তন অধ্যাপক, মেডিসিন',
  'Professor': 'অধ্যাপক',
  'Professor of Medicine': 'অধ্যাপক, মেডিসিন',
  'Associate Professor': 'সহযোগী অধ্যাপক',
  'Assistant Professor': 'সহকারী অধ্যাপক',
  'Senior Consultant': 'সিনিয়র কনসালট্যান্ট',
  'Consultant': 'কনসালট্যান্ট',
  'Resident': 'রেসিডেন্ট',
  
  // Institutions
  'Armed Forces Medical College': 'আর্মড ফোর্সেস মেডিকেল কলেজ',
  'CMH': 'সি.এম.এইচ',
  'CMH Dhaka': 'সি.এম.এইচ ঢাকা',
  'C.M.H. Dhaka': 'সি.এম.এইচ ঢাকা',
  'Dhaka': 'ঢাকা',
  '&': 'ও',
  'and': 'ও',
  'of': 'এর',
  'Department': 'বিভাগ',
  'Medicine Department': 'মেডিসিন বিভাগ',
  'College': 'কলেজ',
  'Medical College': 'মেডিকেল কলেজ',
  'Hospital': 'হাসপাতাল',
  'Medical': 'মেডিকেল',
  'Former': 'প্রাক্তন',
  'Years': 'বছর',
  'Experience': 'অভিজ্ঞতা',
};

// Translate English medical terms to Bengali - More comprehensive
export const translateToBengali = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // If already has Bengali characters, return as is
  if (/[\u0980-\u09FF]/.test(text)) {
    return text;
  }
  
  let translated = text;
  
  // Sort by length (longest first) to avoid partial replacements
  const sortedKeys = Object.keys(medicalTranslations).sort((a, b) => b.length - a.length);
  
  // Replace common medical terms
  sortedKeys.forEach(english => {
    const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    translated = translated.replace(regex, medicalTranslations[english]);
  });
  
  return translated;
};

// Auto-translate qualification
export const translateQualification = (qualification) => {
  if (!qualification) return '';
  
  // If already has Bengali characters, return as is
  if (/[\u0980-\u09FF]/.test(qualification)) {
    return qualification;
  }
  
  return translateToBengali(qualification);
};

// Auto-translate specialization
export const translateSpecialization = (specialization) => {
  if (!specialization) return '';
  
  // If already has Bengali characters, return as is
  if (/[\u0980-\u09FF]/.test(specialization)) {
    return specialization;
  }
  
  return translateToBengali(specialization);
};

// Auto-translate previous jobs array
export const translatePreviousJobs = (previousJobs) => {
  if (!Array.isArray(previousJobs) || previousJobs.length === 0) return [];
  
  return previousJobs.map(job => {
    if (typeof job === 'string') {
      // If already has Bengali characters, return as is
      if (/[\u0980-\u09FF]/.test(job)) {
        return job;
      }
      return translateToBengali(job);
    } else if (typeof job === 'object' && job !== null) {
      // Handle object format
      const translated = { ...job };
      if (job.title && !/[\u0980-\u09FF]/.test(job.title)) {
        translated.title = translateToBengali(job.title);
      }
      if (job.position && !/[\u0980-\u09FF]/.test(job.position)) {
        translated.position = translateToBengali(job.position);
      }
      if (job.hospital && !/[\u0980-\u09FF]/.test(job.hospital)) {
        translated.hospital = translateToBengali(job.hospital);
      }
      return translated;
    }
    return job;
  });
};

// Format doctor name (remove duplicate "Dr.")
export const formatDoctorName = (name) => {
  if (!name) return '';
  
  // Remove "Dr." prefix if exists
  let formattedName = name.trim();
  if (formattedName.toLowerCase().startsWith('dr.') || formattedName.toLowerCase().startsWith('dr ')) {
    formattedName = formattedName.replace(/^dr\.?\s*/i, '');
  }
  
  return formattedName;
};

// Enrich doctor with Bengali translations if Bengali fields are missing
export const enrichDoctorWithBengali = async (doctor) => {
  if (!doctor) return doctor;
  
  let needsUpdate = false;
  
  // Auto-translate qualification if Bengali version is missing
  if (doctor.qualification && !doctor.qualificationBn) {
    doctor.qualificationBn = translateQualification(doctor.qualification);
    needsUpdate = true;
  }
  
  // Auto-translate specialization if Bengali version is missing
  if (doctor.specialization && !doctor.specializationBn) {
    doctor.specializationBn = translateSpecialization(doctor.specialization);
    needsUpdate = true;
  }
  
  // Auto-translate previous jobs if Bengali version is missing
  if (doctor.previousJobs && Array.isArray(doctor.previousJobs) && doctor.previousJobs.length > 0 && (!doctor.previousJobsBn || (Array.isArray(doctor.previousJobsBn) && doctor.previousJobsBn.length === 0))) {
    doctor.previousJobsBn = translatePreviousJobs(doctor.previousJobs);
    needsUpdate = true;
  }
  
  // If updates are needed, save the doctor
  if (needsUpdate && doctor.save) {
    await doctor.save();
  }
  
  return doctor;
};

