'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import PatientSidebar from '@/components/PatientSidebar';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { FiFileText, FiPrinter, FiCalendar, FiDownload, FiX } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { formatDoctorName } from '@/utils/doctorName';

export default function PatientPrescriptionsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/prescriptions?limit=100');
      let allPrescriptions = response.data.prescriptions || [];
      
      // Remove duplicates by ID and by doctor+patient+date combination
      const uniquePrescriptionsById = new Map();
      const uniquePrescriptionsByKey = new Map();
      
      allPrescriptions.forEach((prescription: any) => {
        // Deduplicate by ID
        if (prescription.id && !uniquePrescriptionsById.has(prescription.id)) {
          uniquePrescriptionsById.set(prescription.id, prescription);
          
          // Also deduplicate by doctor + patient + date + diagnosis
          // Use date only (without time) for comparison
          const prescriptionDate = prescription.prescriptionDate || prescription.createdAt || '';
          const dateOnly = prescriptionDate ? new Date(prescriptionDate).toISOString().split('T')[0] : '';
          const diagnosis = (prescription.diagnosis || '').substring(0, 50);
          const key = `${prescription.doctorId || ''}_${prescription.patientId || ''}_${dateOnly}_${diagnosis}`;
          
          if (!uniquePrescriptionsByKey.has(key)) {
            uniquePrescriptionsByKey.set(key, prescription);
          } else {
            // Keep the one with latest date
            const existing = uniquePrescriptionsByKey.get(key);
            const existingDate = new Date(existing.prescriptionDate || existing.createdAt || 0).getTime();
            const newDate = new Date(prescription.prescriptionDate || prescription.createdAt || 0).getTime();
            if (newDate > existingDate) {
              uniquePrescriptionsByKey.set(key, prescription);
            }
          }
        }
      });
      
      // Use the more restrictive deduplication
      allPrescriptions = Array.from(uniquePrescriptionsByKey.values());
      
      console.log('📋 After deduplication - Unique prescriptions:', allPrescriptions.length);
      
      // Filter prescriptions for current patient
      allPrescriptions = allPrescriptions.filter((prescription: any) => 
        prescription.patient?.email === user?.email || prescription.patientId === user?.id
      );
      
      // Sort by date (newest first)
      allPrescriptions.sort((a: any, b: any) => 
        new Date(b.prescriptionDate || b.createdAt).getTime() - new Date(a.prescriptionDate || a.createdAt).getTime()
      );
      
      console.log('📋 Unique prescriptions after filtering:', allPrescriptions.length);
      setPrescriptions(allPrescriptions);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'patient') {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'doctor') {
        router.push('/doctor/dashboard');
      } else {
        router.push('/dashboard');
      }
      return;
    }
    if (user && user.role === 'patient') {
      fetchPrescriptions();
    }
  }, [user, authLoading, router, fetchPrescriptions]);

  // Memoize month names to avoid recreating array
  const monthNames = useMemo(() => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], []);

  const handlePrint = useCallback((prescription: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const doctorProfile = prescription.doctor;
    const patientInfo = prescription.patient || user;
    const prescriptionDate = new Date(prescription.prescriptionDate);
    const day = String(prescriptionDate.getDate()).padStart(2, '0');
    const month = monthNames[prescriptionDate.getMonth()];
    const year = prescriptionDate.getFullYear();
    const dateOnly = `${day} ${month}, ${year}`;
    const timeOnly = format(prescriptionDate, 'h:mm a');

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
              overflow: hidden;
            }
            body::before {
              content: 'MediWise';
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 150pt;
              font-weight: bold;
              color: rgba(0, 102, 102, 0.15);
              z-index: 0;
              pointer-events: none;
              white-space: nowrap;
              text-shadow: 0 0 10px rgba(0, 102, 102, 0.1);
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
            .doctor-details {
              font-size: 10pt;
              margin-bottom: 3px;
            }
            .date-time {
              text-align: right;
              font-size: 10pt;
              font-weight: bold;
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
            }
            .section-content {
              font-size: 10pt;
              white-space: pre-wrap;
              line-height: 1.8;
              min-height: 40px;
            }
            .medicines-content {
              font-family: 'Times New Roman', serif;
              font-size: 11pt;
              white-space: pre-line;
            }
            .footer {
              margin-top: 40px;
              border-top: 2px solid #000;
              padding-top: 20px;
              font-size: 10pt;
              text-align: center;
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
              body::before {
                display: block;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-top">
                <div class="doctor-info-left">
                  <div class="doctor-name">${(() => {
                    const name = doctorProfile?.user?.name || '';
                    const cleanName = name.replace(/^dr\.?\s*/i, '');
                    return `Dr. ${cleanName}`;
                  })()}</div>
                  ${doctorProfile?.qualification ? `<div class="doctor-details">${doctorProfile.qualification}</div>` : ''}
                  ${doctorProfile?.specialization ? `<div class="doctor-details">${doctorProfile.specialization}</div>` : ''}
                  ${doctorProfile?.department?.name ? `<div class="doctor-details">${doctorProfile.department.name}</div>` : ''}
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
                    const age = prescription.age ? `    Age: ${prescription.age}` : '';
                    return [namePart, age].filter(Boolean).join(' ');
                  })()}
                </div>
                <div class="date-time">
                  Date: ${dateOnly} Time: ${timeOnly}
                </div>
              </div>
            </div>
            
            <div class="two-column-layout">
              <div class="left-column">
                ${prescription.diagnosis ? `
                <div class="section">
                  <div class="section-title">Diagnosis</div>
                  <div class="section-content">${prescription.diagnosis}</div>
                </div>
                ` : ''}
                
                ${prescription.tests ? `
                <div class="section">
                  <div class="section-title">Investigation</div>
                  <div class="section-content">${prescription.tests}</div>
                </div>
                ` : ''}

                ${(prescription.followUp || prescription.instructions) ? `
                <div class="section">
                  <div class="section-title">Follow up</div>
                  <div class="section-content">${prescription.followUp || prescription.instructions}</div>
                </div>
                ` : ''}
              </div>

              <div class="right-column">
                ${prescription.medicines ? `
                <div class="section">
                  <div class="section-title">Medicine</div>
                  <div class="section-content medicines-content">${(() => {
                    let medicinesList: any[] = [];
                    
                    if (typeof prescription.medicines === 'string') {
                      try {
                        const parsed = JSON.parse(prescription.medicines);
                        if (Array.isArray(parsed)) {
                          medicinesList = parsed;
                        } else {
                          medicinesList = prescription.medicines.split('\\n').filter(Boolean);
                        }
                      } catch {
                        medicinesList = prescription.medicines.split('\\n').filter(Boolean);
                      }
                    } else if (Array.isArray(prescription.medicines)) {
                      medicinesList = prescription.medicines;
                    }
                    
                    // Format each medicine on a new line
                    return medicinesList.map((med: any, index: number) => {
                      let name = '';
                      
                      if (typeof med === 'string') {
                        name = med.trim();
                      } else if (med && typeof med === 'object') {
                        name = (med.name || '').trim();
                      }
                      
                      // Remove any extra whitespace or line breaks
                      name = name.replace(/\\s+/g, ' ').trim();
                      
                      const dosage = typeof med === 'object' && med.dosage ? med.dosage : '';
                      const frequency = typeof med === 'object' && med.frequency ? med.frequency : '';
                      
                      if (!name) return '';
                      
                      let result = name;
                      if (dosage) result += ' - ' + dosage;
                      if (frequency) result += ' (' + frequency + ')';
                      return result;
                    }).filter((r: string) => r.length > 0).join('\\n');
                  })()}</div>
                </div>
                ` : ''}

                ${(prescription.advice || prescription.rules) ? `
                <div class="section">
                  <div class="section-title">Advice</div>
                  <div class="section-content">${prescription.advice || prescription.rules}</div>
                </div>
                ` : ''}
              </div>
            </div>

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
  }, [user, monthNames]);

  const handleViewPrescription = (prescription: any) => {
    setSelectedPrescription(prescription);
    setShowPreviewModal(true);
  };

  // Generate prescription data URL for QR code - Direct PDF download
  const generatePrescriptionDataURL = (prescription: any) => {
    if (typeof window === 'undefined') return '';
    
    // QR codes have a limit on data size (max ~2953 chars for alphanumeric)
    // Use a short URL with just the prescription ID instead of encoding all data
    // This URL can be used to fetch the full prescription data
    try {
      if (prescription.id) {
        // Use a simple URL with prescription ID - much shorter than base64 encoded data
        const shortUrl = `${window.location.origin}/prescription/${prescription.id}`;
        
        // Check length (should be well under limit)
        if (shortUrl.length > 2000) {
          // Fallback: use just the ID if URL is somehow too long
          return prescription.id;
        }
        
        return shortUrl;
      }
      
      // Fallback if no ID
      return '';
    } catch (error) {
      console.error('Error generating QR data:', error);
      return prescription.id || '';
    }
  };

  // Generate medicine-specific QR code data - Use short URL
  const generateMedicineQRData = (prescription: any, medicine: any, index: number) => {
    if (typeof window === 'undefined') return '';
    
    try {
      // Use a short URL instead of encoding all data
      if (prescription.id) {
        const shortUrl = `${window.location.origin}/prescription/${prescription.id}/medicine/${index}`;
        return shortUrl;
      }
      return '';
    } catch (error) {
      console.error('Error generating medicine QR data:', error);
      return '';
    }
  };

  // Download prescription as image
  const downloadPrescriptionAsImage = async () => {
    const prescriptionElement = document.getElementById('prescription-view-content');
    if (!prescriptionElement) return;

    try {
      const canvas = await html2canvas(prescriptionElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `prescription-${selectedPrescription?.id || 'download'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'patient') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <PatientSidebar user={user} logout={logout} />
      <main className="w-full lg:ml-64 flex-1 transition-all duration-300">
        {/* Modern Header with Simple Color */}
        <header className="bg-teal-600 text-white shadow-xl">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Prescriptions</h1>
              <p className="text-sm sm:text-base text-teal-100">View and manage your medical prescriptions</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          {prescriptions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-300">
              <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FiFileText className="text-4xl text-teal-600" />
              </div>
              <p className="text-gray-600 text-lg mb-2 font-semibold">No prescriptions found</p>
              <p className="text-gray-500 text-sm">
                Your prescriptions will appear here once your doctor creates them
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:scale-[1.01]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center shadow-lg">
                          <FiFileText className="text-2xl text-teal-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {prescription.doctor?.user?.name 
                              ? `Dr. ${prescription.doctor.user.name}`
                              : 'Prescription'}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-2">
                              <FiCalendar className="text-teal-600" />
                              <span className="font-medium">
                                {format(new Date(prescription.prescriptionDate), 'MMMM dd, yyyy')}
                              </span>
                            </div>
                            {prescription.doctor?.specialization && (
                              <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">
                                {prescription.doctor.specialization}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleViewPrescription(prescription)}
                        className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 hover:shadow-xl transition-all flex items-center gap-2 font-bold transform hover:scale-105"
                      >
                        <FiFileText className="w-5 h-5" />
                        View
                      </button>
                      <button
                        onClick={() => handlePrint(prescription)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-xl transition-all flex items-center gap-2 font-bold transform hover:scale-105"
                      >
                        <FiPrinter className="w-5 h-5" />
                        Print
                      </button>
                    </div>
                  </div>

                  {prescription.diagnosis && (
                    <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Diagnosis:</h4>
                      <p className="text-gray-600 dark:text-gray-400">{prescription.diagnosis}</p>
                    </div>
                  )}

                  {prescription.medicines && (
                    <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Medicines:</h4>
                      <div className="text-gray-600 dark:text-gray-400">
                        {(() => {
                          // Handle different medicine formats
                          let medicinesList: any[] = [];
                          
                          if (typeof prescription.medicines === 'string') {
                            // If it's a string, try to parse as JSON first
                            try {
                              const parsed = JSON.parse(prescription.medicines);
                              if (Array.isArray(parsed)) {
                                medicinesList = parsed;
                              } else {
                                // If not array, split by newline but keep each line intact
                                medicinesList = prescription.medicines.split(/\r?\n/).filter((line: string) => line.trim().length > 0);
                              }
                            } catch {
                              // If not JSON, split by newline but keep each line intact
                              medicinesList = prescription.medicines.split(/\r?\n/).filter((line: string) => line.trim().length > 0);
                            }
                          } else if (Array.isArray(prescription.medicines)) {
                            medicinesList = prescription.medicines;
                          }
                          
                          // Process and combine medicines (handle cases where roman numerals are separate)
                          const processedMedicines: any[] = [];
                          for (let i = 0; i < medicinesList.length; i++) {
                            const med = medicinesList[i];
                            let medName = '';
                            
                            if (typeof med === 'string') {
                              medName = med.trim();
                            } else if (med && typeof med === 'object') {
                              medName = (med.name || med.medicineName || '').trim();
                            }
                            
                            // Skip empty items
                            if (!medName || medName.length === 0) continue;
                            
                            // Check if this is just a roman numeral (i, ii, iii, iv, v, etc.) and next item exists
                            const isRomanNumeral = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii|xiii|xiv|xv)[\.)]?\s*$/i.test(medName);
                            
                            if (isRomanNumeral && i + 1 < medicinesList.length) {
                              // Combine with next item
                              const nextMed = medicinesList[i + 1];
                              let nextMedName = '';
                              
                              if (typeof nextMed === 'string') {
                                nextMedName = nextMed.trim();
                              } else if (nextMed && typeof nextMed === 'object') {
                                nextMedName = (nextMed.name || nextMed.medicineName || '').trim();
                              }
                              
                              if (nextMedName && nextMedName.length > 0) {
                                // Combine roman numeral with next medicine name
                                processedMedicines.push({
                                  name: `${medName} ${nextMedName}`,
                                  dosage: typeof nextMed === 'object' && nextMed.dosage ? nextMed.dosage : '',
                                  frequency: typeof nextMed === 'object' && nextMed.frequency ? nextMed.frequency : '',
                                });
                                i++; // Skip next item as we've combined it
                                continue;
                              }
                            }
                            
                            // Add medicine as is
                            processedMedicines.push({
                              name: medName,
                              dosage: typeof med === 'object' && med.dosage ? med.dosage : '',
                              frequency: typeof med === 'object' && med.frequency ? med.frequency : '',
                            });
                          }
                          
                          // Display each medicine on a new line
                          return processedMedicines.map((med: any, index: number) => {
                            const medName = med.name.replace(/\s+/g, ' ').trim();
                            
                            if (!medName || medName.length === 0) return null;
                            
                            return (
                              <div key={index} className="mb-2 block">
                                <span className="font-medium">{medName}</span>
                                {med.dosage && <span className="ml-2 text-gray-500">- {med.dosage}</span>}
                                {med.frequency && <span className="ml-2 text-gray-500">({med.frequency})</span>}
                              </div>
                            );
                          }).filter(Boolean);
                        })()}
                      </div>
                    </div>
                  )}

                  {prescription.instructions && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Instructions:</h4>
                      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{prescription.instructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Prescription Slide-in View from Right */}
      {showPreviewModal && selectedPrescription && (() => {
        const doctorProfile = selectedPrescription.doctor;
        const patientInfo = selectedPrescription.patient || user;
        const prescriptionDate = new Date(selectedPrescription.prescriptionDate);
        const day = String(prescriptionDate.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[prescriptionDate.getMonth()];
        const year = prescriptionDate.getFullYear();
        const dateOnly = `${day} ${month}, ${year}`;
        
        const mainQRUrl = generatePrescriptionDataURL(selectedPrescription);
        // Parse medicines properly
        let medicines: any[] = [];
        if (Array.isArray(selectedPrescription.medicines)) {
          medicines = selectedPrescription.medicines;
        } else if (typeof selectedPrescription.medicines === 'string') {
          try {
            const parsed = JSON.parse(selectedPrescription.medicines);
            if (Array.isArray(parsed)) {
              medicines = parsed;
            } else {
              medicines = selectedPrescription.medicines.split(/\r?\n/).filter((m: string) => m.trim().length > 0).map((m: string) => m.trim());
            }
          } catch {
            medicines = selectedPrescription.medicines.split(/\r?\n/).filter((m: string) => m.trim().length > 0).map((m: string) => m.trim());
          }
        }

        return (
          <>
            {/* Backdrop - Semi-transparent overlay, original page visible */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity"
              onClick={() => {
                setShowPreviewModal(false);
                setSelectedPrescription(null);
              }}
            />
            
            {/* Slide-in Panel from Right */}
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto animate-slideInRight">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedPrescription(null);
                }}
                className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* Prescription Content */}
              <div id="prescription-view-content" className="p-6" style={{ fontFamily: "'Times New Roman', serif" }}>
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Printout to redeem your e-prescription</h2>
                </div>

                {/* Patient Info Section with Main QR Code */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="text-lg font-bold mb-2">FOR {patientInfo?.name?.toUpperCase() || 'PATIENT'}</div>
                    {patientInfo?.dateOfBirth && (
                      <div className="text-sm">BORN {format(new Date(patientInfo.dateOfBirth), 'dd.MM.yyyy')}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-center ml-4">
                    <div className="bg-white p-3 rounded-lg border-2 border-gray-300 shadow-lg">
                      {mainQRUrl && mainQRUrl.length > 0 && mainQRUrl.length < 2000 ? (
                        <QRCodeSVG 
                          value={mainQRUrl}
                          size={140}
                          level="H"
                          includeMargin={true}
                        />
                      ) : (
                        <div className="w-[140px] h-[140px] bg-gray-100 flex items-center justify-center text-xs text-gray-500 text-center p-2">
                          QR Code unavailable
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-2 text-center max-w-[140px] font-semibold" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                      codes to redeem all prescriptions
                    </p>
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="mb-6 pb-4 border-b border-gray-300">
                  <div className="text-lg font-bold mb-2">
                    FROM {formatDoctorName(doctorProfile?.user?.name || '', doctorProfile?.qualification).toUpperCase()}
                  </div>
                  {doctorProfile?.specialization && (
                    <div className="text-sm mb-1">{doctorProfile.specialization}</div>
                  )}
                  {doctorProfile?.user?.phone && (
                    <div className="text-sm">{doctorProfile.user.phone}</div>
                  )}
                  {doctorProfile?.user?.email && (
                    <div className="text-sm">{doctorProfile.user.email}</div>
                  )}
                  <div className="text-sm font-bold mt-2">DATE {dateOnly}</div>
                </div>

                {/* Medicine QR Codes Section */}
                {medicines.length > 0 && (
                  <div className="mb-6">
                    {medicines
                      .filter((med: any) => {
                        if (!med) return false;
                        if (typeof med === 'string' && med.trim().length === 0) return false;
                        if (typeof med === 'object' && !med.name && !med.medicineName) return false;
                        return true;
                      })
                      .map((med: any, index: number) => {
                        let medicineName = '';
                        if (typeof med === 'string') {
                          medicineName = med.trim();
                        } else if (med && typeof med === 'object') {
                          medicineName = (med.name || med.medicineName || '').trim();
                        }
                        medicineName = medicineName.replace(/\s+/g, ' ').trim();
                        
                        if (!medicineName || medicineName.length === 0) return null;
                        
                        const medicineQRUrl = generateMedicineQRData(selectedPrescription, med, index);
                        const dosage = typeof med === 'object' && med.dosage ? med.dosage : '';
                        const frequency = typeof med === 'object' && med.frequency ? med.frequency : '';
                        const pzn = selectedPrescription.id.slice(0, 8);
                      
                      return (
                        <div key={index} className="mb-4 flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="bg-white p-2 rounded border border-gray-200">
                              {medicineQRUrl && medicineQRUrl.length > 0 && medicineQRUrl.length < 2000 ? (
                                <QRCodeSVG 
                                  value={medicineQRUrl}
                                  size={100}
                                  level="H"
                                  includeMargin={true}
                                />
                              ) : (
                                <div className="w-[100px] h-[100px] bg-gray-100 flex items-center justify-center text-xs text-gray-500 text-center p-1">
                                  QR unavailable
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold block">
                              {medicineName}
                            </div>
                            {dosage && (
                              <div className="text-xs text-gray-600 mt-1">Dosage: {dosage}</div>
                            )}
                            {frequency && (
                              <div className="text-xs text-gray-600 mt-1">Frequency: {frequency}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">PZN: {pzn}</div>
                          </div>
                        </div>
                      );
                      })
                      .filter(Boolean)}
                  </div>
                )}

                {/* App Download Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-white p-2 rounded border border-gray-200">
                        <QRCodeSVG 
                          value="https://mediwise.com/app"
                          size={80}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold mb-1">App for e-prescription</div>
                      <div className="text-xs text-gray-600">
                        Receive your e-prescriptions paperless now and download the app.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8 pb-4">
                  <button
                    onClick={downloadPrescriptionAsImage}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    <FiDownload className="w-5 h-5" />
                    Save
                  </button>
                  <button
                    onClick={() => handlePrint(selectedPrescription)}
                    className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    <FiPrinter className="w-5 h-5" />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}