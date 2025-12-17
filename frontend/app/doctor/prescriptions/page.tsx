'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/components/Loading';
import DoctorSidebar from '@/components/DoctorSidebar';
import MedicineAdPanel from '@/components/MedicineAdPanel';
import BottomAdPanel from '@/components/BottomAdPanel';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { formatDoctorName, formatDoctorNameBengali } from '@/utils/doctorName';
import { FiX, FiZap, FiCheck, FiEdit2, FiXCircle, FiFileText, FiMail, FiClipboard, FiActivity, FiBarChart2, FiAlertCircle, FiHeart, FiSave, FiEye, FiPrinter, FiPlus, FiCalendar, FiClock, FiLogOut } from 'react-icons/fi';

export default function DoctorPrescriptionsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [problem, setProblem] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);

  // Convert number to Roman numeral (lowercase)
  const toRomanNumeral = (num: number): string => {
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
    if (num <= romanNumerals.length) {
      return romanNumerals[num - 1];
    }
    // Fallback for numbers beyond x
    return String(num);
  };
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientEmail: '',
    diagnosis: '',
    medicines: '',
    tests: '',
    rules: '',
    instructions: '',
    advice: '',
    followUp: '',
  });
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'doctor')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchPrescriptions();
      fetchDoctorProfile();
      fetchTemplates();
    }
  }, [user]);

  // Fetch patient info when email changes
  useEffect(() => {
    if (prescriptionForm.patientEmail && showCreateModal) {
      const debounceTimer = setTimeout(() => {
        fetchPatientInfo(prescriptionForm.patientEmail);
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      setPatientInfo(null);
    }
  }, [prescriptionForm.patientEmail, showCreateModal]);

  // Check for patientEmail in query params and pre-fill form
  useEffect(() => {
    const patientEmail = searchParams.get('patientEmail');
    if (patientEmail) {
      setPrescriptionForm((prev) => ({
        ...prev,
        patientEmail: decodeURIComponent(patientEmail),
      }));
      setShowCreateModal(true);
      // Clean up URL
      router.replace('/doctor/prescriptions', { scroll: false });
    }
  }, [searchParams, router]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prescriptions?limit=100');
      setPrescriptions(response.data?.prescriptions || []);
    } catch (error: any) {
      console.error('Error fetching prescriptions:', error);
      // Set empty array on error to prevent UI crashes
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorProfile = async () => {
    try {
      const response = await api.get('/doctors/profile/me');
      setDoctorProfile(response.data.doctor);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const fetchPatientInfo = async (email: string) => {
    if (!email || !email.includes('@')) {
      setPatientInfo(null);
      return;
    }
    try {
      setLoadingPatient(true);
      let patient = null;
      
      // Try to search for patient using the new search endpoint
      try {
        const response = await api.get(`/users/search/patient?email=${encodeURIComponent(email)}`);
        if (response.data.user) {
          patient = response.data.user;
        }
      } catch (searchError: any) {
        // If search endpoint fails (404 or other), try finding from prescriptions
        if (searchError.response?.status !== 404) {
          console.error('Error searching for patient:', searchError);
        }
        
        try {
          const presResponse = await api.get(`/prescriptions?limit=100`);
          const prescriptions = presResponse.data.prescriptions || [];
          const foundPrescription = prescriptions.find((p: any) => p.patient?.email === email);
          if (foundPrescription?.patient) {
            patient = foundPrescription.patient;
          }
        } catch (presError) {
          console.error('Error fetching patient from prescriptions:', presError);
        }
      }
      
      if (patient) {
        // Calculate age
        let age = '';
        if (patient.dateOfBirth) {
          const birthDate = new Date(patient.dateOfBirth);
          const today = new Date();
          let years = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            years--;
          }
          age = `${years} years`;
        }
        setPatientInfo({
          ...patient,
          age,
        });
      } else {
        setPatientInfo(null);
      }
    } catch (error) {
      console.error('Error fetching patient info:', error);
      setPatientInfo(null);
    } finally {
      setLoadingPatient(false);
    }
  };

  const addProblem = () => {
    if (!problem.trim()) {
      showNotification('Please enter a problem description first', 'error');
      return;
    }
    setProblems(prev => [...prev, problem.trim()]);
    setProblem('');
  };

  const removeProblem = (index: number) => {
    setProblems(prev => prev.filter((_, i) => i !== index));
  };

    const fetchAISuggestions = async () => {
    // Combine all problems for suggestion
    const allProblems = problems.length > 0 
      ? problems.join('; ') + (problem.trim() ? `; ${problem.trim()}` : '')
      : problem.trim();

    if (!allProblems.trim()) {
      showNotification('Please add at least one problem description', 'error');
      return;
    }

    try {
      setLoadingSuggestions(true);
      const response = await api.post('/prescriptions/ai-suggestions', {
        problem: allProblems,
      });
      setSuggestions(response.data.suggestions);
      // No success notification - suggestions will show directly
    } catch (error: any) {
      console.error('Error fetching AI suggestions:', error);
      showNotification(error.response?.data?.message || 'Failed to generate AI suggestions', 'error');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const acceptSuggestion = (field: string, value: string) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreatePrescription = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const medicinesArray = prescriptionForm.medicines
        .split('\n')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
        .map((m) => {
          const parts = m.split('-').map((p) => p.trim());
          return {
            name: parts[0] || m,
            dosage: parts[1] || '',
            frequency: parts[2] || '',
          };
        });

      const testsArray = prescriptionForm.tests
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((t) => ({ name: t, description: '' }));

      const rulesArray = prescriptionForm.rules
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => r.length > 0)
        .map((r) => ({ title: r, description: '' }));

      // Combine instructions and followUp into instructions
      const combinedInstructions = [
        prescriptionForm.instructions,
        prescriptionForm.followUp && `Follow-up:\n${prescriptionForm.followUp}`,
      ].filter(Boolean).join('\n\n');

      // Use advice for rules if rules is empty
      const finalRules = rulesArray.length > 0 ? rulesArray : 
        (prescriptionForm.advice ? prescriptionForm.advice.split('\n').filter(a => a.trim()).map((a) => ({ title: a.trim(), description: '' })) : []);

      await api.post('/prescriptions', {
        patientEmail: prescriptionForm.patientEmail,
        diagnosis: prescriptionForm.diagnosis,
        medicines: medicinesArray,
        tests: testsArray,
        rules: finalRules,
        instructions: combinedInstructions || prescriptionForm.instructions,
      });

      showNotification('Prescription created successfully', 'success');
      setShowCreateModal(false);
      setPrescriptionForm({ patientEmail: '', diagnosis: '', medicines: '', tests: '', rules: '', instructions: '', advice: '', followUp: '' });
      setProblem('');
      setProblems([]);
      setSuggestions(null);
      setEditingTemplate(null);
      setTemplateName('');
      fetchPrescriptions();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to create prescription', 'error');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Template functions
  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await api.get('/templates');
      setTemplates(response.data?.templates || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      // Set empty array on error to prevent UI crashes
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (!templateName.trim()) {
        showNotification('Please enter a template name', 'error');
        return;
      }

      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate.id}`, {
          name: templateName,
          diagnosis: prescriptionForm.diagnosis,
          medicines: prescriptionForm.medicines,
          tests: prescriptionForm.tests,
          rules: prescriptionForm.rules,
          instructions: prescriptionForm.instructions,
          advice: prescriptionForm.advice,
          followUp: prescriptionForm.followUp,
        });
        showNotification('Template updated successfully', 'success');
      } else {
        await api.post('/templates', {
          name: templateName,
          diagnosis: prescriptionForm.diagnosis,
          medicines: prescriptionForm.medicines,
          tests: prescriptionForm.tests,
          rules: prescriptionForm.rules,
          instructions: prescriptionForm.instructions,
          advice: prescriptionForm.advice,
          followUp: prescriptionForm.followUp,
        });
        showNotification('Template saved successfully', 'success');
      }
      setShowTemplateModal(false);
      setTemplateName('');
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to save template', 'error');
    }
  };

  const handleLoadTemplate = (template: any) => {
    setPrescriptionForm({
      patientEmail: prescriptionForm.patientEmail, // Keep current patient email
      diagnosis: template.diagnosis || '',
      medicines: template.medicines || '',
      tests: template.tests || '',
      rules: template.rules || '',
      instructions: template.instructions || '',
      advice: template.advice || '',
      followUp: template.followUp || '',
    });
    setShowTemplateModal(false);
    setEditingTemplate(template);
    setTemplateName(template.name);
    showNotification('Template loaded. You can edit it now.', 'success');
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setPrescriptionForm({
      patientEmail: prescriptionForm.patientEmail,
      diagnosis: template.diagnosis || '',
      medicines: template.medicines || '',
      tests: template.tests || '',
      rules: template.rules || '',
      instructions: template.instructions || '',
      advice: template.advice || '',
      followUp: template.followUp || '',
    });
    setShowTemplateModal(false);
    setShowCreateModal(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.delete(`/templates/${templateId}`);
      showNotification('Template deleted successfully', 'success');
      fetchTemplates();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to delete template', 'error');
    }
  };

  // Print function with professional styling - exact same layout as form
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${patientInfo?.name || 'Patient'}</title>
          <style>
            @media print {
              @page {
                margin: 15mm;
                size: A4;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 11pt;
              line-height: 1.6;
              color: #000;
              background: #fff;
              padding: 20px;
              max-width: 100%;
              position: relative;
              overflow: visible;
            }
            /* Professional Watermark Background - Clean and Visible */
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 100pt;
              font-weight: 700;
              color: rgba(0, 102, 102, 0.18);
              z-index: 0;
              pointer-events: none;
              white-space: nowrap;
              font-family: 'Times New Roman', serif;
              letter-spacing: 6px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              opacity: 0.18 !important;
              display: block !important;
              text-shadow: none;
              line-height: 1;
            }
            body::before {
              content: 'MediWise';
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 100pt;
              font-weight: 700;
              color: rgba(0, 102, 102, 0.18);
              z-index: 0;
              pointer-events: none;
              white-space: nowrap;
              font-family: 'Times New Roman', serif;
              letter-spacing: 6px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              opacity: 0.18 !important;
              text-shadow: none;
              line-height: 1;
            }
            .container {
              position: relative;
              z-index: 1;
              max-width: 100%;
            }
            .header {
              border-bottom: 3px solid #000;
              padding-bottom: 15px;
              margin-bottom: 15px;
            }
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 10px;
            }
            .doctor-info-left {
              flex: 1;
            }
            .logo-container {
              width: 180px;
              height: auto;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
            }
            .logo-image {
              max-width: 100%;
              height: auto;
              object-fit: contain;
            }
            .doctor-name {
              font-size: 22pt;
              font-weight: bold;
              color: #006666;
              margin-bottom: 8px;
            }
            .doctor-name-bengali {
              font-size: 20pt;
              font-weight: bold;
              color: #006666;
              margin-bottom: 8px;
            }
            .doctor-details {
              font-size: 10pt;
              margin-bottom: 3px;
            }
            .doctor-details-bengali {
              font-size: 10pt;
              margin-bottom: 3px;
              color: #333;
            }
            .bilingual-section {
              margin-bottom: 10px;
            }
            .date-time {
              text-align: right;
              font-size: 10pt;
              font-weight: bold;
            }
            .patient-section {
              border-top: 2px solid #000;
              padding-top: 12px;
              margin-bottom: 15px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .patient-info-left {
              flex: 1;
            }
            .patient-label {
              font-size: 10pt;
              font-weight: bold;
              margin-bottom: 3px;
            }
            .patient-input {
              font-size: 10pt;
              padding: 5px;
              border: 2px solid #000;
              width: 100%;
              max-width: 300px;
            }
            .patient-info-right {
              text-align: right;
            }
            .patient-name {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 3px;
            }
            .patient-details {
              font-size: 10pt;
            }
            .two-column-layout {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-top: 15px;
              position: relative;
            }
            .two-column-layout::before {
              content: '';
              position: absolute;
              left: 50%;
              top: 0;
              bottom: 0;
              width: 3px;
              background-color: #0066cc;
              transform: translateX(-50%);
              z-index: 1;
            }
            .left-column, .right-column {
              display: flex;
              flex-direction: column;
              gap: 25px;
              position: relative;
              z-index: 2;
              background: white;
            }
            .section {
              padding-bottom: 0;
              margin-bottom: 0;
            }
            .section-title {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .section-content {
              font-size: 10pt;
              white-space: pre-wrap;
              line-height: 1.8;
              min-height: 40px;
              padding: 0;
              border: none;
              font-family: inherit;
            }
            .medicines-content {
              font-family: 'Courier New', monospace;
              font-size: 10pt;
            }
            .footer {
              margin-top: 40px;
              border-top: 2px solid #000;
              padding-top: 20px;
              font-size: 10pt;
              text-align: center;
            }
            .footer-content {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 20px;
            }
            .footer-logo {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: linear-gradient(135deg, #006666 0%, #004d4d 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14pt;
              flex-shrink: 0;
            }
            .footer-info {
              flex: 1;
              line-height: 1.8;
              text-align: center;
            }
            .footer-info bengali {
              font-family: 'Noto Sans Bengali', 'Kalpurush', 'Siyam Rupali', sans-serif;
            }
            .company-name {
              font-weight: bold;
              font-size: 12pt;
              margin-bottom: 8px;
              color: #006666;
              text-align: center;
            }
            .footer-text {
              font-size: 9pt;
              line-height: 1.6;
              margin-bottom: 5px;
              text-align: center;
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 5px;
              flex-wrap: wrap;
            }
            .hotline {
              font-weight: bold;
              color: #006666;
              margin-top: 8px;
              text-align: center;
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 5px;
              flex-wrap: wrap;
            }
            @media print {
              .watermark {
                display: block !important;
                opacity: 0.18 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                visibility: visible !important;
              }
              body::before {
                display: block !important;
                opacity: 0.18 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                visibility: visible !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              @page {
                margin: 15mm;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          <!-- Professional Watermark - Clean and Visible -->
          <div class="watermark" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100pt; font-weight: 700; color: rgba(0, 102, 102, 0.18); z-index: 0; pointer-events: none; white-space: nowrap; font-family: 'Times New Roman', serif; letter-spacing: 6px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; opacity: 0.18 !important; display: block !important; visibility: visible !important; text-shadow: none; line-height: 1;">MediWise</div>
          <div class="container">
            <!-- Header Section -->
            <div class="header">
              <div class="header-top">
                <div class="doctor-info-left">
                  <div class="doctor-name">${formatDoctorName(doctorProfile?.user?.name || user?.name || 'Name', doctorProfile?.qualification)}</div>
                  ${doctorProfile?.qualification ? `<div class="doctor-details">${doctorProfile.qualification}</div>` : ''}
                  ${doctorProfile?.specialization ? `<div class="doctor-details">${doctorProfile.specialization}</div>` : ''}
                  ${doctorProfile?.department?.name ? `<div class="doctor-details">${doctorProfile.department.name}</div>` : ''}
                  ${Array.isArray(doctorProfile?.previousJobs) && doctorProfile.previousJobs.length > 0 ? `
                    <div class="doctor-details">${doctorProfile.previousJobs.map((job: any) => 
                      typeof job === 'string' ? job : (job.title || job.position || job)
                    ).join(', ')}</div>
                  ` : ''}
                </div>
                <div class="logo-container">
                  <img src="/logo.png" alt="MediWise Logo" class="logo-image" onerror="this.style.display='none';" />
                </div>
              </div>
              <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                  ${(() => {
                    const fullName = patientInfo?.name || '';
                    const namePart = fullName ? `Patient: ${fullName}` : '';
                    const age = patientInfo?.age ? `    Age: ${patientInfo.age}` : '';
                    const weight = patientInfo?.weight ? `Weight: ${patientInfo.weight}kg` : '';
                    
                    return [namePart, age, weight].filter(Boolean).join(' ');
                  })()}
                </div>
                <div class="date-time">
                  ${(() => {
                    const date = new Date();
                    const day = String(date.getDate()).padStart(2, '0');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const month = monthNames[date.getMonth()];
                    const year = date.getFullYear();
                    const dateOnly = `${day} ${month}, ${year}`;
                    const timeOnly = format(date, 'h:mm a');
                    return `Date: ${dateOnly} Time: ${timeOnly}`;
                  })()}
                </div>
              </div>
            </div>
            

            <!-- Two Column Layout - Same as Form -->
            <div class="two-column-layout">
              <!-- Left Column -->
              <div class="left-column">
                ${prescriptionForm.diagnosis ? `
                <div class="section">
                  <div class="section-title">Diagnosis</div>
                  <div class="section-content">${prescriptionForm.diagnosis}</div>
                </div>
                ` : ''}
                
                ${prescriptionForm.tests ? `
                <div class="section">
                  <div class="section-title">Investigation</div>
                  <div class="section-content">${prescriptionForm.tests}</div>
                </div>
                ` : ''}

                ${(prescriptionForm.followUp || prescriptionForm.instructions) ? `
                <div class="section">
                  <div class="section-title">Follow up</div>
                  <div class="section-content">${prescriptionForm.followUp || prescriptionForm.instructions}</div>
                </div>
                ` : ''}
              </div>

              <!-- Right Column -->
              <div class="right-column">
                ${prescriptionForm.medicines ? `
                <div class="section">
                  <div class="section-title">Medicine</div>
                  <div class="section-content medicines-content">${prescriptionForm.medicines}</div>
                </div>
                ` : ''}

                ${(prescriptionForm.advice || prescriptionForm.rules) ? `
                <div class="section">
                  <div class="section-title">Advice</div>
                  <div class="section-content">${prescriptionForm.advice || prescriptionForm.rules}</div>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- Footer with Company Information -->
            <div class="footer">
              <div class="footer-info">
                <div class="company-name">MediWise</div>
                <div class="footer-text" style="font-family: 'Noto Sans Bengali', 'Kalpurush', 'Siyam Rupali', sans-serif;">
                  <span>চেম্বার: মেডিওয়াইজ কনসালটেশন সেন্টার</span>
                  <span>/</span>
                  <span>Chamber: MediWise Consultation Center</span>
                </div>
                <div class="hotline" style="font-family: 'Noto Sans Bengali', 'Kalpurush', 'Siyam Rupali', sans-serif;">
                  <span>সিরিয়ালের জন্য হটলাইন</span>
                  <span>/</span>
                  <span>Hotline for Serial: <strong>+8809658303665</strong></span>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <MedicineAdPanel targetAudience="doctor" />
      <DoctorSidebar user={user} logout={logout} qualification={doctorProfile?.qualification} />
      <BottomAdPanel />
      <main className="w-full flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 lg:ml-[476px] pb-[140px] overflow-x-hidden">
        {!showCreateModal ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 sm:mb-8 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Prescriptions</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage patient prescriptions</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTemplateModal(true);
                    setEditingTemplate(null);
                    setTemplateName('');
                  }}
                  className="px-4 py-2 border-2 border-teal-600 dark:border-teal-500 text-teal-600 dark:text-teal-400 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors font-medium flex items-center gap-2"
                >
                  <FiFileText />
                  Templates
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-2 bg-teal-600 dark:bg-teal-700 text-white rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors font-medium"
                >
                  + New Prescription
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{prescription.patient?.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{prescription.patient?.email}</p>
                </div>
              </div>
              {prescription.diagnosis && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diagnosis:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{prescription.diagnosis}</p>
                </div>
              )}
              {prescription.medicines && Array.isArray(prescription.medicines) && prescription.medicines.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medicines:</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                    {prescription.medicines.map((med: any, idx: number) => (
                      <li key={idx}>{typeof med === 'string' ? med : med.name || med}</li>
                    ))}
                  </ul>
                </div>
              )}
              {prescription.instructions && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructions:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{prescription.instructions}</p>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {format(parseISO(prescription.prescriptionDate || prescription.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
          ))}
        </div>

            {prescriptions.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center border border-gray-100 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-lg">No prescriptions yet</p>
              </div>
            )}
          </>
        ) : (
          /* Create Prescription Form - Inline on Page */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 min-h-[calc(100vh-200px)]">
            {/* Header with Back Button */}
            <div className="px-6 py-5 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-50 to-white dark:from-gray-800 dark:to-gray-800 shrink-0 flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">New Prescription</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Create a new prescription for your patient</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setPrescriptionForm({ patientEmail: '', diagnosis: '', medicines: '', tests: '', rules: '', instructions: '', advice: '', followUp: '' });
                  setProblem('');
                  setProblems([]);
                  setSuggestions(null);
                }}
                className="px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <FiX className="text-lg" />
                Back to Prescriptions
              </button>
            </div>
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
              {/* Professional Prescription Header */}
              <div className="px-6 py-5 border-b-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                <div className="flex justify-between items-start">
                  {/* Doctor Info - Left Side */}
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      {/* English Section - Left */}
                      <div>
                        <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">
                          {formatDoctorName(doctorProfile?.user?.name || user?.name || 'Name', doctorProfile?.qualification)}
                        </h2>
                        {doctorProfile?.qualification && (
                          <p className="text-base text-gray-800 dark:text-gray-200 font-medium mb-1">
                            {doctorProfile.qualification}
                          </p>
                        )}
                        {doctorProfile?.specialization && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                            {doctorProfile.specialization}
                          </p>
                        )}
                        {doctorProfile?.department?.name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {doctorProfile.department.name}
                          </p>
                        )}
                        {Array.isArray(doctorProfile?.previousJobs) && doctorProfile.previousJobs.length > 0 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {doctorProfile.previousJobs.map((job: any) => 
                              typeof job === 'string' ? job : (job.title || job.position || job)
                            ).join(', ')}
                          </p>
                        )}
                      </div>
                      
                      {/* Bengali Section - Right - Full Bengali Information */}
                      <div className="border-l border-gray-300 dark:border-gray-600 pl-4">
                        <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">
                          {formatDoctorNameBengali(doctorProfile?.user?.name || user?.name || 'নাম', doctorProfile?.qualification)}
                        </h2>
                        {/* Qualifications in Bengali - Must show ALL if English exists */}
                        {doctorProfile?.qualification && (
                          <p className="text-base text-gray-800 dark:text-gray-200 font-medium mb-1">
                            {doctorProfile?.qualificationBn || doctorProfile.qualification}
                          </p>
                        )}
                        {/* Specialization in Bengali - Must show ALL if English exists */}
                        {doctorProfile?.specialization && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                            {doctorProfile?.specializationBn || doctorProfile.specialization}
                          </p>
                        )}
                        {/* Department in Bengali - Must show if exists */}
                        {doctorProfile?.department?.name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {doctorProfile.department.name}
                          </p>
                        )}
                        {/* Previous Jobs/Experience in Bengali - Must show ALL if English exists */}
                        {Array.isArray(doctorProfile?.previousJobs) && doctorProfile.previousJobs.length > 0 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {Array.isArray(doctorProfile?.previousJobsBn) && doctorProfile.previousJobsBn.length > 0
                              ? doctorProfile.previousJobsBn.map((job: any) => 
                                  typeof job === 'string' ? job : (job.title || job.position || job)
                                ).join(', ')
                              : doctorProfile.previousJobs.map((job: any) => 
                                  typeof job === 'string' ? job : (job.title || job.position || job)
                                ).join(', ')
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Close Button - Right Side */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setPrescriptionForm({ patientEmail: '', diagnosis: '', medicines: '', tests: '', rules: '', instructions: '', advice: '', followUp: '' });
                        setProblem('');
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <FiX className="text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Patient Info Section */}
                <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-4 mt-5 bg-gray-50 dark:bg-gray-900/50 -mx-6 px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Patient Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={prescriptionForm.patientEmail}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientEmail: e.target.value })}
                        required
                        className="w-full max-w-md px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm shadow-sm transition-all"
                        placeholder="patient@example.com"
                      />
                    </div>
                    {patientInfo && (
                      <div className="text-left sm:text-right bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border-2 border-teal-200 dark:border-teal-700 shadow-sm">
                        <p className="text-base font-bold text-teal-700 dark:text-teal-400 mb-1">
                          Patient: <span className="text-gray-800 dark:text-gray-200">{patientInfo.name || 'N/A'}</span>
                        </p>
                        {patientInfo.age && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Age: {patientInfo.age} {patientInfo.weight ? `years | Weight: ${patientInfo.weight}kg` : 'years'}
                          </p>
                        )}
                      </div>
                    )}
                    {loadingPatient && (
                      <div className="text-left sm:text-right">
                        <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                          <p className="text-sm text-gray-500 italic">Loading patient info...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Prescription Body - Two Column Layout */}
              <div className="overflow-y-auto flex-1 p-6 sm:p-8 md:p-10 bg-gray-50 dark:bg-gray-900 pb-32">
                <form onSubmit={handleCreatePrescription} className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
                  {/* Problem Input & AI Suggestions Section */}
                  <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-md">
                    <label className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <span className="text-xl">📝</span>
                      Patient Problem / Notes
                    </label>
                    
                    {/* Added Problems List */}
                    {problems.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {problems.map((prob, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0 pt-1">
                              {index + 1}.
                            </span>
                            <span className="flex-1 text-xs text-gray-700 dark:text-gray-300">{prob}</span>
                            <button
                              type="button"
                              onClick={() => removeProblem(index)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 shrink-0"
                            >
                              <FiXCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Problem Input */}
                    <textarea
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          addProblem();
                        }
                      }}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-blue-200 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm resize-none transition-all shadow-sm"
                      placeholder="Describe the patient's symptoms, complaints, or medical issues here... (Ctrl+Enter to add)"
                    />
                    
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={addProblem}
                        disabled={!problem.trim()}
                        className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <FiPlus className="w-4 h-4" />
                        Add Problem
                      </button>
                      <button
                        type="button"
                        onClick={fetchAISuggestions}
                        disabled={(problems.length === 0 && !problem.trim()) || loadingSuggestions}
                        className="px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                      >
                        <FiZap className={loadingSuggestions ? 'animate-spin' : ''} />
                        {loadingSuggestions ? 'Generating...' : '✨ Get AI Suggestions'}
                      </button>
                      {suggestions && (
                        <button
                          type="button"
                          onClick={() => setSuggestions(null)}
                          className="px-3 py-2 border-2 border-gray-400 dark:border-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {problems.length > 0 && (
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        {problems.length} problem(s) added. Click "Get AI Suggestions" to generate suggestions for all problems.
                      </p>
                    )}
                  </div>

                  {/* AI Suggestions */}
                  {suggestions && (
                    <div className="mb-5 p-4 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-300 dark:border-purple-700">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base mb-3 flex items-center gap-2">
                        <FiZap className="text-purple-600 dark:text-purple-400" />
                        AI-Powered Suggestions
                      </h3>
                      <div className="space-y-2.5 mb-3">
                        {suggestions.diagnosis && (
                          <div className="p-2.5 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700">
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">Diagnosis:</p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{suggestions.diagnosis}</p>
                          </div>
                        )}
                        {suggestions.medicines && (
                          <div className="p-2.5 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700">
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">Medicines:</p>
                            <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                              {Array.isArray(suggestions.medicines) ? (
                                <ul className="list-none space-y-1.5">
                                  {suggestions.medicines.map((medicine: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="font-semibold text-purple-600 dark:text-purple-400 shrink-0">
                                        {toRomanNumeral(index + 1)}.
                                      </span>
                                      <span className="flex-1">{medicine}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="whitespace-pre-wrap font-mono">{suggestions.medicines}</p>
                              )}
                            </div>
                          </div>
                        )}
                        {suggestions.tests && (
                          <div className="p-2.5 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700">
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">Tests:</p>
                            <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                              {Array.isArray(suggestions.tests) ? (
                                <ul className="list-none space-y-1.5">
                                  {suggestions.tests.map((test: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="font-semibold text-purple-600 dark:text-purple-400 shrink-0">
                                        {toRomanNumeral(index + 1)}.
                                      </span>
                                      <span className="flex-1">{test}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="whitespace-pre-wrap">{suggestions.tests}</p>
                              )}
                            </div>
                          </div>
                        )}
                        {suggestions.rules && (
                          <div className="p-2.5 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700">
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">Rules:</p>
                            <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                              {Array.isArray(suggestions.rules) ? (
                                <ul className="list-none space-y-1.5">
                                  {suggestions.rules.map((rule: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="font-semibold text-purple-600 dark:text-purple-400 shrink-0">
                                        {toRomanNumeral(index + 1)}.
                                      </span>
                                      <span className="flex-1">{rule}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="whitespace-pre-wrap">{suggestions.rules}</p>
                              )}
                            </div>
                          </div>
                        )}
                        {suggestions.instructions && (
                          <div className="p-2.5 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700">
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">Instructions:</p>
                            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{suggestions.instructions}</pre>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3 pt-3 border-t-2 border-purple-300 dark:border-purple-700">
                        <button
                          type="button"
                          onClick={() => setSuggestions(null)}
                          className="flex-1 px-4 py-2 border-2 border-gray-400 dark:border-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (suggestions.diagnosis) {
                              setPrescriptionForm(prev => ({ ...prev, diagnosis: suggestions.diagnosis }));
                            }
                            if (suggestions.medicines) {
                              const medicinesText = Array.isArray(suggestions.medicines) 
                                ? suggestions.medicines.map((med: string, idx: number) => `${toRomanNumeral(idx + 1)}. ${med}`).join('\n')
                                : suggestions.medicines;
                              setPrescriptionForm(prev => ({ ...prev, medicines: medicinesText }));
                            }
                            if (suggestions.tests) {
                              const testsText = Array.isArray(suggestions.tests)
                                ? suggestions.tests.map((test: string, idx: number) => `${toRomanNumeral(idx + 1)}. ${test}`).join('\n')
                                : suggestions.tests;
                              setPrescriptionForm(prev => ({ ...prev, tests: testsText }));
                            }
                            if (suggestions.rules) {
                              const rulesText = Array.isArray(suggestions.rules)
                                ? suggestions.rules.map((rule: string, idx: number) => `${toRomanNumeral(idx + 1)}. ${rule}`).join('\n')
                                : suggestions.rules;
                              setPrescriptionForm(prev => ({ ...prev, rules: rulesText, advice: rulesText }));
                            }
                            if (suggestions.instructions) {
                              setPrescriptionForm(prev => ({ ...prev, instructions: suggestions.instructions, followUp: suggestions.instructions }));
                            }
                            setSuggestions(null);
                          }}
                          className="flex-1 px-4 py-2 bg-linear-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 text-sm font-semibold shadow-md"
                        >
                          <FiCheck className="inline mr-1" />
                          Approve & Fill
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Two Column Layout - Professional Prescription Style */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 mt-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Diagnosis */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <label className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                          <FiEdit2 className="text-teal-600 dark:text-teal-400" />
                          Diagnosis
                        </label>
                        <textarea
                          value={prescriptionForm.diagnosis}
                          onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 resize-none font-medium transition-all"
                          placeholder="Enter diagnosis (one per line)"
                        />
                      </div>

                      {/* Investigation */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <label className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                          <FiEdit2 className="text-teal-600 dark:text-teal-400" />
                          Investigation
                        </label>
                        <textarea
                          value={prescriptionForm.tests}
                          onChange={(e) => setPrescriptionForm({ ...prescriptionForm, tests: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 resize-none font-medium transition-all"
                          placeholder="Enter lab tests/investigations (one per line)"
                        />
                      </div>

                      {/* Follow up */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <label className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                          <FiPlus className="text-teal-600 dark:text-teal-400" />
                          Follow up
                        </label>
                        <textarea
                          value={prescriptionForm.followUp || prescriptionForm.instructions}
                          onChange={(e) => {
                            setPrescriptionForm({ ...prescriptionForm, followUp: e.target.value, instructions: e.target.value });
                          }}
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 resize-none font-medium transition-all"
                          placeholder="Enter follow-up instructions"
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Medicine */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <label className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                          <FiEdit2 className="text-teal-600 dark:text-teal-400" />
                          Medicine
                        </label>
                        <textarea
                          value={prescriptionForm.medicines}
                          onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicines: e.target.value })}
                          rows={10}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 resize-none transition-all"
                          placeholder="Medicine Name - Dosage - Frequency&#10;Example: Paracetamol - 500mg - 2 times daily"
                        />
                      </div>

                      {/* Advice */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <label className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                          <FiPlus className="text-teal-600 dark:text-teal-400" />
                          Advice
                        </label>
                        <textarea
                          value={prescriptionForm.advice || prescriptionForm.rules}
                          onChange={(e) => {
                            setPrescriptionForm({ ...prescriptionForm, advice: e.target.value, rules: e.target.value });
                          }}
                          rows={5}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 resize-none font-medium transition-all"
                          placeholder="Enter advice/guidelines (one per line)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 sm:gap-4 pt-6 sm:pt-8 border-t-2 border-gray-300 dark:border-gray-600 mt-8 sm:mt-10 mb-12 sm:mb-16 shrink-0 bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
                    <button
                      type="submit"
                      onClick={handleCreatePrescription}
                      className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 dark:hover:from-teal-600 dark:hover:to-teal-700 font-bold transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <FiCheck className="text-lg" />
                      Save & Send
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(true)}
                      className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300 transition-all duration-200 flex items-center gap-2 text-sm shadow-sm hover:shadow-md"
                    >
                      <FiEye className="text-lg" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingTemplate) {
                          // If editing, keep the template name
                          setTemplateName(editingTemplate.name);
                        } else {
                          setTemplateName('');
                          setEditingTemplate(null);
                        }
                        setShowTemplateModal(true);
                      }}
                      className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
                    >
                      <FiSave className="text-lg" />
                      {editingTemplate ? 'Update Template' : 'Save as Template'}
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300 transition-all duration-200 flex items-center gap-2 text-sm shadow-sm hover:shadow-md"
                    >
                      <FiPrinter className="text-lg" />
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setPrescriptionForm({ patientEmail: '', diagnosis: '', medicines: '', tests: '', rules: '', instructions: '', advice: '', followUp: '' });
                        setProblem('');
                        setProblems([]);
                        setSuggestions(null);
                        setEditingTemplate(null);
                        setTemplateName('');
                      }}
                      className="px-6 py-3 border-2 border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold text-red-700 dark:text-red-400 transition-all duration-200 flex items-center gap-2 text-sm shadow-sm hover:shadow-md ml-auto"
                    >
                      <FiX className="text-lg" />
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPreviewModal(false);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Prescription Preview</h2>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FiX className="text-gray-600" />
                </button>
              </div>
              <div className="overflow-y-auto p-6 bg-white dark:bg-gray-800" style={{ maxHeight: 'calc(90vh - 100px)' }}>
                <div className="prescription-preview">
                  <div className="border-b-3 border-black pb-4 mb-4">
                    <div className="flex justify-between items-start mb-3">
                      {/* Doctor Info - Left */}
                      <div className="flex-1">
                        <div className="text-2xl font-bold text-teal-600 mb-2">
                          {formatDoctorName(doctorProfile?.user?.name || user?.name || 'Name', doctorProfile?.qualification)}
                        </div>
                        {doctorProfile?.qualification && (
                          <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">{doctorProfile.qualification}</div>
                        )}
                        {doctorProfile?.specialization && (
                          <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">{doctorProfile.specialization}</div>
                        )}
                        {doctorProfile?.department?.name && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{doctorProfile.department.name}</div>
                        )}
                        {Array.isArray(doctorProfile?.previousJobs) && doctorProfile.previousJobs.length > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {doctorProfile.previousJobs.map((job: any) => 
                              typeof job === 'string' ? job : (job.title || job.position || job)
                            ).join(', ')}
                          </div>
                        )}
                      </div>
                      
                      {/* Logo - Right */}
                      <div className="w-48 h-auto flex items-center justify-center">
                        <img src="/logo.png" alt="MediWise Logo" className="max-w-full h-auto object-contain" />
                      </div>
                    </div>
                    
                    {/* Patient Info and Date - Bottom Section */}
                    <div className="border-t-2 border-black dark:border-gray-600 pt-3 mt-3 flex justify-between items-center">
                      <div className="flex-1 text-sm text-black dark:text-gray-300">
                        {(() => {
                          const fullName = patientInfo?.name || '';
                          const namePart = fullName ? `Patient: ${fullName}` : '';
                          const age = patientInfo?.age ? `    Age: ${patientInfo.age}` : '';
                          const weight = patientInfo?.weight ? `Weight: ${patientInfo.weight}kg` : '';
                          
                          return [namePart, age, weight].filter(Boolean).join(' ');
                        })()}
                      </div>
                      <div className="text-sm font-semibold text-black dark:text-gray-300">
                        {(() => {
                          const date = new Date();
                          const day = String(date.getDate()).padStart(2, '0');
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          const month = monthNames[date.getMonth()];
                          const year = date.getFullYear();
                          const dateOnly = `${day} ${month}, ${year}`;
                          const timeOnly = format(date, 'h:mm a');
                          return `Date: ${dateOnly} Time: ${timeOnly}`;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Two Column Layout with Blue Divider */}
                  <div className="grid grid-cols-2 gap-10 mt-4 relative" style={{ borderLeft: '3px solid #0066cc', paddingLeft: '20px', marginLeft: '20px' }}>
                    {/* Left Column */}
                    <div className="space-y-4">
                      {prescriptionForm.diagnosis && (
                        <div>
                          <div className="font-bold text-base border-b-2 border-gray-400 dark:border-gray-500 pb-1 mb-2 uppercase">Diagnosis</div>
                          <div className="text-sm whitespace-pre-wrap pl-2">{prescriptionForm.diagnosis}</div>
                        </div>
                      )}
                      {prescriptionForm.tests && (
                        <div>
                          <div className="font-bold text-base border-b-2 border-gray-400 dark:border-gray-500 pb-1 mb-2 uppercase">Investigation</div>
                          <div className="text-sm whitespace-pre-wrap pl-2">{prescriptionForm.tests}</div>
                        </div>
                      )}
                      {(prescriptionForm.followUp || prescriptionForm.instructions) && (
                        <div>
                          <div className="font-bold text-base border-b-2 border-gray-400 dark:border-gray-500 pb-1 mb-2 uppercase">Follow Up</div>
                          <div className="text-sm whitespace-pre-wrap pl-2">{prescriptionForm.followUp || prescriptionForm.instructions}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Right Column */}
                    <div className="space-y-4">
                      {prescriptionForm.medicines && (
                        <div>
                          <div className="font-bold text-base border-b-2 border-gray-400 dark:border-gray-500 pb-1 mb-2 uppercase">Medicine</div>
                          <div className="text-sm font-mono whitespace-pre-wrap pl-2">{prescriptionForm.medicines}</div>
                        </div>
                      )}
                      {(prescriptionForm.advice || prescriptionForm.rules) && (
                        <div>
                          <div className="font-bold text-base border-b-2 border-gray-400 dark:border-gray-500 pb-1 mb-2 uppercase">Advice</div>
                          <div className="text-sm whitespace-pre-wrap pl-2">{prescriptionForm.advice || prescriptionForm.rules}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Footer with Company Information */}
                  <div className="mt-8 border-t-2 border-gray-400 dark:border-gray-500 pt-4 text-center">
                    <div className="text-center">
                      <div className="font-bold text-lg text-teal-600 mb-2">MediWise</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-1 flex justify-center items-center gap-1 flex-wrap" style={{ fontFamily: 'Noto Sans Bengali, Kalpurush, Siyam Rupali, sans-serif' }}>
                        <span>চেম্বার: মেডিওয়াইজ কনসালটেশন সেন্টার</span>
                        <span>/</span>
                        <span>Chamber: MediWise Consultation Center</span>
                      </div>
                      <div className="text-sm font-semibold text-teal-600 mt-2 flex justify-center items-center gap-1 flex-wrap" style={{ fontFamily: 'Noto Sans Bengali, Kalpurush, Siyam Rupali, sans-serif' }}>
                        <span>সিরিয়ালের জন্য হটলাইন</span>
                        <span>/</span>
                        <span>Hotline for Serial: <strong>+8809658303665</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t-2 border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-900 flex justify-end gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold flex items-center gap-2"
                >
                  <FiPrinter />
                  Print
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 border-2 border-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template Modal */}
        {showTemplateModal && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowTemplateModal(false);
                setTemplateName('');
                setEditingTemplate(null);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'Save as Template'}
                </h2>
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setTemplateName('');
                    setEditingTemplate(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FiX className="text-gray-600" />
                </button>
              </div>
              <div className="overflow-y-auto p-6 bg-white dark:bg-gray-800" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-400 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    placeholder="Enter template name (e.g., Common Cold, Fever, etc.)"
                  />
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    This will save the current prescription form as a reusable template.
                  </p>
                </div>
                {templates.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Your Templates</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="flex items-center justify-between p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 dark:text-gray-100">{template.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {format(parseISO(template.updatedAt), 'MMM dd, yyyy')}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleLoadTemplate(template)}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => handleEditTemplate(template)}
                              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t-2 border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-900 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setTemplateName('');
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 border-2 border-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold flex items-center gap-2"
                >
                  <FiSave />
                  {editingTemplate ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}