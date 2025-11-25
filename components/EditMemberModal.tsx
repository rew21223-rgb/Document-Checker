import React, { useState, useRef, useEffect } from 'react';
import { Member, MemberType } from '../types';
import { CloseIcon } from './icons';

interface EditMemberModalProps {
  member: Member;
  onClose: () => void;
  onUpdate: (memberId: string, updatedDetails: { 
      name: string; 
      memberType: MemberType,
      registrationDate: string;
      documentIssuer: string; 
    }) => void;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, onClose, onUpdate }) => {
  const [name, setName] = useState(member.name);
  const [memberType, setMemberType] = useState(member.memberType);
  const [registrationDate, setRegistrationDate] = useState(member.registrationDate.split('T')[0]); // YYYY-MM-DD for input
  const [documentIssuer, setDocumentIssuer] = useState(member.documentIssuer || '');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && registrationDate) {
      // Convert YYYY-MM-DD back to ISO string at UTC midnight
      const isoDate = new Date(registrationDate).toISOString();
      onUpdate(member.id, { name, memberType, registrationDate: isoDate, documentIssuer });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">แก้ไขข้อมูลสมาชิก</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700">รหัสสมาชิก</label>
                <p className="mt-1 text-slate-900 font-semibold">{member.id}</p>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">ชื่อ-สกุล</label>
              <input
                ref={nameInputRef}
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="memberType" className="block text-sm font-medium text-slate-700">ประเภทสมาชิก</label>
              <select
                id="memberType"
                value={memberType}
                onChange={(e) => setMemberType(e.target.value as MemberType)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.values(MemberType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
             <div>
                <label htmlFor="registrationDate" className="block text-sm font-medium text-slate-700">วันที่สมัคร</label>
                <input
                    type="date"
                    id="registrationDate"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>
            <div>
              <label htmlFor="documentIssuer" className="block text-sm font-medium text-slate-700">ผู้ออกเอกสาร (ถ้ามี)</label>
              <input
                type="text"
                id="documentIssuer"
                value={documentIssuer}
                onChange={(e) => setDocumentIssuer(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="p-6 bg-slate-50 rounded-b-lg flex justify-end">
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                ยกเลิก
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700">
                บันทึกการเปลี่ยนแปลง
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemberModal;