import Department from '../models/Department.js';

class MedicalAIChatbot {
  constructor() {
    // Comprehensive department-based medical database
    this.departmentDatabase = {
      'Cardiology': {
        keywords: ['heart', 'chest pain', 'cardiac', 'hypertension', 'blood pressure', 'palpitation', 'arrhythmia', 'heart attack', 'angina', 'coronary', 'bp', 'high bp', 'low bp', 'heartbeat', 'irregular heartbeat'],
        commonDiseases: ['Hypertension', 'Coronary Artery Disease', 'Arrhythmia', 'Heart Failure', 'Angina Pectoris', 'Myocardial Infarction', 'Atrial Fibrillation'],
        medicines: [
          ['Aspirin 75mg', 'Atorvastatin 20mg', 'Metoprolol 25mg'],
          ['Amlodipine 5mg', 'Enalapril 5mg', 'Clopidogrel 75mg'],
          ['Atenolol 50mg', 'Losartan 50mg', 'Furosemide 40mg']
        ],
        tests: ['ECG', 'Echocardiography', 'Stress Test', 'Cardiac Catheterization', 'Lipid Profile', 'Troponin Test'],
        rules: ['Low salt diet', 'Regular exercise', 'Monitor BP daily', 'Avoid smoking', 'Limit alcohol', 'Weight management'],
        instructions: [
          'Take medicines as prescribed. Monitor blood pressure regularly. Follow up after 2 weeks.',
          'Take medications with food. Check BP twice daily. Avoid excessive salt intake. Regular follow-up recommended.',
          'Follow medication schedule strictly. Maintain healthy lifestyle. Monitor heart rate. Emergency contact if chest pain occurs.'
        ]
      },
      'Neurology': {
        keywords: ['headache', 'migraine', 'seizure', 'epilepsy', 'dizziness', 'vertigo', 'stroke', 'paralysis', 'numbness', 'tremor', 'parkinson', 'memory loss', 'forgetfulness', 'convulsion', 'fainting'],
        commonDiseases: ['Migraine', 'Epilepsy', 'Parkinson\'s Disease', 'Stroke', 'Multiple Sclerosis', 'Alzheimer\'s Disease', 'Tension Headache', 'Cluster Headache'],
        medicines: [
          ['Paracetamol 500mg', 'Sumatriptan 50mg', 'Carbamazepine 200mg'],
          ['Ibuprofen 400mg', 'Topiramate 25mg', 'Levodopa 100mg'],
          ['Gabapentin 300mg', 'Amitriptyline 25mg', 'Propranolol 40mg']
        ],
        tests: ['CT Scan Brain', 'MRI Brain', 'EEG', 'Nerve Conduction Study', 'Lumbar Puncture', 'Doppler Study'],
        rules: ['Adequate sleep', 'Avoid triggers', 'Regular medication', 'Stress management', 'Stay hydrated', 'Avoid bright lights'],
        instructions: [
          'Take medicines regularly. Avoid known triggers. Maintain sleep schedule.',
          'Take medications as prescribed. Identify and avoid headache triggers. Ensure adequate rest.',
          'Follow medication schedule. Keep headache diary. Consult if symptoms worsen or change pattern.'
        ]
      },
      'Orthopedics Surgery': {
        keywords: ['bone', 'fracture', 'joint pain', 'arthritis', 'back pain', 'knee', 'shoulder', 'spine', 'osteoporosis', 'dislocation', 'bone pain', 'joint swelling', 'stiffness', 'limited movement'],
        commonDiseases: ['Osteoarthritis', 'Rheumatoid Arthritis', 'Fracture', 'Osteoporosis', 'Disc Herniation', 'Tendonitis', 'Bursitis', 'Spinal Stenosis'],
        medicines: [
          ['Ibuprofen 400mg', 'Diclofenac 50mg', 'Calcium 500mg'],
          ['Naproxen 250mg', 'Celecoxib 200mg', 'Vitamin D3 1000IU'],
          ['Glucosamine 500mg', 'Chondroitin 400mg', 'Methylprednisolone 4mg']
        ],
        tests: ['X-Ray', 'MRI', 'Bone Density Test', 'CT Scan', 'Blood Test (ESR, CRP)', 'Arthroscopy'],
        rules: ['Rest affected area', 'Ice/heat therapy', 'Physical therapy', 'Avoid heavy lifting', 'Proper posture', 'Weight management'],
        instructions: [
          'Take pain medication with food. Apply ice for first 48 hours, then heat. Follow up for physiotherapy.',
          'Medications should be taken with meals. Rest the affected joint. Apply ice packs 3-4 times daily.',
          'Follow pain management protocol. Gentle exercises recommended. Avoid strenuous activities. Regular follow-up needed.'
        ]
      },
      'Paediatrics': {
        keywords: ['child', 'baby', 'infant', 'pediatric', 'growth', 'vaccination', 'fever child', 'cough child', 'diarrhea child', 'newborn', 'toddler', 'kid'],
        commonDiseases: ['Upper Respiratory Tract Infection', 'Gastroenteritis', 'Viral Fever', 'Bronchiolitis', 'Pneumonia', 'Ear Infection', 'Chickenpox', 'Measles'],
        medicines: [
          ['Paracetamol Syrup (15mg/kg)', 'Amoxicillin 125mg/5ml', 'ORS Solution'],
          ['Ibuprofen Suspension (10mg/kg)', 'Azithromycin 200mg/5ml', 'Salbutamol Inhaler'],
          ['Antihistamine Syrup', 'Antibiotic as per weight', 'Multivitamin Syrup']
        ],
        tests: ['Complete Blood Count', 'Chest X-Ray', 'Throat Swab', 'Stool Test', 'Urine Test', 'Blood Culture'],
        rules: ['Adequate hydration', 'Monitor temperature', 'Proper nutrition', 'Rest', 'Isolation if contagious', 'Vaccination check'],
        instructions: [
          'Give medicine as per weight-based dosing. Ensure child drinks plenty of fluids. Monitor for worsening symptoms.',
          'Follow pediatric dosing chart. Maintain hydration. Monitor temperature every 4 hours. Seek immediate care if high fever persists.',
          'Administer medications as per body weight. Encourage fluid intake. Watch for signs of dehydration. Regular follow-up recommended.'
        ]
      },
      'Dermatology (Skin & VD)': {
        keywords: ['skin', 'rash', 'eczema', 'psoriasis', 'acne', 'allergy', 'itching', 'dermatitis', 'fungal', 'infection', 'pimple', 'boil', 'hives', 'urticaria'],
        commonDiseases: ['Eczema', 'Psoriasis', 'Acne Vulgaris', 'Contact Dermatitis', 'Fungal Infection', 'Urticaria', 'Atopic Dermatitis', 'Seborrheic Dermatitis'],
        medicines: [
          ['Hydrocortisone Cream 1%', 'Clotrimazole Cream', 'Antihistamine (Cetirizine 10mg)'],
          ['Betamethasone Cream 0.1%', 'Miconazole Cream', 'Loratadine 10mg'],
          ['Benzoyl Peroxide Gel', 'Salicylic Acid Lotion', 'Fexofenadine 120mg']
        ],
        tests: ['Skin Scraping', 'Patch Test', 'Blood Test (IgE)', 'Skin Biopsy', 'Fungal Culture'],
        rules: ['Keep skin moisturized', 'Avoid irritants', 'Use mild soap', 'Protect from sun', 'Avoid scratching', 'Wear cotton clothes'],
        instructions: [
          'Apply cream twice daily on clean skin. Avoid scratching. Keep affected area dry and clean.',
          'Use topical medication as directed. Maintain good hygiene. Avoid known allergens. Sun protection recommended.',
          'Follow application schedule. Keep skin clean and dry. Avoid harsh chemicals. Regular follow-up for chronic conditions.'
        ]
      },
      'General Medicine': {
        keywords: ['fever', 'cough', 'cold', 'flu', 'infection', 'general', 'common', 'viral', 'bacterial', 'weakness', 'fatigue', 'body ache'],
        commonDiseases: ['Viral Fever', 'Upper Respiratory Tract Infection', 'Gastroenteritis', 'Common Cold', 'Urinary Tract Infection', 'Typhoid', 'Malaria'],
        medicines: [
          ['Paracetamol 500mg', 'Amoxicillin 500mg', 'Cough Syrup'],
          ['Ibuprofen 400mg', 'Azithromycin 500mg', 'Antihistamine'],
          ['Diclofenac 50mg', 'Ciprofloxacin 500mg', 'Multivitamin']
        ],
        tests: ['Complete Blood Count', 'Urine Test', 'Chest X-Ray', 'Blood Culture', 'Rapid Test'],
        rules: ['Rest', 'Hydration', 'Proper diet', 'Medication compliance', 'Isolation if contagious'],
        instructions: [
          'Take medicines as prescribed. Rest adequately. Stay hydrated. Follow up if symptoms persist.',
          'Follow medication schedule. Maintain adequate rest. Drink plenty of fluids. Monitor temperature.',
          'Complete full course of antibiotics. Rest is important. Stay hydrated. Seek medical attention if condition worsens.'
        ]
      },
      'Gastroenterology': {
        keywords: ['stomach', 'abdomen', 'gastritis', 'ulcer', 'liver', 'hepatitis', 'jaundice', 'indigestion', 'acid', 'reflux', 'constipation', 'bloating', 'nausea', 'vomiting'],
        commonDiseases: ['Gastritis', 'Peptic Ulcer', 'GERD', 'Hepatitis', 'Irritable Bowel Syndrome', 'Liver Disease', 'Acid Reflux', 'Gastroenteritis'],
        medicines: [
          ['Omeprazole 20mg', 'Pantoprazole 40mg', 'Domperidone 10mg'],
          ['Ranitidine 150mg', 'Esomeprazole 40mg', 'Metoclopramide 10mg'],
          ['Ursodeoxycholic Acid 300mg', 'Lansoprazole 30mg', 'Simethicone 40mg']
        ],
        tests: ['Upper GI Endoscopy', 'Liver Function Test', 'Ultrasound Abdomen', 'H. Pylori Test', 'Stool Test'],
        rules: ['Avoid spicy food', 'Eat small frequent meals', 'No smoking/alcohol', 'Low fat diet', 'Avoid late meals'],
        instructions: [
          'Take medicine 30 minutes before meals. Follow a bland diet. Avoid trigger foods.',
          'Medications should be taken on empty stomach. Eat small, frequent meals. Avoid spicy and oily foods.',
          'Follow dietary restrictions. Take medications as scheduled. Avoid alcohol and smoking. Regular follow-up needed.'
        ]
      },
      'ENT': {
        keywords: ['ear', 'nose', 'throat', 'sinus', 'hearing', 'tinnitus', 'tonsil', 'pharyngitis', 'otitis', 'rhinitis', 'sore throat', 'nasal congestion', 'ear discharge'],
        commonDiseases: ['Sinusitis', 'Otitis Media', 'Pharyngitis', 'Tonsillitis', 'Allergic Rhinitis', 'Hearing Loss', 'Laryngitis', 'Nasal Polyps'],
        medicines: [
          ['Amoxicillin 500mg', 'Nasal Decongestant', 'Antihistamine'],
          ['Azithromycin 500mg', 'Nasal Corticosteroid', 'Cough Suppressant'],
          ['Ciprofloxacin Ear Drops', 'Saline Nasal Spray', 'Ibuprofen 400mg']
        ],
        tests: ['Audiometry', 'CT Scan Sinus', 'Throat Swab', 'X-Ray Sinus', 'Nasal Endoscopy'],
        rules: ['Nasal irrigation', 'Avoid allergens', 'Proper hygiene', 'Rest voice', 'Warm salt gargle'],
        instructions: [
          'Use nasal spray as directed. Take antibiotics with food. Gargle with warm salt water.',
          'Follow nasal irrigation routine. Complete antibiotic course. Avoid allergens. Rest voice if needed.',
          'Use medications as prescribed. Maintain good hygiene. Avoid smoking. Regular follow-up for chronic conditions.'
        ]
      },
      'Diabetes & Endocrinology': {
        keywords: ['diabetes', 'sugar', 'glucose', 'insulin', 'thyroid', 'hormone', 'metabolic', 'hypoglycemia', 'hyperglycemia', 'high sugar', 'low sugar'],
        commonDiseases: ['Type 2 Diabetes', 'Type 1 Diabetes', 'Hypothyroidism', 'Hyperthyroidism', 'Metabolic Syndrome', 'PCOS'],
        medicines: [
          ['Metformin 500mg', 'Glibenclamide 5mg', 'Insulin'],
          ['Gliclazide 80mg', 'Pioglitazone 15mg', 'Levothyroxine 50mcg'],
          ['Sitagliptin 100mg', 'Vildagliptin 50mg', 'Thyroid Hormone']
        ],
        tests: ['Fasting Blood Sugar', 'HbA1c', 'Thyroid Function Test', 'Lipid Profile', 'OGTT'],
        rules: ['Low sugar diet', 'Regular exercise', 'Monitor blood sugar', 'Foot care', 'Weight management'],
        instructions: [
          'Take medicines as prescribed. Monitor blood sugar regularly. Follow diabetic diet. Regular follow-up.',
          'Follow medication schedule. Check blood sugar 2-3 times daily. Maintain diet plan. Exercise regularly.',
          'Strict medication compliance required. Monitor glucose levels. Follow dietary guidelines. Regular check-ups essential.'
        ]
      },
      'Psychiatry': {
        keywords: ['depression', 'anxiety', 'stress', 'mental', 'psychiatric', 'mood', 'panic', 'bipolar', 'schizophrenia', 'insomnia', 'worry', 'sadness'],
        commonDiseases: ['Major Depression', 'Anxiety Disorder', 'Bipolar Disorder', 'Panic Disorder', 'Schizophrenia', 'Insomnia'],
        medicines: [
          ['Sertraline 50mg', 'Fluoxetine 20mg', 'Alprazolam 0.25mg'],
          ['Escitalopram 10mg', 'Venlafaxine 75mg', 'Clonazepam 0.5mg'],
          ['Olanzapine 5mg', 'Risperidone 2mg', 'Trazodone 50mg']
        ],
        tests: ['Psychological Assessment', 'Blood Test', 'Thyroid Function Test', 'ECG'],
        rules: ['Regular therapy', 'Medication compliance', 'Healthy lifestyle', 'Support system', 'Sleep hygiene'],
        instructions: [
          'Take medicines regularly as prescribed. Attend therapy sessions. Maintain healthy routine.',
          'Follow medication schedule strictly. Engage in therapy. Practice stress management techniques. Regular follow-up.',
          'Medications may take 2-4 weeks to show effect. Continue therapy. Maintain support network. Emergency contact available.'
        ]
      },
      'Gyane & Obstetrician': {
        keywords: ['pregnancy', 'menstrual', 'gynecological', 'ovarian', 'uterine', 'menopause', 'pcos', 'endometriosis', 'period', 'menstruation'],
        commonDiseases: ['PCOS', 'Endometriosis', 'Menstrual Disorders', 'Urinary Tract Infection', 'Vaginal Infection', 'Menopause Symptoms'],
        medicines: [
          ['Oral Contraceptives', 'Metronidazole 400mg', 'Folic Acid 5mg'],
          ['Progesterone', 'Clotrimazole Vaginal Cream', 'Iron Supplement'],
          ['Combined Hormone Therapy', 'Antibiotic as needed', 'Calcium Supplement']
        ],
        tests: ['Ultrasound Pelvis', 'Pap Smear', 'Hormone Test', 'Urine Test', 'Blood Test'],
        rules: ['Regular check-ups', 'Healthy diet', 'Exercise', 'Hygiene', 'Avoid smoking'],
        instructions: [
          'Take medicines as prescribed. Regular follow-up. Maintain personal hygiene.',
          'Follow medication schedule. Regular gynecological check-ups. Maintain healthy lifestyle.',
          'Complete treatment course. Follow-up appointments essential. Practice safe methods. Regular screening recommended.'
        ]
      },
      'Urology': {
        keywords: ['urinary', 'bladder', 'kidney', 'prostate', 'urination', 'uti', 'kidney stone', 'renal', 'frequent urination', 'burning urination'],
        commonDiseases: ['Urinary Tract Infection', 'Kidney Stone', 'Benign Prostatic Hyperplasia', 'Urinary Incontinence', 'Prostatitis'],
        medicines: [
          ['Ciprofloxacin 500mg', 'Tamsulosin 0.4mg', 'Oxybutynin 5mg'],
          ['Levofloxacin 500mg', 'Doxazosin 2mg', 'Tolterodine 2mg'],
          ['Nitrofurantoin 100mg', 'Finasteride 5mg', 'Solifenacin 5mg']
        ],
        tests: ['Urine Test', 'Ultrasound KUB', 'PSA Test', 'CT Scan', 'Cystoscopy'],
        rules: ['Increase fluid intake', 'Avoid caffeine', 'Proper hygiene', 'Regular voiding', 'Cranberry juice'],
        instructions: [
          'Drink plenty of water. Take antibiotics as prescribed. Complete full course.',
          'Maintain adequate hydration. Follow medication schedule. Practice good hygiene. Regular follow-up.',
          'Increase fluid intake to 2-3 liters daily. Complete antibiotic course. Avoid irritants. Monitor symptoms.'
        ]
      }
    };

    // Expanded symptom database with more variations
    this.symptomDatabase = {
      fever: { 
        priority: 5, 
        departments: ['General Medicine', 'Paediatrics', 'Infectious Disease'],
        relatedDiagnosis: ['Viral Infection', 'Bacterial Infection', 'Influenza', 'Common Cold', 'UTI', 'Typhoid', 'Malaria'],
        medicines: [
          ['Paracetamol 500mg', 'Ibuprofen 400mg', 'Amoxicillin 500mg'],
          ['Paracetamol 500mg', 'Azithromycin 500mg', 'Multivitamin'],
          ['Paracetamol 500mg', 'Ciprofloxacin 500mg', 'ORS']
        ],
        tests: ['Complete Blood Count (CBC)', 'C-Reactive Protein (CRP)', 'Blood Culture', 'Rapid Test'],
        rules: ['Take plenty of rest', 'Stay hydrated', 'Monitor temperature regularly', 'Isolation if contagious'],
        instructions: [
          'Take medicine with food. If fever persists for more than 3 days, consult doctor immediately.',
          'Monitor temperature every 4-6 hours. Stay well hydrated. Rest adequately.',
          'Take antipyretics as needed. Maintain fluid intake. Seek medical attention if fever is high or persistent.'
        ]
      },
      headache: {
        priority: 4,
        departments: ['Neurology', 'General Medicine'],
        relatedDiagnosis: ['Tension Headache', 'Migraine', 'Sinusitis', 'Hypertension', 'Cluster Headache'],
        medicines: [
          ['Paracetamol 500mg', 'Sumatriptan 50mg', 'Aspirin 325mg'],
          ['Ibuprofen 400mg', 'Ergotamine', 'Metoclopramide 10mg'],
          ['Paracetamol 500mg', 'Propranolol 40mg', 'Amitriptyline 25mg']
        ],
        tests: ['Blood Pressure Check', 'CT Scan Brain', 'MRI Brain', 'Eye Examination'],
        rules: ['Avoid bright lights', 'Stay in quiet environment', 'Apply cold compress', 'Adequate sleep'],
        instructions: [
          'Take medicine as needed. If headache is severe or persistent, seek medical attention.',
          'Take medication at onset of headache. Rest in dark, quiet room. Avoid triggers.',
          'Follow medication schedule. Identify and avoid triggers. Maintain sleep schedule.'
        ]
      },
      cough: {
        priority: 4,
        departments: ['Chest Medicine', 'General Medicine', 'Paediatrics'],
        relatedDiagnosis: ['Upper Respiratory Tract Infection', 'Bronchitis', 'Asthma', 'Pneumonia', 'Tuberculosis'],
        medicines: [
          ['Cough Syrup (Dextromethorphan)', 'Ambroxol 30mg', 'Salbutamol Inhaler'],
          ['Guaifenesin', 'Bromhexine 8mg', 'Inhaler'],
          ['Codeine Syrup', 'Acetylcysteine', 'Combination Inhaler']
        ],
        tests: ['Chest X-Ray', 'Sputum Culture', 'Pulmonary Function Test', 'Blood Test'],
        rules: ['Avoid cold drinks', 'Stay warm', 'Gargle with warm salt water', 'Avoid smoking'],
        instructions: [
          'Take cough syrup before bedtime. Avoid smoking and exposure to dust.',
          'Use cough suppressant as needed. Maintain hydration. Avoid irritants.',
          'Follow medication schedule. Use inhaler as prescribed. Regular follow-up if chronic.'
        ]
      },
      'chest pain': {
        priority: 6,
        departments: ['Cardiology', 'Chest Medicine'],
        relatedDiagnosis: ['Angina', 'Myocardial Infarction', 'GERD', 'Pneumonia', 'Pericarditis'],
        medicines: [
          ['Aspirin 75mg', 'Nitroglycerin', 'Antacid'],
          ['Clopidogrel 75mg', 'Atorvastatin 20mg', 'Omeprazole 20mg'],
          ['Metoprolol 25mg', 'ACE Inhibitor', 'Pain Reliever']
        ],
        tests: ['ECG', 'Chest X-Ray', 'Cardiac Enzymes', 'Echocardiography', 'Stress Test'],
        rules: ['Immediate medical attention', 'Rest', 'Avoid exertion', 'Monitor closely'],
        instructions: [
          '⚠️ URGENT: If severe chest pain, seek immediate emergency care. This could be a heart attack.',
          '⚠️ CRITICAL: Chest pain requires immediate evaluation. Do not ignore. Call emergency services.',
          '⚠️ EMERGENCY: Seek immediate medical attention. Do not delay. This may be cardiac in origin.'
        ]
      },
      'stomach pain': {
        priority: 5,
        departments: ['Gastroenterology', 'General Medicine'],
        relatedDiagnosis: ['Gastritis', 'Gastroenteritis', 'Peptic Ulcer', 'Irritable Bowel Syndrome', 'Appendicitis'],
        medicines: [
          ['Antacid (Omeprazole 20mg)', 'Domperidone 10mg', 'Dicyclomine 10mg'],
          ['Pantoprazole 40mg', 'Metoclopramide 10mg', 'Hyoscine'],
          ['Ranitidine 150mg', 'Simethicone 40mg', 'Antispasmodic']
        ],
        tests: ['Stool Test', 'Upper GI Endoscopy', 'Ultrasound Abdomen', 'H. Pylori Test'],
        rules: ['Avoid spicy and oily food', 'Eat small frequent meals', 'Stay hydrated', 'Avoid smoking'],
        instructions: [
          'Take antacid 30 minutes before meals. Follow a bland diet for few days.',
          'Medications before meals. Follow dietary restrictions. Avoid trigger foods.',
          'Take medicines as scheduled. Maintain bland diet. Regular follow-up if persistent.'
        ]
      },
      'joint pain': {
        priority: 4,
        departments: ['Orthopedics Surgery', 'Rheumatology'],
        relatedDiagnosis: ['Osteoarthritis', 'Rheumatoid Arthritis', 'Gout', 'Tendonitis', 'Bursitis'],
        medicines: [
          ['Ibuprofen 400mg', 'Diclofenac 50mg', 'Allopurinol 100mg'],
          ['Naproxen 250mg', 'Celecoxib 200mg', 'Colchicine'],
          ['Methotrexate', 'Sulfasalazine', 'Hydroxychloroquine']
        ],
        tests: ['X-Ray of affected area', 'Blood Test (ESR, CRP, Uric Acid)', 'Joint Fluid Analysis', 'RA Factor'],
        rules: ['Rest the affected area', 'Apply ice pack', 'Avoid heavy lifting', 'Physical therapy'],
        instructions: [
          'Take pain medication with food. If pain persists, consult orthopedic specialist.',
          'Follow pain management protocol. Rest affected joint. Apply ice/heat therapy.',
          'Medications with meals. Gentle exercises. Avoid overuse. Regular follow-up needed.'
        ]
      },
      'skin rash': {
        priority: 3,
        departments: ['Dermatology (Skin & VD)'],
        relatedDiagnosis: ['Eczema', 'Contact Dermatitis', 'Allergic Reaction', 'Fungal Infection', 'Psoriasis'],
        medicines: [
          ['Hydrocortisone Cream 1%', 'Antihistamine (Cetirizine 10mg)', 'Clotrimazole Cream'],
          ['Betamethasone Cream', 'Loratadine 10mg', 'Miconazole'],
          ['Topical Steroid', 'Fexofenadine 120mg', 'Antifungal Cream']
        ],
        tests: ['Skin Scraping', 'Patch Test', 'Blood Test (IgE)', 'Skin Biopsy'],
        rules: ['Keep skin moisturized', 'Avoid irritants', 'Use mild soap', 'Protect from sun'],
        instructions: [
          'Apply cream twice daily on clean skin. Avoid scratching. Keep affected area dry.',
          'Use topical medication as directed. Maintain hygiene. Avoid allergens.',
          'Follow application schedule. Keep clean and dry. Regular follow-up for chronic cases.'
        ]
      },
      'ear pain': {
        priority: 4,
        departments: ['ENT'],
        relatedDiagnosis: ['Otitis Media', 'Ear Infection', 'Eustachian Tube Dysfunction', 'Otitis Externa'],
        medicines: [
          ['Amoxicillin 500mg', 'Ear Drops', 'Pain Reliever'],
          ['Azithromycin 500mg', 'Antibiotic Ear Drops', 'Ibuprofen 400mg'],
          ['Ciprofloxacin Ear Drops', 'Combination Drops', 'Paracetamol 500mg']
        ],
        tests: ['Otoscopy', 'Audiometry', 'Tympanometry', 'Culture'],
        rules: ['Keep ear dry', 'Avoid inserting objects', 'Proper hygiene', 'Avoid swimming'],
        instructions: [
          'Use ear drops as prescribed. Keep ear protected from water.',
          'Follow medication schedule. Keep ear clean and dry. Avoid water entry.',
          'Complete antibiotic course. Maintain ear hygiene. Regular follow-up if persistent.'
        ]
      },
      'vision problem': {
        priority: 5,
        departments: ['Ophthalmology'],
        relatedDiagnosis: ['Refractive Error', 'Cataract', 'Glaucoma', 'Diabetic Retinopathy', 'Conjunctivitis'],
        medicines: [
          ['Eye Drops', 'Artificial Tears', 'Antibiotic Drops'],
          ['Glaucoma Drops', 'Steroid Drops', 'Lubricating Drops'],
          ['Antihistamine Drops', 'Combination Drops', 'Vitamin Supplements']
        ],
        tests: ['Eye Examination', 'Fundoscopy', 'Visual Field Test', 'Tonometry'],
        rules: ['Protect from bright light', 'Regular eye check-up', 'Proper lighting', 'Eye hygiene'],
        instructions: [
          'Use eye drops as prescribed. Avoid rubbing eyes. Protect from dust.',
          'Follow drop schedule. Maintain eye hygiene. Avoid strain. Regular check-ups.',
          'Use medications as directed. Protect eyes from bright light. Regular ophthalmology follow-up.'
        ]
      }
    };

    // Common medical patterns
    this.medicalPatterns = [
      { pattern: /fever|cough|cold|flu/i, severity: 'moderate', duration: '3-7 days', department: 'General Medicine' },
      { pattern: /stomach|nausea|diarrhea|vomiting/i, severity: 'moderate', duration: '2-5 days', department: 'Gastroenterology' },
      { pattern: /headache|migraine|head pain/i, severity: 'mild', duration: '1-3 days', department: 'Neurology' },
      { pattern: /chest|heart|cardiac|bp|blood pressure/i, severity: 'high', duration: 'immediate', department: 'Cardiology' },
      { pattern: /bone|joint|fracture|arthritis/i, severity: 'moderate', duration: '2-6 weeks', department: 'Orthopedics Surgery' },
      { pattern: /skin|rash|eczema|itching/i, severity: 'mild', duration: '1-2 weeks', department: 'Dermatology (Skin & VD)' },
      { pattern: /ear|nose|throat|sinus/i, severity: 'moderate', duration: '3-7 days', department: 'ENT' },
      { pattern: /eye|vision|sight|blurred/i, severity: 'moderate', duration: 'varies', department: 'Ophthalmology' },
      { pattern: /child|baby|pediatric|infant/i, severity: 'moderate', duration: '3-7 days', department: 'Paediatrics' },
      { pattern: /diabetes|sugar|glucose|insulin/i, severity: 'moderate', duration: 'chronic', department: 'Diabetes & Endocrinology' },
      { pattern: /depression|anxiety|stress|mental/i, severity: 'moderate', duration: 'varies', department: 'Psychiatry' },
      { pattern: /pregnancy|menstrual|period|gynecological/i, severity: 'moderate', duration: 'varies', department: 'Gyne & Obstetrician' },
      { pattern: /urinary|bladder|kidney|uti/i, severity: 'moderate', duration: '3-7 days', department: 'Urology' }
    ];
  }

