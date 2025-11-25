import React, { useState } from 'react';
import { GoogleIcon } from './icons';
import * as gsheet from '../googleApi';

interface GoogleSheetSetupProps {
  currentScriptUrl?: string | null;
  onSaveScriptUrl?: (url: string) => void;
  error?: string | null;
  onRetry?: () => void;
  onSkip?: () => void;
}

const CopyableCode: React.FC<{ text: string; multiline?: boolean }> = ({ text, multiline = false }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="relative my-2">
            {multiline ? (
                 <pre className="block bg-slate-800 text-slate-200 p-4 rounded text-xs font-mono overflow-x-auto max-h-64">
                    {text}
                 </pre>
            ) : (
                <code className="block bg-slate-200 p-3 rounded text-sm font-mono break-all pr-16 text-slate-700 border border-slate-300">{text}</code>
            )}
            <button
                onClick={handleCopy}
                className={`absolute ${multiline ? 'top-2 right-2' : 'top-1/2 right-2 -translate-y-1/2'} bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold py-1 px-3 rounded shadow-sm border border-slate-300 transition-all`}
            >
                {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
            </button>
        </div>
    );
};

const APPS_SCRIPT_CODE = `
function doPost(e) {
  // ป้องกันการแย่งกันเขียนข้อมูลพร้อมกัน (Lock Service)
  const lock = LockService.getScriptLock();
  lock.tryLock(30000); // รอสูงสุด 30 วินาที

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    // รับข้อมูล JSON ที่ส่งมาจาก Web App
    const req = JSON.parse(e.postData.contents);
    const action = req.action;
    
    // --- การตั้งค่า (Configuration) ---
    const HEADERS = ['ID', 'Name', 'MemberType', 'RegistrationDate', 'Documents', 'DocumentIssuer', 'Auditor', 'DocumentHistory'];
    
    // รายชื่อ Sheet ทั้งหมดที่ระบบต้องมี
    // หมายเหตุ: 'นอกหน่วย' คือชื่อ Sheet เดิมที่ใช้ในระบบ (ตรงกับ MemberType.External)
    const REQUIRED_SHEETS = ['พนักงานปัจจุบัน', 'นอกหน่วย', 'พนักงานบำนาญ', 'สมาชิกสมทบ'];

    // ฟังก์ชันช่วย: ตรวจสอบและสร้าง Sheet พร้อมหัวตารางถ้ายังไม่มี
    const ensureSheet = (name) => {
      let s = doc.getSheetByName(name);
      if (!s) {
        s = doc.insertSheet(name);
        s.appendRow(HEADERS); // สร้างหัวตารางทันที
      }
      return s;
    };

    let result = {};

    // --- กรณีอ่านข้อมูลทั้งหมด (READ_ALL) ---
    if (action === 'READ_ALL') {
      // 1. วนลูปตรวจสอบ/สร้าง Sheet ให้ครบทุกประเภทก่อนอ่าน (Initialize)
      REQUIRED_SHEETS.forEach(name => ensureSheet(name));

      const allData = [];
      
      REQUIRED_SHEETS.forEach(name => {
        const s = doc.getSheetByName(name);
        const lastRow = s.getLastRow();
        // ถ้ามีข้อมูล (มากกว่า 1 แถว คือมีมากกว่าแค่หัวตาราง)
        if (lastRow > 1) {
          // อ่านข้อมูลทีเดียวทั้ง Sheet (Batch Read)
          const values = s.getRange(2, 1, lastRow - 1, 8).getValues();
          values.forEach((r, i) => {
            // rowIndex = i + 2 (แถวเริ่มที่ 1, หัวตารางกินไป 1, array เริ่มที่ 0)
            allData.push({ rowData: r, sheetName: name, rowIndex: i + 2 });
          });
        }
      });
      result = { members: allData };

    } else {
      // --- กรณีจัดการข้อมูล (เขียน) ---
      const sheetName = req.sheetName;
      
      // ตรวจสอบและสร้าง Sheet ปลายทางถ้ายังไม่มี (ป้องกัน Error)
      let sheet = ensureSheet(sheetName);

      if (action === 'ADD') {
        sheet.appendRow(req.rowData);
        result = { status: 'success' };

      } else if (action === 'BULK_ADD') {
        // เพิ่มข้อมูลทีละหลายแถว (สำหรับการนำเข้า Excel)
        const rowsData = req.rowsData;
        if (rowsData && rowsData.length > 0) {
          const lastRow = sheet.getLastRow();
          sheet.getRange(lastRow + 1, 1, rowsData.length, rowsData[0].length).setValues(rowsData);
        }
        result = { status: 'success', count: rowsData ? rowsData.length : 0 };

      } else if (action === 'UPDATE') {
        const rowIndex = req.rowIndex;
        // อัปเดตข้อมูลทั้งแถว
        sheet.getRange(rowIndex, 1, 1, req.rowData.length).setValues([req.rowData]);
        result = { status: 'success' };
        
      } else if (action === 'DELETE') {
        const rowIndex = req.rowIndex;
        sheet.deleteRow(rowIndex);
        result = { status: 'success' };
      }
    }

    // ส่งผลลัพธ์กลับไปเป็น JSON
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    // กรณีเกิดข้อผิดพลาด
    return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    // ปล่อย Lock เสมอ
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("App is running!");
}
`;

