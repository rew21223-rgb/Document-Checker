
import React, { useRef } from 'react';
import { MemberType, FilterStatus, User, UserRole } from '../types';
import { MemberWithRow } from '../googleApi';
import { PlusIcon, UploadIcon, DownloadIcon, PrintIcon, SearchIcon, PDFIcon, LogoutIcon, UsersIcon, CogIcon, GoogleIcon, ClipboardListIcon } from './icons';

declare const XLSX: any;
declare const html2canvas: any;
declare const jspdf: any;


interface ControlsProps {
    currentUser: User;
    onAdd: () => void;
    onImport: () => void;
    onManageUsers: () => void;
    onLogout: () => void;
    onClearAllDataRequest: () => void;
    onBackup: () => void;
    onRestore: (file: File) => void;
    onReport: () => void;
    onOpenSheet: () => void;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filterStatus: FilterStatus;
    onFilterStatusChange: (status: FilterStatus) => void;
    filterType: MemberType | 'ทั้งหมด';
    onFilterTypeChange: (type: MemberType | 'ทั้งหมด') => void;
    filterIssuer: string;
    onFilterIssuerChange: (value: string) => void;
    filterAuditor: string;
    onFilterAuditorChange: (value: string) => void;
    filteredData: MemberWithRow[];
    onOpenSettings: () => void;
    connectionStatus: 'signedIn' | 'signedOut' | 'idle' | 'offline';
}

