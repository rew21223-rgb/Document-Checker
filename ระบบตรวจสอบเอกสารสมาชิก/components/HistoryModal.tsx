import React from 'react';
import { Member } from '../types';
import { CloseIcon } from './icons';

interface HistoryModalProps {
  member: Member;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ member, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">ประวัติการเปลี่ยนแปลงเอกสาร</h2>
            <p className="text-slate-600 mt-1">{member.name} ({member.id})</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {member.documentHistory.length === 0 ? (
            <p className="text-slate-500 text-center py-8">ไม่มีประวัติการเปลี่ยนแปลง</p>
          ) : (
            <div className="space-y-4">
              {member.documentHistory.map((log) => (
                <div key={log.timestamp} className="p-4 border rounded-md bg-slate-50">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b">
                    <p className="font-semibold text-slate-800">ผู้ตรวจสอบ: {log.auditor}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(log.timestamp).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {log.changes.map((change, index) => (
                      <li key={index}>
                        <span className="font-medium">{change.document}:</span>
                        <span className={`ml-2 font-semibold ${change.to ? 'text-green-600' : 'text-red-600'}`}>
                            เปลี่ยนเป็น "{change.to ? 'มีเอกสาร' : 'ไม่มีเอกสาร'}"
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-100 rounded-b-lg text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;