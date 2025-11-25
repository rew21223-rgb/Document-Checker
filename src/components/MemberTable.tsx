
import React from 'react';
import { Member, User, UserRole } from '../../types';
import { MemberWithRow } from '../../googleApi';
import { getRequiredDocuments, getCoreRequiredDocuments } from '../../constants';
import { ClockIcon } from './icons';

interface MemberTableProps {
  members: MemberWithRow[];
  currentUser: User;
  onCheckDocuments: (member: MemberWithRow) => void;
  onEditDetails: (member: MemberWithRow) => void;
  onDelete: (memberId: string) => void;
  onViewHistory: (member: Member) => void;
}

const MemberTable: React.FC<MemberTableProps> = ({ members, currentUser, onCheckDocuments, onEditDetails, onDelete, onViewHistory }) => {
    // Check if current user is Admin
    const isAdmin = currentUser.role === UserRole.Admin;

    const getDocumentStatus = (member: Member) => {
        const allDocs = getRequiredDocuments(member.memberType);
        const coreDocs = getCoreRequiredDocuments(member.memberType);
        
        const completedCount = allDocs.filter(doc => member.documents[doc.name]).length;
        const totalCount = allDocs.length;
        
        const isComplete = coreDocs.every(doc => member.documents[doc.name]);

        let tooltip = '';
        if (!isComplete) {
            const missingCoreDocs = coreDocs
                .filter(doc => !member.documents[doc.name])
                .map(doc => doc.name);
            if (missingCoreDocs.length > 0) {
                tooltip = `ขาดเอกสารสำคัญ: ${missingCoreDocs.join(', ')}`;
            }
        }

        return {
            isComplete,
            progress: `${completedCount}/${totalCount}`,
            tooltip,
        };
    };

    return (
        <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                        <th scope="col" className="px-6 py-3">รหัสสมาชิก</th>
                        <th scope="col" className="px-6 py-3">ชื่อ-สกุล</th>
                        <th scope="col" className="px-6 py-3">ประเภทสมาชิก</th>
                        <th scope="col" className="px-6 py-3">วันที่สมัคร</th>
                        <th scope="col" className="px-6 py-3">สถานะเอกสาร</th>
                        <th scope="col" className="px-6 py-3">ผู้ออกเอกสาร</th>
                        <th scope="col" className="px-6 py-3">ผู้ตรวจสอบล่าสุด</th>
                        <th scope="col" className="px-6 py-3 print:hidden">ดำเนินการ</th>
                    </tr>
                </thead>
                <tbody>
                    {members.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="text-center py-10 text-slate-500">ไม่พบข้อมูลสมาชิก</td>
                        </tr>
                    ) : (
                        members.map(member => {
                             const status = getDocumentStatus(member);
                             return (
                                <tr key={member.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{member.id}</td>
                                    <td className="px-6 py-4">{member.name}</td>
                                    <td className="px-6 py-4">{member.memberType}</td>
                                    <td className="px-6 py-4">{new Date(member.registrationDate).toLocaleDateString('th-TH')}</td>
                                    <td className="px-6 py-4">
                                        <span 
                                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.isComplete ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                            title={status.tooltip}
                                        >
                                            {status.isComplete ? 'เอกสารครบ' : 'ไม่ครบ'}
                                        </span>
                                        <span className="ml-2 text-slate-500 text-xs">({status.progress})</span>
                                    </td>
                                    <td className="px-6 py-4">{member.documentIssuer || '-'}</td>
                                    <td className="px-6 py-4">{member.auditor || '-'}</td>
                                    <td className="px-6 py-4 print:hidden">
                                        <div className="flex gap-2 flex-wrap items-center">
                                            <button onClick={() => onCheckDocuments(member)} className="font-medium text-blue-600 hover:underline">ตรวจสอบ</button>
                                            <button onClick={() => onEditDetails(member)} className="font-medium text-indigo-600 hover:underline">แก้ไข</button>
                                            
                                            {/* Only show Delete button for Admins */}
                                            {isAdmin && (
                                                <button onClick={() => onDelete(member.id)} className="font-medium text-red-600 hover:underline">ลบ</button>
                                            )}
                                            
                                            <button onClick={() => onViewHistory(member)} className="flex items-center gap-1 font-medium text-slate-600 hover:underline">
                                                <ClockIcon /> ประวัติ
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default MemberTable;
