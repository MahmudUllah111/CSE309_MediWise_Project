'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Loading from '@/components/Loading';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PrescriptionDownloadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const prescriptionId = params.id;
  const dataParam = searchParams.get('data');
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    const generateAndDownloadPDF = async () => {
      if (!dataParam) {
        window.location.href = '/patient/prescriptions';
        return;
      }

      try {
        // Decode base64 data (handle URL encoding)
        const decodedData = decodeURIComponent(atob(decodeURIComponent(dataParam)));
        const prescriptionData = JSON.parse(decodedData);
        
        // Create HTML content for PDF
        const prescriptionDate = new Date(prescriptionData.date);
        const day = String(prescriptionDate.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[prescriptionDate.getMonth()];
        const year = prescriptionDate.getFullYear();
        const dateOnly = `${day} ${month}, ${year}`;
        
        // Create temporary div for PDF generation
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm'; // A4 width
        tempDiv.style.padding = '20mm';
        tempDiv.style.fontFamily = "'Times New Roman', serif";
        tempDiv.style.backgroundColor = '#fff';
        tempDiv.style.color = '#000';
        tempDiv.innerHTML = `
          <div style="position: relative; z-index: 1;">
            <div style="border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div style="flex: 1;">
                  <div style="font-size: 22pt; font-weight: bold; color: #006666; margin-bottom: 8px;">
                    ${prescriptionData.doctorName ? `Dr. ${prescriptionData.doctorName.replace(/^dr\.?\s*/i, '')}` : 'Dr. Doctor'}
                  </div>
                </div>
                <div style="width: 180px; text-align: center;">
                  <div style="font-size: 18pt; font-weight: bold; color: #006666;">MediWise</div>
                </div>
              </div>
              <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; display: flex; justify-content: space-between;">
                <div style="flex: 1;">
                  Patient: ${prescriptionData.patientName || 'Patient'}
                </div>
                <div style="font-weight: bold;">
                  Date: ${dateOnly}
                </div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 15px; position: relative;">
              <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 3px; background-color: #0066cc; transform: translateX(-50%); z-index: 1;"></div>
              
              <div style="display: flex; flex-direction: column; gap: 25px; position: relative; z-index: 2;">
                ${prescriptionData.diagnosis ? `
                <div>
                  <div style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Diagnosis</div>
                  <div style="font-size: 10pt; white-space: pre-wrap; line-height: 1.8;">${prescriptionData.diagnosis}</div>
                </div>
                ` : ''}
                
                ${prescriptionData.tests ? `
                <div>
                  <div style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Investigation</div>
                  <div style="font-size: 10pt; white-space: pre-wrap; line-height: 1.8;">${prescriptionData.tests}</div>
                </div>
                ` : ''}

                ${(prescriptionData.followUp || prescriptionData.instructions) ? `
                <div>
                  <div style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Follow up</div>
                  <div style="font-size: 10pt; white-space: pre-wrap; line-height: 1.8;">${prescriptionData.followUp || prescriptionData.instructions}</div>
                </div>
                ` : ''}
              </div>

              <div style="display: flex; flex-direction: column; gap: 25px; position: relative; z-index: 2;">
                ${prescriptionData.medicines ? `
                <div>
                  <div style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Medicine</div>
                  <div style="font-family: 'Courier New', monospace; font-size: 10pt; white-space: pre-wrap; line-height: 1.8;">
                    ${typeof prescriptionData.medicines === 'string' 
                      ? prescriptionData.medicines 
                      : (Array.isArray(prescriptionData.medicines) 
                          ? prescriptionData.medicines.map((med: any) => typeof med === 'string' ? med : (med.name || med)).join('\\n') 
                          : '')}
                  </div>
                </div>
                ` : ''}

                ${(prescriptionData.advice || prescriptionData.rules) ? `
                <div>
                  <div style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Advice</div>
                  <div style="font-size: 10pt; white-space: pre-wrap; line-height: 1.8;">${prescriptionData.advice || prescriptionData.rules}</div>
                </div>
                ` : ''}
              </div>
            </div>

            <div style="margin-top: 40px; border-top: 2px solid #000; padding-top: 20px; text-align: center;">
              <div style="font-weight: bold; font-size: 12pt; margin-bottom: 8px; color: #006666;">MediWise</div>
              <div style="font-size: 9pt; margin-bottom: 5px;">
                <span>চেম্বার: মেডিওয়াইজ কনসালটেশন সেন্টার</span>
                <span> / </span>
                <span>Chamber: MediWise Consultation Center</span>
              </div>
              <div style="font-weight: bold; font-size: 9pt; color: #006666;">
                <span>সিরিয়ালের জন্য হটলাইন</span>
                <span> / </span>
                <span>Hotline for Serial: <strong>+8809658303665</strong></span>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(tempDiv);
        
        // Generate PDF
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // Download PDF directly
        pdf.save(`prescription-${prescriptionId || prescriptionData.id || 'download'}.pdf`);
        
        // Clean up
        document.body.removeChild(tempDiv);
        setGenerating(false);
        
        // Redirect after download
        setTimeout(() => {
          window.location.href = '/patient/prescriptions';
        }, 1000);
        
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Redirecting...');
        window.location.href = '/patient/prescriptions';
      }
    };

    generateAndDownloadPDF();
  }, [dataParam, prescriptionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loading />
        <p className="mt-4 text-gray-600">Downloading PDF...</p>
      </div>
    </div>
  );
}



import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Loading from '@/components/Loading';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PrescriptionDownloadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const prescriptionId = params.id;
  const dataParam = searchParams.get('data');
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    const generateAndDownloadPDF = async () => {
      if (!dataParam) {
        window.location.href = '/patient/prescriptions';
        return;
      }

      try {
        // Decode base64 data (handle URL encoding)
        const decodedData = decodeURIComponent(atob(decodeURIComponent(dataParam)));
        const prescriptionData = JSON.parse(decodedData);
        
        // Create HTML content for PDF
        const prescriptionDate = new Date(prescriptionData.date);
        const day = String(prescriptionDate.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[prescriptionDate.getMonth()];
        const year = prescriptionDate.getFullYear();
        const dateOnly = `${day} ${month}, ${year}`;
        
        // Create temporary div for PDF generation
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm'; // A4 width
        tempDiv.style.padding = '20mm';
        tempDiv.style.fontFamily = "'Times New Roman', serif";
        tempDiv.style.backgroundColor = '#fff';
        tempDiv.style.color = '#000';
        tempDiv.innerHTML = `
          <div style="position: relative; z-index: 1;">
            <div style="border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div style="flex: 1;">
                  <div style="font-size: 22pt; font-weight: bold; color: #006666; margin-bottom: 8px;">
                    ${prescriptionData.doctorName ? `Dr. ${prescriptionData.doctorName.replace(/^dr\.?\s*/i, '')}` : 'Dr. Doctor'}
                  </div>
                </div>
                <div style="width: 180px; text-align: center;">
                  <div style="font-size: 18pt; font-weight: bold; color: #006666;">MediWise</div>
                </div>
              </div>
              <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; display: flex; justify-content: space-between;">
                <div style="flex: 1;">
                  Patient: ${prescriptionData.patientName || 'Patient'}
                </div>
                <div style="font-weight: bold;">
                  Date: ${dateOnly}
                </div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 15px; position: relative;">
              <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 3px; background-color: #0066cc; transform: translateX(-50%); z-index: 1;"></div>
              
              <div style="display: flex; flex-direction: column; gap: 25px; position: relative; z-index: 2;">
                ${prescriptionData.diagnosis ? `
                <div>
                  <div style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Diagnosis</div>
                  <div style="font-size: 10pt; white-space: pre-wrap; line-height: 1.8;">${prescriptionData.diagnosis}</div>
                </div>
                ` : ''}
                
                ${prescriptionData.tests ? `
                <div>
                  <div style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Investigation</div>
                  <div style="font-size: 10pt; white-space: pre-wrap; line-height: 1.8;">${prescriptionData.tests}</div>
                </div>
                ` : ''}

                ${(prescriptionData.followUp || prescriptionData.instructions) ? `
                <div>
                  <div style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Follow up</div>
                  <div style="font-size: 10pt; white-space: pre-wrap; line-height: 1.8;">${prescriptionData.followUp || prescriptionData.instructions}</div>
                </div>
                ` : ''}
              </div>

              <div style="display: flex; flex-direction: column; gap: 25px; position: relative; z-index: 2;">
                ${prescriptionData.medicines ? `
                <div>
                  <div style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Medicine</div>
                  <div style="font-family: 'Courier New', monospace; font-size: 10pt; white-space: pre-wrap; line-height: 1.8;">
                    ${typeof prescriptionData.medicines === 'string' 
                      ? prescriptionData.medicines 
                      : (Array.isArray(prescriptionData.medicines) 
                          ? prescriptionData.medicines.map((med: any) => typeof med === 'string' ? med : (med.name || med)).join('\\n') 
                          : '')}
                  </div>
                </div>
                ` : ''}

                ${(prescriptionData.advice || prescriptionData.rules) ? `
                <div>
                  <div style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Advice</div>
                  <div style="font-size: 10pt; white-space: pre-wrap; line-height: 1.8;">${prescriptionData.advice || prescriptionData.rules}</div>
                </div>
                ` : ''}
              </div>
            </div>

            <div style="margin-top: 40px; border-top: 2px solid #000; padding-top: 20px; text-align: center;">
              <div style="font-weight: bold; font-size: 12pt; margin-bottom: 8px; color: #006666;">MediWise</div>
              <div style="font-size: 9pt; margin-bottom: 5px;">
                <span>চেম্বার: মেডিওয়াইজ কনসালটেশন সেন্টার</span>
                <span> / </span>
                <span>Chamber: MediWise Consultation Center</span>
              </div>
              <div style="font-weight: bold; font-size: 9pt; color: #006666;">
                <span>সিরিয়ালের জন্য হটলাইন</span>
                <span> / </span>
                <span>Hotline for Serial: <strong>+8809658303665</strong></span>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(tempDiv);
        
        // Generate PDF
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // Download PDF directly
        pdf.save(`prescription-${prescriptionId || prescriptionData.id || 'download'}.pdf`);
        
        // Clean up
        document.body.removeChild(tempDiv);
        setGenerating(false);
        
        // Redirect after download
        setTimeout(() => {
          window.location.href = '/patient/prescriptions';
        }, 1000);
        
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Redirecting...');
        window.location.href = '/patient/prescriptions';
      }
    };

    generateAndDownloadPDF();
  }, [dataParam, prescriptionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loading />
        <p className="mt-4 text-gray-600">Downloading PDF...</p>
      </div>
    </div>
  );
}












