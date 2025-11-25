
import React, { useState } from 'react';
import { Member, MemberType } from '../../types';
import { CloseIcon, PrintIcon, UploadIcon, TrashIcon, CheckCircleIcon } from './icons';
import { getCoreRequiredDocuments, DEFAULT_LOGO_BASE64 } from '../../constants';

interface ReportModalProps {
  members: Member[];
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ members, onClose }) => {
  const [selectedType, setSelectedType] = useState<MemberType | 'ALL'>('ALL');
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
        return localStorage.getItem('custom_logo_base64');
    } catch {
        return null;
    }
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const base64 = event.target?.result as string;
              // Only set state for preview, do not save to localStorage yet
              setCustomLogo(base64);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveLogo = () => {
      if (customLogo) {
          try {
              localStorage.setItem('custom_logo_base64', customLogo);
              alert("บันทึกโลโก้เรียบร้อยแล้ว");
          } catch (error) {
              console.error("Failed to save logo to localStorage:", error);
              alert("ไม่สามารถบันทึกโลโก้ได้: ไฟล์มีขนาดใหญ่เกินไปสำหรับหน่วยความจำของเบราว์เซอร์ กรุณาใช้ไฟล์ภาพที่มีขนาดเล็กลง");
          }
      }
  };

  const handleResetLogo = () => {
      setCustomLogo(null);
      localStorage.removeItem('custom_logo_base64');
  };

  const handlePrint = () => {
    // Filter members based on selection
    const filteredMembers = members.filter(m => {
        if (selectedType === 'ALL') return true;
        return m.memberType === selectedType;
    }).sort((a, b) => parseInt(a.id) - parseInt(b.id));

    // Determine Report Title
    let reportTitle = "รายงานข้อมูลสมาชิกทั้งหมด";
    if (selectedType === MemberType.Current) reportTitle = "รายงานข้อมูลพนักงานปัจจุบัน";
    else if (selectedType === MemberType.External) reportTitle = "รายงานข้อมูลพนักงานนอกหน่วย";
    else if (selectedType === MemberType.Retired) reportTitle = "รายงานข้อมูลพนักงานบำนาญ";
    else if (selectedType === MemberType.Associate) reportTitle = "รายงานข้อมูลสมาชิกสมทบ";

    const tableRows = filteredMembers.map((m, index) => {
        const coreDocs = getCoreRequiredDocuments(m.memberType);
        const isComplete = coreDocs.every(doc => m.documents[doc.name]);
        const statusText = isComplete ? "เอกสารครบ" : "ไม่ครบ";
        const statusColor = isComplete ? "#16a34a" : "#dc2626";
        
        return `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td style="text-align: center;">${m.id}</td>
                <td style="text-align: left;">${m.name}</td>
                <td style="text-align: center;">${new Date(m.registrationDate).toLocaleDateString('th-TH')}</td>
                <td style="text-align: center;">${m.documentIssuer || '-'}</td>
                <td style="text-align: center; font-weight: bold; color: ${statusColor};">${statusText}</td>
                <td style="text-align: center;">${m.auditor || '-'}</td>
            </tr>
        `;
    }).join('');

    const logoToUse = customLogo || DEFAULT_LOGO_BASE64;

    const printContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
            
            /* Screen & General Styles */
            body { 
                font-family: 'Sarabun', sans-serif; 
                color: #1e293b; 
                margin: 0;
                padding: 0;
                height: 100vh;
                display: flex;
                flex-direction: column;
                background-color: white;
                box-sizing: border-box;
            }

            header {
                flex-shrink: 0;
                padding: 20px 40px;
                background: white;
                position: relative;
                z-index: 20;
            }

            .header-container { 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                gap: 20px; 
                position: relative; 
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 15px;
            }
            
            .logo { 
                height: 80px; 
                width: auto; 
                position: absolute; 
                left: 0; 
                top: 50%;
                transform: translateY(-50%);
            }
            
            .title-block { 
                text-align: center; 
                width: 100%; 
                padding: 0 100px; 
            }
            
            h1 { font-size: 22px; margin: 0 0 5px 0; line-height: 1.2; }
            h2 { font-size: 16px; margin: 0; font-weight: normal; color: #475569; }

            /* Scrollable Table Area */
            .table-container {
                flex-grow: 1;
                overflow-y: auto;
                padding: 0 40px;
            }

            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 10px; 
                font-size: 13px; 
            }

            thead th {
                position: sticky;
                top: 0;
                background-color: #f8fafc;
                font-weight: 700;
                padding: 10px 8px;
                border: 1px solid #94a3b8;
                color: #334155;
                z-index: 10;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }

            tbody td {
                padding: 8px;
                border: 1px solid #cbd5e1;
                vertical-align: middle;
            }

            tr:nth-child(even) { background-color: #f8fafc; }
            tr:hover { background-color: #f1f5f9; }

            /* Sticky Footer */
            footer {
                flex-shrink: 0;
                padding: 20px 40px 40px 40px;
                background: white;
                margin-top: auto;
                border-top: 1px solid #e2e8f0;
            }

            .footer-content {
                display: flex;
                justify-content: flex-end;
            }

            .signature { 
                text-align: center; 
                width: 200px; 
            }
            
            .signature-line { 
                border-bottom: 1px dotted #000; 
                margin-bottom: 5px; 
                height: 30px; 
            }

            /* Print Specific Styles */
            @media print {
                body { 
                    height: auto; 
                    display: block; 
                    overflow: visible; 
                    padding: 0;
                    margin: 0;
                }

                .table-container {
                    overflow: visible;
                    display: block;
                    padding: 0;
                    margin: 0;
                }

                header, footer {
                    padding: 0;
                    border: none;
                    position: static;
                }
                
                .header-container {
                    border-bottom: 1px solid #000;
                    margin-bottom: 20px;
                }

                thead th {
                    position: static;
                    background-color: #f1f5f9 !important;
                    box-shadow: none;
                    color: black;
                    border: 1px solid black;
                }
                
                tbody td {
                    border: 1px solid black;
                    color: black;
                }

                tr:nth-child(even) { background-color: transparent !important; }

                /* Repeat header on each page */
                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }
                
                /* Page setup */
                @page { 
                    size: A4; 
                    margin: 1.5cm; 
                }

                .no-print { display: none; }
            }
        </style>
      </head>
      <body>
        <header>
            <div class="header-container">
                <img src="${logoToUse}" class="logo" alt="Logo" />
                <div class="title-block">
                    <h1>สหกรณ์ออมทรัพย์พนักงานการท่าเรือแห่งประเทศไทย จำกัด</h1>
                    <h1>${reportTitle}</h1>
                    <h2>ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH')}</h2>
                </div>
            </div>
        </header>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%">ลำดับ</th>
                        <th style="width: 10%">รหัส</th>
                        <th style="width: 25%">ชื่อ-สกุล</th>
                        <th style="width: 12%">วันที่สมัคร</th>
                        <th style="width: 18%">ผู้ออกเอกสาร</th>
                        <th style="width: 10%">สถานะ</th>
                        <th style="width: 20%">ผู้ตรวจสอบ</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>

        <footer>
            <div class="footer-content">
                <div class="signature">
                    <div class="signature-line"></div>
                    <div>(..........................................)</div>
                    <div style="margin-top: 5px;">ผู้พิมพ์รายงาน</div>
                </div>
            </div>
            <div style="font-size: 10px; text-align: right; color: #94a3b8; margin-top: 10px;">
                พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}
            </div>
        </footer>
        <script>
            // Automatically trigger print, but allow viewing if cancelled
            window.onload = function() { 
                setTimeout(function() {
                    window.print();
                }, 500);
            }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-slate-50 rounded-md border border-slate-200 p-1">
                  <img 
                      src={customLogo || DEFAULT_LOGO_BASE64} 
                      alt="Current Logo" 
                      className="max-h-full max-w-full object-contain"
                  />
              </div>
              <h2 className="text-xl font-bold">ออกรายงานสมาชิก</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">เลือกประเภทรายงาน</label>
                <select 
                    value={selectedType} 
                    onChange={(e) => setSelectedType(e.target.value as MemberType | 'ALL')}
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="ALL">สมาชิกทั้งหมด</option>
                    <option value={MemberType.Current}>พนักงานปัจจุบัน</option>
                    <option value={MemberType.External}>พนักงานนอกหน่วย</option>
                    <option value={MemberType.Retired}>พนักงานบำนาญ</option>
                    <option value={MemberType.Associate}>สมาชิกสมทบ</option>
                </select>
            </div>
            
            <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">ตั้งค่าโลโก้ (Logo Settings)</h3>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 border rounded bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={customLogo || DEFAULT_LOGO_BASE64} alt="Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2">
                        <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer w-fit">
                            <UploadIcon />
                            <span>อัปโหลด</span>
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        
                        {customLogo && (
                            <>
                                <button onClick={handleSaveLogo} className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-md hover:bg-green-100 text-sm font-medium">
                                    <CheckCircleIcon /> บันทึกโลโก้
                                </button>
                                <button onClick={handleResetLogo} className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-sm font-medium">
                                    <TrashIcon /> ลบ
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-md text-sm text-slate-600 border border-slate-200">
                <p><strong>หมายเหตุ:</strong> รายงานจะเปิดในหน้าต่างใหม่ โดยส่วนหัวและส่วนท้ายจะถูกตรึงไว้ และเนื้อหาตารางสามารถเลื่อนดูได้ (ก่อนพิมพ์)</p>
            </div>
        </div>
        <div className="p-6 bg-slate-50 rounded-b-lg flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 font-medium">
                ยกเลิก
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm">
                <PrintIcon />
                พิมพ์รายงาน
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