  // Extract symptoms from problem description with better matching
  extractSymptoms(problem) {
    const symptoms = [];
    const problemLower = problem.toLowerCase();
    const problemWords = problemLower.split(/\s+/);
    
    // Direct symptom matching
    for (const [symptom, data] of Object.entries(this.symptomDatabase)) {
      if (problemLower.includes(symptom)) {
        symptoms.push({ symptom, ...data });
      }
    }

    // Word-based matching for better detection
    const symptomKeywords = {
      'fever': ['fever', 'temperature', 'hot', 'burning', 'pyrexia'],
      'cough': ['cough', 'coughing', 'hacking', 'sputum'],
      'headache': ['headache', 'head pain', 'migraine', 'head ache', 'cephalgia'],
      'stomach pain': ['stomach', 'stomachache', 'abdominal', 'belly', 'gastric', 'gastritis', 'indigestion'],
      'joint pain': ['joint', 'pain', 'ache', 'sore', 'hurt', 'arthritis', 'arthralgia'],
      'chest pain': ['chest', 'lung', 'breathing', 'respiratory', 'heart', 'cardiac', 'thoracic'],
      'skin rash': ['rash', 'skin', 'itching', 'dermatitis', 'eczema', 'psoriasis'],
      'ear pain': ['ear', 'hearing', 'tinnitus', 'otalgia', 'earache'],
      'vision problem': ['vision', 'eye', 'blurred', 'sight', 'ocular', 'visual']
    };

    for (const [symptom, keywords] of Object.entries(symptomKeywords)) {
      const hasKeyword = keywords.some(keyword => 
        problemWords.includes(keyword) || problemLower.includes(keyword)
      );
      
      if (hasKeyword && !symptoms.find(s => s.symptom === symptom) && this.symptomDatabase[symptom]) {
        symptoms.push({ symptom, ...this.symptomDatabase[symptom] });
      }
    }

    return symptoms;
  }

