
import React, { useState, useEffect } from 'react';
import { Member } from '../../types';
import { getRequiredDocuments, DEFAULT_LOGO_BASE64 } from '../../constants';
import { CloseIcon, PrintIcon } from './icons';

interface DocumentChecklistModalProps {
  member: Member;
  onClose: () => void;
  onSave: (memberId: string, updatedDocs: Record<string, boolean>) => void;
}

const DocumentChecklistModal: React.FC<DocumentChecklistModalProps> = ({ member, onClose, onSave }) => {
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>(member.documents);

  const requiredDocs = getRequiredDocuments(member.memberType);

  useEffect(() => {
    const initialDocs = { ...member.documents };
    requiredDocs.forEach(doc => {
        if (initialDocs[doc.name] === undefined) {
            initialDocs[doc.name] = false;
        }
    });
    setCheckedDocs(initialDocs);
  }, [member, requiredDocs]);


  const handleCheckboxChange = (docName: string) => {
    setCheckedDocs(prev => ({ ...prev, [docName]: !prev[docName] }));
  };

  const handleSave = () => {
    onSave(member.id, checkedDocs);
  };
  
  const completedCount = requiredDocs.filter(doc => checkedDocs[doc.name]).length;
  const totalCount = requiredDocs.length;
  const lastHistory = member.documentHistory?.[0];

  const handlePrintReport = () => {
    // Try to get custom logo from local storage, fallback to default
    let logoBase64 = DEFAULT_LOGO_BASE64;
    try {
        const savedLogo = localStorage.getItem('custom_logo_base64');
        if (savedLogo) {
            logoBase64 = savedLogo;
        }
    } catch (e) {
        console.error("Error loading custom logo", e);
    }

    const documentsListHtml = requiredDocs.map(doc => `
      <li style="display: flex; align-items: center; border-bottom: 1px solid #e2e8f0; padding: 0.5rem 0.25rem; margin-bottom: 0.25rem; font-size: 14px;">
        <span style="display: inline-block; width: 2rem; text-align: center; font-family: monospace;">[${checkedDocs[doc.name] ? '✓' : '&nbsp;'}]</span>
        <span style="${doc.important ? 'font-weight: bold;' : ''}">${doc.name}${doc.important ? '<span style="color: red; margin-left: 4px;">*</span>' : ''}</span>
      </li>
    `).join('');

    const lastHistoryHtml = lastHistory ? `
      <div style="margin-bottom: 1.5rem; font-size: 14px; color: #475569; text-align: center; background-color: #f8fafc; padding: 0.75rem; border-radius: 0.375rem;">
        <p>
          <span style="font-weight: 600;">ตรวจสอบล่าสุดโดย:</span> ${lastHistory.auditor} 
          <span style="font-weight: 600; margin-left: 1rem;">เมื่อ:</span> ${new Date(lastHistory.timestamp).toLocaleString('th-TH')}
        </p>
      </div>
    ` : '';

    const printContent = `
      <!DOCTYPE html>
      <html lang="th">
        <head>
          <meta charset="UTF-8" />
          <title>รายงานการตรวจสอบเอกสาร - ${member.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
            body { 
              font-family: 'Sarabun', sans-serif;
              margin: 1.5rem;
              color: #1e293b;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 0.5rem 1.5rem;
            }
            ul {
              list-style-type: none;
              padding: 0;
            }
            .report-header {
              display: flex;
              align-items: center;
              gap: 1.5rem;
              border-bottom: 2px solid #334155;
              padding-bottom: 1rem;
              margin-bottom: 1.5rem;
            }
            .logo {
              height: 80px;
              width: auto;
            }
            .report-footer {
              margin-top: 3rem;
              padding-top: 1rem;
              border-top: 1px solid #e2e8f0;
              text-align: right;
              font-size: 12px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <header class="report-header">
            <img src="${logoBase64}" alt="Company Logo" class="logo" />
            <div>
              <h1 style="font-size: 1.6rem; font-weight: bold; margin: 0;">รายงานการตรวจสอบเอกสารสมาชิก</h1>
              <h2 style="font-size: 1.1rem; font-weight: normal; margin: 0; color: #475569;">สหกรณ์ออมทรัพย์พนักงานการท่าเรือแห่งประเทศไทย จำกัด</h2>
            </div>
          </header>
          
          <main>
            <div class="grid" style="font-size: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
              <p><span style="font-weight: 600;">ชื่อ-สกุล:</span> ${member.name}</p>
              <p><span style="font-weight: 600;">รหัสสมาชิก:</span> ${member.id}</p>
              <p><span style="font-weight: 600;">ประเภท:</span> ${member.memberType}</p>
              <p><span style="font-weight: 600;">วันที่สมัคร:</span> ${new Date(member.registrationDate).toLocaleDateString('th-TH')}</p>
            </div>
            
            ${lastHistoryHtml}
            
            <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.5rem;">รายการเอกสาร</h2>
            <ul>
              ${documentsListHtml}
            </ul>
          </main>

          <footer class="report-footer">
             <div style="width: 280px; margin-left: auto; text-align: center;">
                <p style="margin: 0; margin-top: 2rem;">&nbsp;</p>
                <p style="margin: 0; border-top: 1px dotted #475569; padding-top: 0.5rem;">
                  (....................................................)
                </p>
                <p style="margin: 0.25rem 0;">ผู้ตรวจสอบ</p>
             </div>
             <p style="margin-top: 1rem;">วันที่พิมพ์: ${new Date().toLocaleString('th-TH')}</p>
          </footer>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
    } else {
        alert('ไม่สามารถเปิดหน้าต่างสำหรับพิมพ์ได้ กรุณาปิดการบล็อก Pop-up ในเบราว์เซอร์ของคุณ');
    }
  };

  const hasChanges = JSON.stringify(member.documents) !== JSON.stringify(checkedDocs);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">ตรวจสอบเอกสาร</h2>
              <p className="text-slate-600 mt-1">{member.name} ({member.id})</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
          </div>
          {/* Progress Bar */}
          <div className="mt-4">
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(completedCount / totalCount) * 100}%` }}></div>
              </div>
              <p className="text-sm text-right mt-1 text-slate-500">{completedCount} / {totalCount} รายการ</p>
          </div>
        </div>
        
        {/* Document List (Interactive) */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          <ul className="space-y-3">
            {requiredDocs.map(doc => (
              <li key={doc.name}>
                <label className="flex items-center p-3 rounded-md transition-colors hover:bg-slate-50 cursor-pointer border">
                  <input
                    type="checkbox"
                    checked={!!checkedDocs[doc.name]}
                    onChange={() => handleCheckboxChange(doc.name)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`ml-3 text-slate-700 ${doc.important ? 'font-bold' : ''}`}>
                    {doc.name}
                    {doc.important && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer with buttons */}
        <div className="p-6 bg-slate-50 rounded-b-lg flex justify-between items-center">
            <button
                onClick={handlePrintReport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md shadow-sm text-sm font-medium hover:bg-gray-600"
            >
                <PrintIcon />
                พิมพ์รายงาน
            </button>
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                ยกเลิก
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={!hasChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                บันทึกการเปลี่ยนแปลง
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentChecklistModal;
