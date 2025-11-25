
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';
import { AppConfig } from '../types';

interface GoogleSheetCredsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AppConfig) => void;
  currentScriptUrl: string | null;
}

const GoogleSheetCredsModal: React.FC<GoogleSheetCredsModalProps> = ({ isOpen, onClose, onSave, currentScriptUrl }) => {
  const [scriptUrl, setScriptUrl] = useState(currentScriptUrl || '');

  useEffect(() => {
    setScriptUrl(currentScriptUrl || '');
  }, [currentScriptUrl, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scriptUrl.trim()) {
      onSave({ scriptUrl: scriptUrl.trim() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">ตั้งค่าการเชื่อมต่อ</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
             <div>
                <label htmlFor="scriptUrl" className="block text-sm font-medium text-slate-700">
                  Google Apps Script URL (Web App)
                </label>
                <input
                  id="scriptUrl"
                  name="scriptUrl"
                  type="url"
                  value={scriptUrl}
                  onChange={(e) => setScriptUrl(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
                 <p className="text-xs text-slate-500 mt-2">
                    URL ที่ได้จากการ Deploy เป็น Web App ใน Google Apps Script (ตั้งค่า Who has access เป็น Anyone)
                </p>
              </div>
          </div>
          <div className="p-6 bg-slate-50 rounded-b-lg flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50">
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoogleSheetCredsModal;