  // Get random element from array
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Detect department from problem description
  detectDepartment(problem) {
    const problemLower = problem.toLowerCase();
    const problemWords = problemLower.split(/\s+/);
    
    // Check department keywords with word matching
    for (const [deptName, deptData] of Object.entries(this.departmentDatabase)) {
      for (const keyword of deptData.keywords) {
        if (problemWords.includes(keyword) || problemLower.includes(keyword)) {
          return { name: deptName, data: deptData };
        }
      }
    }

    // Check medical patterns
    for (const pattern of this.medicalPatterns) {
      if (pattern.pattern.test(problem)) {
        const dept = this.departmentDatabase[pattern.department];
        if (dept) {
          return { name: pattern.department, data: dept };
        }
      }
    }

    // Check symptoms for department mapping
    const symptoms = this.extractSymptoms(problem);
    if (symptoms.length > 0) {
      const primarySymptom = symptoms[0];
      if (primarySymptom.departments && primarySymptom.departments.length > 0) {
        const deptName = primarySymptom.departments[0];
        const dept = this.departmentDatabase[deptName];
        if (dept) {
          return { name: deptName, data: dept };
        }
      }
    }

    return null;
  }

  // Calculate symptom score
  calculateSymptomScore(symptoms) {
    return symptoms.reduce((score, s) => score + s.priority, 0);
  }

  // Determine severity and duration
  determineSeverityAndDuration(problem) {
    const problemLower = problem.toLowerCase();
    
    for (const pattern of this.medicalPatterns) {
      if (pattern.pattern.test(problem)) {
        return {
          severity: pattern.severity,
          duration: pattern.duration,
          department: pattern.department
        };
      }
    }

    return {
      severity: 'moderate',
      duration: '3-5 days',
      department: 'General Medicine'
    };
  }

  // Generate intelligent prescription suggestions with variation
  generatePrescription(problem) {
    const symptoms = this.extractSymptoms(problem);
    const score = this.calculateSymptomScore(symptoms);
    const { severity, duration } = this.determineSeverityAndDuration(problem);
    
    // Detect department
    const detectedDept = this.detectDepartment(problem);

    // If no specific symptoms found, provide general suggestions
    if (symptoms.length === 0 && !detectedDept) {
      return {
        diagnosis: 'General Consultation Required',
        medicines: ['Multivitamin', 'General Health Check'],
        tests: ['Complete Blood Count (CBC)'],
        rules: ['Maintain healthy diet', 'Get adequate rest', 'Stay hydrated'],
        instructions: 'Please provide more specific symptoms for accurate diagnosis. Consult doctor for detailed examination.'
      };
    }

    // If department detected, use department-specific data with variation
    if (detectedDept) {
      const deptData = detectedDept.data;
      const extractedSymptoms = this.extractSymptoms(problem);
      
      // Randomly select from available options for variation
      const diagnosis = this.getRandomElement(deptData.commonDiseases);
      const instructions = this.getRandomElement(deptData.instructions);
      
      // Select medicines with variation
      let medicines = [];
      if (extractedSymptoms.length > 0) {
        const primarySymptom = extractedSymptoms[0];
        if (primarySymptom.medicines && primarySymptom.medicines.length > 0) {
          const symptomMedicines = this.getRandomElement(primarySymptom.medicines);
          const deptMedicines = this.getRandomElement(deptData.medicines);
          medicines = [...new Set([...deptMedicines.slice(0, 2), ...symptomMedicines.slice(0, 2)])];
        } else {
          medicines = this.getRandomElement(deptData.medicines);
        }
      } else {
        medicines = this.getRandomElement(deptData.medicines);
      }

      // Select tests with variation
      const tests = deptData.tests.slice(0, Math.min(4, deptData.tests.length));
      
      // Combine rules
      const rules = [...deptData.rules];
      if (extractedSymptoms.length > 0) {
        extractedSymptoms.forEach(s => {
          if (s.rules) {
            rules.push(...s.rules);
          }
        });
      }

      // Generate instructions with variation
      let finalInstructions = instructions;
      if (severity === 'high') {
        finalInstructions = `⚠️ URGENT: ${finalInstructions} Seek immediate medical attention if symptoms worsen.`;
      } else if (score > 8) {
        finalInstructions = `⚠️ ${finalInstructions} Monitor symptoms closely and consult doctor if condition doesn't improve in ${duration}.`;
      }

      // Add department recommendation
      finalInstructions += ` Recommended department: ${detectedDept.name}.`;

      return {
        diagnosis,
        medicines,
        tests,
        rules: [...new Set(rules)],
        instructions: finalInstructions,
        department: detectedDept.name
      };
    }

    // Fallback to symptom-based approach with variation
    symptoms.sort((a, b) => b.priority - a.priority);
    const primarySymptom = symptoms[0];

    // Randomly select diagnosis from related diagnoses
    let diagnosis = this.getRandomElement(primarySymptom.relatedDiagnosis);
    if (symptoms.length > 1) {
      const secondarySymptom = symptoms[1];
      const secondaryDiagnosis = this.getRandomElement(secondarySymptom.relatedDiagnosis);
      diagnosis = `${diagnosis} with ${secondaryDiagnosis}`;
    }

    // Select medicines with variation
    const medicines = this.getRandomElement(primarySymptom.medicines);
    
    // Select tests
    const tests = primarySymptom.tests.slice(0, Math.min(4, primarySymptom.tests.length));
    
    // Combine rules
    const rules = [...new Set(symptoms.flatMap(s => s.rules))];

    // Select instructions with variation
    let instructions = this.getRandomElement(primarySymptom.instructions);
    if (severity === 'high') {
      instructions = `⚠️ URGENT: ${instructions} Seek immediate medical attention if symptoms worsen.`;
    } else if (score > 8) {
      instructions = `⚠️ ${instructions} Monitor symptoms closely and consult doctor if condition doesn't improve in ${duration}.`;
    }

    if (duration !== 'immediate') {
      instructions += ` Expected recovery time: ${duration}.`;
    }

    return {
      diagnosis,
      medicines,
      tests,
      rules,
      instructions
    };
  }
}

export default MedicalAIChatbot;