const Controls: React.FC<ControlsProps> = ({ 
    currentUser,
    onAdd, 
    onImport,
    onManageUsers,
    onLogout,
    onClearAllDataRequest,
    onBackup,
    onRestore,
    onReport,
    onOpenSheet,
    searchTerm, 
    onSearchChange,
    filterStatus,
    onFilterStatusChange,
    filterType,
    onFilterTypeChange,
    filterIssuer,
    onFilterIssuerChange,
    filterAuditor,
    onFilterAuditorChange,
    filteredData,
    onOpenSettings,
    connectionStatus
 }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isAdmin = currentUser.role === UserRole.Admin;

    const handleExport = () => {
        // Export displayed data to Excel
        const dataToExport = filteredData.map(member => ({
            'รหัสสมาชิก': member.id,
            'ชื่อ-สกุล': member.name,
            'ประเภทสมาชิก': member.memberType,
            'วันที่สมัคร': new Date(member.registrationDate).toLocaleDateString('th-TH'),
            'ผู้ออกเอกสาร': member.documentIssuer || '',
            'ผู้ตรวจสอบล่าสุด': member.auditor || '',
            ...Object.fromEntries(
                Object.entries(member.documents).map(([doc, status]) => [`เอกสาร: ${doc}`, status ? 'มี' : 'ไม่มี'])
            )
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'สมาชิก');
        XLSX.writeFile(workbook, 'report_members.xlsx');
    };
    
    const handlePrint = () => {
        window.print();
    };
    
    const handleExportPdf = () => {
        const input = document.getElementById('print-area');
        if (!input) return;

        const hiddenElements = input.querySelectorAll('.print\\:block.hidden');
        hiddenElements.forEach(el => el.classList.remove('hidden'));
        
        html2canvas(input, { scale: 2 })
            .then((canvas: any) => {
                hiddenElements.forEach(el => el.classList.add('hidden'));

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jspdf.jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4',
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;
                
                let imgWidth = pdfWidth - 20;
                let imgHeight = imgWidth / ratio;

                if (imgHeight > pdfHeight - 20) {
                    imgHeight = pdfHeight - 20;
                    imgWidth = imgHeight * ratio;
                }
                
                pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                pdf.save('members_report.pdf');
            });
    };

    return (
        <div className="space-y-4 mb-6 print:hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex gap-2">
                    <button onClick={onAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm">
                        <PlusIcon /> <span className="hidden sm:inline">เพิ่มสมาชิก</span>
                    </button>
                    {isAdmin && (
                        <button onClick={onImport} className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                            <UploadIcon /> <span className="hidden sm:inline">นำเข้า</span>
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    {/* Only Admin can access Google Sheet directly */}
                    {isAdmin && (
                        <button onClick={onOpenSheet} className="flex items-center gap-1.5 bg-white text-green-700 border border-green-200 px-3 py-2 rounded-md hover:bg-green-50 transition-colors shadow-sm text-sm font-medium" title="เปิด Google Sheet">
                            <GoogleIcon /> <span className="hidden xl:inline">Google Sheet</span>
                        </button>
                    )}
                    
                    <button onClick={onReport} className="flex items-center gap-1.5 bg-white text-indigo-700 border border-indigo-200 px-3 py-2 rounded-md hover:bg-indigo-50 transition-colors shadow-sm text-sm font-medium" title="ออกรายงาน">
                         <ClipboardListIcon /> <span className="hidden xl:inline">รายงาน</span>
                    </button>
                    <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
                    <button onClick={handleExport} className="flex items-center gap-1.5 bg-white text-slate-700 border border-slate-300 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors shadow-sm text-sm" title="Export Excel">
                        <DownloadIcon /> <span className="hidden lg:inline">Excel</span>
                    </button>
                    <button onClick={handleExportPdf} className="flex items-center gap-1.5 bg-white text-slate-700 border border-slate-300 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors shadow-sm text-sm" title="Export PDF">
                        <PDFIcon /> <span className="hidden lg:inline">PDF</span>
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-1.5 bg-white text-slate-700 border border-slate-300 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors shadow-sm text-sm" title="Print">
                        <PrintIcon /> <span className="hidden lg:inline">พิมพ์</span>
                    </button>
                    
                    <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
                    
                    {isAdmin && (
                        <button onClick={onOpenSettings} className={`p-2 rounded-md transition-colors ${connectionStatus === 'signedIn' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} title="ตั้งค่าการเชื่อมต่อ">
                            <CogIcon />
                        </button>
                    )}

                     {isAdmin && (
                        <button onClick={onManageUsers} className="p-2 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors" title="จัดการผู้ใช้">
                            <UsersIcon />
                        </button>
                    )}

                    {isAdmin && (
                        <div className="relative group">
                             <button className="p-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors" title="ข้อมูลสำรอง">
                                <DownloadIcon />
                             </button>
                             <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block ring-1 ring-black ring-opacity-5 z-20">
                                 <button onClick={onBackup} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">สำรองข้อมูล (Backup)</button>
                                 <button onClick={() => fileInputRef.current?.click()} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">กู้คืนข้อมูล (Restore)</button>
                                 <button onClick={onClearAllDataRequest} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">ล้างข้อมูลทั้งหมด</button>
                             </div>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                onRestore(e.target.files[0]);
                                e.target.value = '';
                            }
                        }} 
                        className="hidden" 
                        accept=".json"
                    />

                    <button onClick={onLogout} className="flex items-center gap-2 bg-slate-800 text-white px-3 py-2 rounded-md hover:bg-slate-900 transition-colors shadow-sm text-sm ml-2">
                        <LogoutIcon /> <span className="hidden md:inline">ออก</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหา (ชื่อ, รหัส, สถานะ)..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
                <div>
                    <select
                        value={filterStatus}
                        onChange={(e) => onFilterStatusChange(e.target.value as FilterStatus)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        {Object.values(FilterStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div>
                     <select
                        value={filterType}
                        onChange={(e) => onFilterTypeChange(e.target.value as MemberType | 'ทั้งหมด')}
                        className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="ทั้งหมด">ประเภทสมาชิก: ทั้งหมด</option>
                        {Object.values(MemberType).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="text"
                        placeholder="กรองผู้ออกเอกสาร..."
                        value={filterIssuer}
                        onChange={(e) => onFilterIssuerChange(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <input
                        type="text"
                        placeholder="กรองผู้ตรวจสอบล่าสุด..."
                        value={filterAuditor}
                        onChange={(e) => onFilterAuditorChange(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
            </div>
        </div>
    );
};

export default Controls;
