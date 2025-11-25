
import React, { useState, useRef, useEffect } from 'react';
import { MemberType } from '../types';
import { CloseIcon, LightningBoltIcon } from './icons';

interface AddMemberModalProps {
  onClose: () => void;
  onAddMember: (newMember: { name: string; memberType: MemberType; documentIssuer: string; registrationDate: string; }) => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose, onAddMember }) => {
  const [name, setName] = useState('');
  const [memberType, setMemberType] = useState<MemberType>(MemberType.Current);
  const [registrationDate, setRegistrationDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentIssuer, setDocumentIssuer] = useState('');
  const [fastMode, setFastMode] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('กรุณาระบุชื่อ-สกุล');
      return;
    }
    if (!memberType) {
      setError('กรุณาระบุประเภทสมาชิก');
      return;
    }
    if (!registrationDate) {
      setError('กรุณาระบุวันที่สมัคร');
      return;
    }

    onAddMember({ name, memberType, documentIssuer, registrationDate });
    
    setName('');
    setDocumentIssuer('');
    // Keep the date as is or reset to today? Usually keeping it is better for batch entry
    // setRegistrationDate(new Date().toISOString().split('T')[0]); 
    
    if (!fastMode) {
      onClose();
    } else {
      nameInputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">เพิ่มสมาชิกใหม่</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">ชื่อ-สกุล <span className="text-red-500">*</span></label>
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
              <label htmlFor="memberType" className="block text-sm font-medium text-slate-700">ประเภทสมาชิก <span className="text-red-500">*</span></label>
              <select
                id="memberType"
                value={memberType}
                onChange={(e) => setMemberType(e.target.value as MemberType)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {Object.values(MemberType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
                <label htmlFor="registrationDate" className="block text-sm font-medium text-slate-700">วันที่สมัคร <span className="text-red-500">*</span></label>
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
          <div className="p-6 bg-slate-50 rounded-b-lg flex justify-between items-center">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={fastMode} onChange={() => setFastMode(p => !p)} className="rounded text-blue-600 focus:ring-blue-500"/>
              <LightningBoltIcon />
              โหมดเร็ว (เพิ่มต่อเนื่อง)
            </label>
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                ยกเลิก
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700">
                บันทึก
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
