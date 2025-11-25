
import React, { useState } from 'react';
import { MemberType } from '../types';
import { CloseIcon, DownloadIcon, WarningTriangleIcon, SpinnerIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

declare const XLSX: any;
declare const Papa: any;

interface ImportModalProps {
  onClose: () => void;
  onImport: (newMembers: { id: string; name: string; memberType: MemberType; registrationDate: string; documentIssuer: string; }[]) => void;
}

type ParsedMember = { id: string; name: string; memberType: MemberType; registrationDate: string; documentIssuer: string; };

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const [pastedText, setPastedText] = useState('');
  const [error, setError] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [membersToConfirm, setMembersToConfirm] = useState<ParsedMember[] | null>(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<{ scanned: number; valid: number; invalid: number } | null>(null);

  // Improved Date Parser: Handles JS Date objects, ISO strings, and Thai DD/MM/YYYY formats
  const parseDate = (dateInput: any): string | null => {
    if (!dateInput) return null;

    // Case 1: Input is already a JS Date object (from SheetJS cellDates: true)
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
        return dateInput.toISOString();
    }

    const dateStr = String(dateInput).trim();

    // Case 2: ISO Format (YYYY-MM-DD)
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(dateStr)) {
        const d = new Date(dateStr);
        if(!isNaN(d.getTime())) return d.toISOString();
    }

    // Case 3: DD/MM/YYYY (Thai or UK format, supports BE years e.g. 2567)
    const parts = dateStr.split(/[\/\.-]/); 
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; 
        const yearVal = parseInt(parts[2], 10);
        
        const gregorianYear = yearVal > 2400 ? yearVal - 543 : yearVal;

        if (month < 0 || month > 11 || day < 1 || day > 31) return null;

        const date = new Date(Date.UTC(gregorianYear, month, day));
        
        if (date && date.getUTCFullYear() === gregorianYear && date.getUTCMonth() === month && date.getUTCDate() === day) {
            return date.toISOString();
        }
    }

    return null;
  };

  const normalizeMemberType = (input: string): MemberType | null => {
    if (!input) return null;
    const normalized = input.trim();
    
    const directMatch = Object.values(MemberType).find(t => t === normalized);
    if (directMatch) return directMatch;

    if (normalized.includes('พนักงานปัจจุบัน') || normalized.includes('เจ้าหน้าที่สหกรณ์')) {
        return MemberType.Current;
    }
    if (normalized === 'นอกหน่วย' || normalized === 'สมาชิกนอกหน่วย' || normalized === 'พนักงานนอกหน่วย') {
        return MemberType.External;
    }
    if (normalized.includes('บำนาญ') || normalized.includes('เกษียณ')) {
        return MemberType.Retired;
    }
    if (normalized.includes('สมทบ')) {
        return MemberType.Associate;
    }
    
    return null;
  };

  const parseData = (data: any[][]): ParsedMember[] => {
    const dataToParse = hasHeader ? data.slice(1) : data;
    const errors: string[] = [];
    const validMembers: ParsedMember[] = [];
    const seenIds = new Set<string>();
    let scannedCount = 0;

    dataToParse.forEach((row, index) => {
        // Skip completely empty rows
        if (!row || row.length === 0) return;
        // If ID is empty/missing, try to verify if row has other data before counting it as scanned error
        const idRaw = row[0];
        if (!idRaw && !row[1]) return; // Skip if both ID and Name are missing (likely empty row)

        scannedCount++;
        const rowNum = hasHeader ? index + 2 : index + 1;
        
        const nameRaw = row[1];
        const typeRaw = row[2];
        const dateRaw = row[3];
        const issuerRaw = row[4];

        // Enforce 5-digit ID padding (e.g., "1" -> "00001")
        const id = idRaw ? String(idRaw).trim().padStart(5, '0') : '';
        const name = nameRaw ? String(nameRaw).trim() : '';
        const typeStr = typeRaw ? String(typeRaw).trim() : '';
        const dateInput = dateRaw;
        const documentIssuer = issuerRaw ? String(issuerRaw).trim() : '';

        if (!id) {
            errors.push(`แถว ${rowNum}: ไม่พบรหัสสมาชิก`);
            return;
        }

        // Duplicate Check within File
        if (seenIds.has(id)) {
            errors.push(`แถว ${rowNum}: รหัสสมาชิกซ้ำกันในไฟล์ (${id}) - ข้ามรายการนี้`);
            return;
        }
        seenIds.add(id);

        if (!name) {
            errors.push(`แถว ${rowNum}: ไม่พบชื่อ-สกุล (รหัส: ${id})`);
            return;
        }

        const memberType = normalizeMemberType(typeStr);
        if (!memberType) {
            errors.push(`แถว ${rowNum}: ประเภทสมาชิกไม่ถูกต้อง "${typeStr}" (รหัส: ${id})`);
            return;
        }

        const registrationDate = parseDate(dateInput);
        if (!registrationDate) {
             const dateDisplay = dateInput instanceof Date ? dateInput.toLocaleDateString() : String(dateInput);
             errors.push(`แถว ${rowNum}: รูปแบบวันที่ไม่ถูกต้อง "${dateDisplay}" (รหัส: ${id}) - ควรเป็น วว/ดด/pppp`);
             return;
        }

        validMembers.push({ id, name, memberType, registrationDate, documentIssuer });
    });

    setParseErrors(errors);
    setStats({
        scanned: scannedCount,
        valid: validMembers.length,
        invalid: errors.length
    });
    return validMembers;
  };
  
  const processAndConfirm = (parsedData: ParsedMember[], errorMessage: string) => {
      if (parsedData.length > 0) {
          setMembersToConfirm(parsedData);
      } else {
          setError(errorMessage);
      }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    setError('');
    setParseErrors([]);
    setStats(null);
    setIsProcessing(true);
    
    setTimeout(() => {
        const reader = new FileReader();
        const commonErrorMessage = 'ไม่พบข้อมูลที่ถูกต้องในไฟล์ กรุณาตรวจสอบรูปแบบ';

        reader.onerror = () => {
            setError('เกิดข้อผิดพลาดในการอ่านไฟล์');
            setIsProcessing(false);
            input.value = ''; 
        };

        if (file.name.endsWith('.csv')) {
            reader.onload = (event) => {
                const text = event.target?.result as string;
                Papa.parse(text, {
                    complete: (result: any) => {
                        const parsed = parseData(result.data);
                        processAndConfirm(parsed, commonErrorMessage);
                        setIsProcessing(false);
                        input.value = '';
                    },
                    error: (err: any) => {
                        setError(`CSV Error: ${err.message}`);
                        setIsProcessing(false);
                        input.value = '';
                    }
                });
            };
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    // Enhanced reading options
                    const json = XLSX.utils.sheet_to_json(worksheet, { 
                        header: 1,
                        defval: '', // Ensure empty cells are empty strings, not undefined
                        blankrows: false // Skip totally blank rows
                    });
                    const parsed = parseData(json as any[][]);
                    processAndConfirm(parsed, commonErrorMessage);
                } catch (err: any) {
                    console.error(err);
                    setError('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: ' + err.message);
                } finally {
                    setIsProcessing(false);
                    input.value = '';
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            setError('ไฟล์ประเภทนี้ไม่รองรับ กรุณาใช้ .csv, .xlsx, or .xls');
            setIsProcessing(false);
            input.value = '';
        }
    }, 100);
  };

  const handlePasteSubmit = () => {
      setError('');
      setParseErrors([]);
      setStats(null);
      setIsProcessing(true);
      
      setTimeout(() => {
          try {
              Papa.parse(pastedText, {
                complete: (result: any) => {
                    const parsed = parseData(result.data);
                    processAndConfirm(parsed, 'ไม่สามารถประมวลผลข้อมูลที่วางได้');
                    setIsProcessing(false);
                },
                error: (err: any) => {
                     setError(`เกิดข้อผิดพลาดในการประมวลผลข้อความ: ${err.message}`);
                     setIsProcessing(false);
                }
            });
          } catch (err) {
              setError('เกิดข้อผิดพลาดที่ไม่คาดคิด');
              setIsProcessing(false);
          }
      }, 100);
  };

  const handleConfirmImport = () => {
    if (membersToConfirm) {
      onImport(membersToConfirm);
      onClose();
    }
  };

  const handleCancelConfirm = () => {
    setMembersToConfirm(null);
  };

  const handleDownloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();

    const headers = ['รหัสสมาชิก', 'ชื่อ-สกุล', 'ประเภทสมาชิก', 'วันที่สมัคร (ว/ด/ป)', 'ผู้ออกเอกสาร'];
    const sampleData = [
      ['00101', 'ตัวอย่าง: สมชาย ใจดี', MemberType.Current, '15/07/2567', 'ฝ่ายบุคคล'],
      ['00102', 'ตัวอย่าง: สมศรี มีสุข', 'พนักงานบำนาญ', '01/02/2566', 'ฝ่ายการเงิน'],
      ['00103', 'ตัวอย่าง: มานี รักเรียน', 'สมาชิกสมทบ', '10/10/2565', 'สหกรณ์'],
    ];

    const data = [headers, ...sampleData];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 35 }, { wch: 20 }, { wch: 20 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MemberTemplate');
    
    XLSX.writeFile(workbook, 'member_import_template.xlsx');
  };

  const handleDownloadErrors = () => {
    const errorText = parseErrors.join('\n');
    const blob = new Blob([errorText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import_errors_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col relative">
            
            {isProcessing && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 rounded-lg backdrop-blur-sm transition-opacity">
                    <div className="text-blue-600 mb-3">
                        <SpinnerIcon />
                    </div>
                    <p className="text-slate-700 font-semibold text-lg">กำลังประมวลผลไฟล์...</p>
                    <p className="text-slate-500 text-sm mt-1">กรุณารอสักครู่ ระบบกำลังตรวจสอบข้อมูลจำนวนมาก</p>
                </div>
            )}

            <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
                <h2 className="text-xl font-bold">นำเข้าข้อมูลสมาชิก</h2>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <WarningTriangleIcon />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-yellow-800">คำเตือนสำคัญ</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>ระบบใช้ <strong>"รหัสสมาชิก"</strong> เป็นหลักในการระบุตัวตน</p>
                                <ul className="list-disc list-inside mt-1">
                                    <li>หาก <strong>รหัสตรงกัน</strong>: จะอัปเดตชื่อ/ประเภท แต่ <strong>คงสถานะเอกสารเดิมไว้</strong></li>
                                    <li>หาก <strong>รหัสไม่ตรง</strong>: สร้างสมาชิกใหม่</li>
                                    <li>รหัสสมาชิกจะถูกปรับเป็น 5 หลักเสมอ (เช่น "1" -> "00001")</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-2">นำเข้าจากไฟล์</h3>
                    <p className="text-sm text-slate-500 mb-2">
                    รองรับไฟล์ Excel (.xlsx) 5 คอลัมน์: <code className="bg-slate-100 px-1">รหัส</code>, <code className="bg-slate-100 px-1">ชื่อ</code>, <code className="bg-slate-100 px-1">ประเภท</code>, <code className="bg-slate-100 px-1">วันที่สมัคร</code>, <code className="bg-slate-100 px-1">ผู้ออกเอกสาร</code>
                    </p>
                    <div className="flex items-center justify-between mb-4">
                        <button 
                            type="button" 
                            onClick={handleDownloadTemplate} 
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors shadow-sm text-sm font-medium"
                            disabled={isProcessing}
                        >
                            <DownloadIcon /> ดาวน์โหลดแม่แบบ
                        </button>
                    </div>
                    <input 
                    type="file" 
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-2">คัดลอกและวาง</h3>
                    <textarea
                    rows={4}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`รหัส,ชื่อ,ประเภท,วันที่,ผู้ออกเอกสาร\n00201,สมปอง,${MemberType.Current},20/05/2567,ฝ่ายบุคคล`}
                    disabled={isProcessing}
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 text-sm disabled:bg-slate-100"
                    ></textarea>
                    <button 
                        onClick={handlePasteSubmit} 
                        disabled={isProcessing || !pastedText.trim()}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'กำลังประมวลผล...' : 'ประมวลผลข้อมูล'}
                    </button>
                </div>

                <div className="border-t pt-4">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} disabled={isProcessing} className="rounded text-blue-600 focus:ring-blue-500"/>
                        ข้อมูลมีแถวหัวข้อ (Skip Row 1)
                    </label>
                </div>

                {parseErrors.length > 0 && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                             <h4 className="text-red-800 font-bold text-sm">พบข้อผิดพลาด ({parseErrors.length} รายการ):</h4>
                             <button 
                                onClick={handleDownloadErrors}
                                className="text-xs bg-white border border-red-300 text-red-700 hover:bg-red-50 px-3 py-1 rounded shadow-sm font-medium flex items-center gap-1"
                            >
                                <DownloadIcon /> ดาวน์โหลดรายงาน
                            </button>
                        </div>
                        <ul className="list-disc list-inside text-xs text-red-700 max-h-60 overflow-y-auto bg-white p-2 border border-red-100 rounded">
                            {parseErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                        </ul>
                        <p className="text-xs text-red-600 mt-2 font-semibold">* รายการที่ผิดพลาดจะไม่ถูกนำเข้า</p>
                    </div>
                )}

                {error && <p className="text-red-600 text-sm mt-4 font-medium">{error}</p>}
            </div>
        </div>
        </div>
        {membersToConfirm && (
            <ConfirmationModal
                isOpen={!!membersToConfirm}
                onClose={handleCancelConfirm}
                onConfirm={handleConfirmImport}
                title="ยืนยันการนำเข้าข้อมูล"
                message={`
                    ${stats ? `อ่านพบข้อมูลทั้งหมด: ${stats.scanned} แถว` : ''}
                    ตรวจสอบพบข้อมูลที่ถูกต้อง: ${membersToConfirm.length} รายการ
                    ${parseErrors.length > 0 ? `(มีข้อมูลผิดพลาด/ซ้ำ: ${parseErrors.length} รายการ)` : ''}
                    ต้องการนำเข้าข้อมูลที่ถูกต้องหรือไม่?
                `}
            />
        )}
    </>
  );
};

export default ImportModal;
