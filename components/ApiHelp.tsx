import React, { useState } from 'react';

const CopyableText: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="relative my-1">
            <code className="block bg-slate-200 p-2 rounded text-xs mt-1 font-mono break-all pr-12">{text}</code>
            <button
                onClick={handleCopy}
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-slate-300 hover:bg-slate-400 text-slate-800 text-xs font-bold py-1 px-2 rounded"
                aria-label="Copy to clipboard"
            >
                {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
            </button>
        </div>
    );
};


const ApiHelp: React.FC = () => {
    const origin = window.location.origin;
    return (
    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
        <h4 className="font-bold mb-2">วิธีรับค่า API Key และ Client ID</h4>
        <ol className="list-decimal list-inside space-y-3">
            <li>
                <strong>API Key และ Client ID:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-2 text-xs text-slate-600">
                    <li>
                        ไปที่ <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a> และสร้างโปรเจกต์ใหม่ (หรือเลือกโปรเจกต์ที่มีอยู่)
                    </li>
                    <li>
                        เปิดใช้งาน API ที่จำเป็น:
                        <ul className='list-item ml-4'>
                           <li><a href="https://console.cloud.google.com/apis/library/sheets.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Sheets API</a></li>
                        </ul>
                    </li>
                    <li>
                        ไปที่หน้า <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Credentials</a>
                    </li>
                    <li>
                        <strong>สร้าง API Key:</strong> คลิก "CREATE CREDENTIALS" &rarr; "API key". คัดลอกคีย์ที่ได้มาใส่ในช่อง "API Key"
                    </li>
                    <li>
                        <strong>สร้าง Client ID:</strong>
                        <ul className="list-decimal list-inside ml-4 mt-1">
                            <li>คลิก "CREATE CREDENTIALS" &rarr; "OAuth client ID"</li>
                            <li>เลือก "Web application"</li>
                            <li>
                                ในส่วน "Authorized JavaScript origins" คลิก "ADD URI" และใส่ Origin ปัจจุบันของแอปพลิเคชันนี้:
                                <CopyableText text={origin} />
                                <p className="mt-1">
                                (Google ไม่อนุญาตให้ใช้ wildcard เช่น `*.scf.usercontent.goog` คุณต้องระบุ Origin ที่ถูกต้องตามที่แสดงด้านบน)
                                </p>
                            </li>
                            <li>
                                ในส่วน "Authorized redirect URIs" คลิก "ADD URI" และใส่ค่าเดียวกัน:
                                <CopyableText text={origin} />
                            </li>
                            <li>คลิก "Create" และคัดลอก "Client ID" ที่ได้มาใส่ในช่อง "Client ID"</li>
                        </ul>
                    </li>
                     <li>
                        <strong>ตั้งค่าหน้าจอขอความยินยอม (OAuth consent screen):</strong>
                         <p className="ml-4">หากสถานะเป็น "Testing" คุณต้องเพิ่มอีเมล Google ของคุณในส่วน "Test users"</p>
                    </li>
                </ul>
            </li>
        </ol>
    </div>
)};

export default ApiHelp;