const GoogleSheetSetup: React.FC<GoogleSheetSetupProps> = ({ 
    currentScriptUrl, 
    onSaveScriptUrl, 
    error, 
    onSkip
}) => {
  const [scriptUrl, setScriptUrl] = useState(currentScriptUrl || '');
  const [isChecking, setIsChecking] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl.trim()) return;
    
    setIsChecking(true);
    const isValid = await gsheet.checkConnection(scriptUrl);
    setIsChecking(false);

    if (isValid && onSaveScriptUrl) {
        onSaveScriptUrl(scriptUrl);
    } else {
        alert('ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบ URL อีกครั้ง หรือตรวจสอบว่าคุณได้ตั้งค่า "Who has access" เป็น "Anyone" หรือไม่');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b bg-slate-50">
            <h1 className="text-2xl font-bold text-slate-800 text-center">ตั้งค่าฐานข้อมูล Google Sheet</h1>
            <p className="text-slate-500 text-center mt-2">เชื่อมต่อแบบง่าย ไม่ต้องใช้ API Key</p>
        </div>

        <div className="p-8">
            {/* Stepper */}
            <div className="flex justify-center mb-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`flex items-center ${i !== 3 ? 'flex-1' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= i ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {i}
                        </div>
                        {i !== 3 && <div className={`h-1 flex-1 mx-2 ${step > i ? 'bg-blue-600' : 'bg-slate-200'}`}></div>}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-800">ขั้นตอนที่ 1: เตรียม Google Sheet</h2>
                    <ol className="list-decimal list-inside space-y-3 text-slate-700 ml-2">
                        <li>สร้าง Google Sheet ใหม่ หรือใช้ไฟล์เดิมที่มีอยู่</li>
                        <li>ไปที่เมนู <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong></li>
                        <li>ลบโค้ดเดิมในไฟล์ <code>Code.gs</code> ออกให้หมด แล้ววางโค้ดด้านล่างนี้แทน:</li>
                    </ol>
                    <CopyableCode text={APPS_SCRIPT_CODE} multiline={true} />
                    <div className="flex justify-end mt-6">
                        <button onClick={() => setStep(2)} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">ถัดไป</button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-800">ขั้นตอนที่ 2: เผยแพร่ (Deploy)</h2>
                    <ol className="list-decimal list-inside space-y-3 text-slate-700 ml-2">
                        <li>คลิกปุ่ม <strong>ทำให้ใช้งานได้ (Deploy)</strong> &gt; <strong>การทำให้ใช้งานได้รายการใหม่ (New deployment)</strong></li>
                        <li>เลือกประเภทเป็น <strong>เว็บแอป (Web app)</strong> (คลิกรูปเฟือง)</li>
                        <li>
                            ตั้งค่าดังนี้ (สำคัญมาก):
                            <ul className="list-disc list-inside ml-6 mt-2 mb-2 bg-yellow-50 p-3 rounded border border-yellow-200">
                                <li><strong>Description:</strong> ตั้งชื่ออะไรก็ได้ (เช่น Document Checker)</li>
                                <li><strong>Execute as:</strong> <code>Me (อีเมลของคุณ)</code></li>
                                <li><strong>Who has access:</strong> <code>Anyone (ทุกคน)</code> <span className="text-red-500 font-bold">*ต้องเลือกอันนี้เท่านั้น</span></li>
                            </ul>
                        </li>
                        <li>คลิก <strong>Deploy</strong> (อาจต้องกด Authorize access และ Allow ในครั้งแรก)</li>
                        <li>คัดลอก <strong>Web app URL</strong> ที่ได้มา (ลิงก์จะยาวๆ ลงท้ายด้วย <code>/exec</code>)</li>
                    </ol>
                    <div className="flex justify-between mt-6">
                        <button onClick={() => setStep(1)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md">ย้อนกลับ</button>
                        <button onClick={() => setStep(3)} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">ถัดไป</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-slate-800">ขั้นตอนที่ 3: เชื่อมต่อ</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Web App URL</label>
                            <input 
                                type="url" 
                                value={scriptUrl} 
                                onChange={e => setScriptUrl(e.target.value)}
                                placeholder="https://script.google.com/macros/s/......./exec"
                                className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            <p className="text-xs text-slate-500 mt-1">วาง URL ที่ได้จากขั้นตอนที่แล้ว</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-md border border-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="pt-4 flex flex-col gap-3">
                            <button 
                                type="submit" 
                                disabled={isChecking}
                                className="w-full py-3 bg-green-600 text-white rounded-md font-bold shadow-md hover:bg-green-700 disabled:opacity-70 flex justify-center items-center gap-2"
                            >
                                {isChecking ? 'กำลังตรวจสอบ...' : (
                                    <>
                                        <GoogleIcon /> เชื่อมต่อกับ Google Sheet
                                    </>
                                )}
                            </button>
                            
                            {onSkip && (
                                <button 
                                    type="button" 
                                    onClick={onSkip}
                                    className="w-full py-3 bg-white border border-slate-300 text-slate-600 rounded-md font-medium hover:bg-slate-50"
                                >
                                    ใช้งานโหมดออฟไลน์ (ไม่เชื่อมต่อ)
                                </button>
                            )}
                        </div>
                    </form>
                     <div className="flex justify-start mt-2">
                        <button onClick={() => setStep(2)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-sm">ย้อนกลับดูขั้นตอน Deploy</button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetSetup;