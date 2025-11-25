import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { CloseIcon, PencilIcon, TrashIcon, PlusIcon, DownloadIcon, UploadIcon } from './icons';
import * as auth from '../auth';
import ConfirmationModal from './ConfirmationModal';

interface UserManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User;
    onUpdateCurrentUser: (user: User) => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, users, setUsers, currentUser, onUpdateCurrentUser }) => {
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [formData, setFormData] = useState({ id: '', username: '', password: '', role: UserRole.Reviewer });
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // Helper to check if user is a hardcoded system user
    const isSystemUser = (user: User) => user.id.startsWith('sys_');

    const resetForm = () => {
        setFormData({ id: '', username: '', password: '', role: UserRole.Reviewer });
        setError(null);
        setViewMode('LIST');
    };

    const handleStartAdd = () => {
        setFormData({ id: '', username: '', password: '', role: UserRole.Reviewer });
        setError(null);
        setViewMode('FORM');
    };

    const handleStartEdit = (user: User) => {
        setFormData({ 
            id: user.id, 
            username: user.username, 
            password: '', 
            role: user.role 
        });
        setError(null);
        setViewMode('FORM');
    };

    const handleSave = () => {
        setError(null);

        if (!formData.username.trim()) {
            setError('กรุณาระบุชื่อผู้ใช้');
            return;
        }
        if (formData.username.length < 3) {
            setError('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
            return;
        }
        if (auth.usernameExists(formData.username, formData.id)) {
            setError('ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว');
            return;
        }
        if (!formData.id && !formData.password) {
            setError('กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
            return;
        }
        if (formData.password && formData.password.length < 4) {
            setError('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
            return;
        }

        if (formData.id) {
            // Edit Mode
            const userToUpdate = users.find(u => u.id === formData.id);
            if (userToUpdate) {
                const updatedData: User = {
                    ...userToUpdate,
                    username: formData.username,
                    role: formData.role,
                };
                if (formData.password) updatedData.password = formData.password;

                const result = auth.updateUser(updatedData);
                if (result) {
                    setUsers(prev => prev.map(u => u.id === formData.id ? updatedData : u));
                    if (updatedData.id === currentUser.id) onUpdateCurrentUser(updatedData);
                    resetForm();
                } else {
                    setError("ไม่สามารถแก้ไขผู้ใช้นี้ได้ (อาจเป็นผู้ใช้ระบบ)");
                }
            }
        } else {
            // Add Mode
            try {
                const newUser = auth.addUser({
                    username: formData.username,
                    password: formData.password,
                    role: formData.role
                });
                setUsers(prev => [...prev, newUser]);
                resetForm();
            } catch (e: any) {
                setError(e.message);
            }
        }
    };

    const handleDeleteUser = () => {
        if (deleteConfirmId) {
            if (auth.deleteUser(deleteConfirmId)) {
                setUsers(prev => prev.filter(u => u.id !== deleteConfirmId));
            }
            setDeleteConfirmId(null);
        }
    };

    const handleExportUsers = () => {
        // Only export local users (filtering out system users) or export all?
        // Let's export all for backup purposes
        const dataStr = JSON.stringify(users, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const parsedUsers = JSON.parse(content);
                
                if (Array.isArray(parsedUsers) && parsedUsers.every(u => u.username && u.role)) {
                    if (window.confirm(`ต้องการนำเข้าข้อมูลผู้ใช้ ${parsedUsers.length} รายการหรือไม่? (ผู้ใช้ที่มีชื่อซ้ำจะถูกข้าม)`)) {
                        // Filter out system users from import to avoid conflict logic issues
                        const nonSystemUsers = parsedUsers.filter((u: User) => !u.id.startsWith('sys_'));
                        
                        // Manually add to local storage to merge
                        // Simple approach: Replace local storage with these (excluding system ones)
                        localStorage.setItem('document_checker_users', JSON.stringify(nonSystemUsers));
                        
                        // Refresh list
                        setUsers(auth.getUsers());
                        alert('นำเข้าข้อมูลผู้ใช้เรียบร้อยแล้ว');
                    }
                } else {
                    alert('รูปแบบไฟล์ไม่ถูกต้อง');
                }
            } catch (err) {
                alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b flex justify-between items-center shrink-0">
                        <h2 className="text-xl font-bold">จัดการผู้ใช้งาน</h2>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                        {viewMode === 'LIST' ? (
                            <>
                                <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                                    <p className="text-sm text-slate-500">ผู้ใช้งานทั้งหมด {users.length} คน</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50 text-sm shadow-sm">
                                            <UploadIcon /> <span className="hidden sm:inline">Import</span>
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleImportUsers} className="hidden" accept=".json" />
                                        <button onClick={handleExportUsers} className="flex items-center gap-1 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50 text-sm shadow-sm">
                                            <DownloadIcon /> <span className="hidden sm:inline">Export</span>
                                        </button>
                                        <button onClick={handleStartAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium">
                                            <PlusIcon /> เพิ่มผู้ใช้ใหม่
                                        </button>
                                    </div>
                                </div>

                                <div className="border rounded-md overflow-hidden">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ชื่อผู้ใช้</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">สิทธิ์</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {users.map(user => {
                                                const isSys = isSystemUser(user);
                                                return (
                                                    <tr key={user.id} className="hover:bg-slate-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                            {user.username}
                                                            {user.id === currentUser.id && <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">(ฉัน)</span>}
                                                            {isSys && <span className="ml-2 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300">System</span>}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === UserRole.Admin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button 
                                                                onClick={() => handleStartEdit(user)} 
                                                                className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                disabled={isSys}
                                                                title={isSys ? "ผู้ใช้ระบบไม่สามารถแก้ไขได้" : "แก้ไข"}
                                                            >
                                                                <PencilIcon />
                                                            </button>
                                                            <button 
                                                                onClick={() => setDeleteConfirmId(user.id)} 
                                                                className="text-red-600 hover:text-red-900 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                disabled={isSys || user.id === currentUser.id}
                                                                title={isSys ? "ผู้ใช้ระบบไม่สามารถลบได้" : "ลบ"}
                                                            >
                                                                <TrashIcon />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4 max-w-md mx-auto">
                                {/* ... (Form content remains mostly the same) ... */}
                                <h3 className="text-lg font-medium text-slate-900 border-b pb-2">
                                    {formData.id ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
                                </h3>
                                {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">{error}</div>}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">ชื่อผู้ใช้</label>
                                    <input type="text" value={formData.username} onChange={(e) => setFormData(p => ({ ...p, username: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{formData.id ? 'รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)' : 'รหัสผ่าน'}</label>
                                    <input type="password" value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder={formData.id ? '••••••••' : ''} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">สิทธิ์การใช้งาน</label>
                                    <select value={formData.role} onChange={(e) => setFormData(p => ({ ...p, role: e.target.value as UserRole }))} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" disabled={formData.id === currentUser.id}>
                                        <option value={UserRole.Reviewer}>Reviewer (ผู้ตรวจสอบ)</option>
                                        <option value={UserRole.Admin}>Admin (ผู้ดูแลระบบ)</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 shadow-sm font-medium">บันทึก</button>
                                    <button onClick={resetForm} className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-md hover:bg-slate-50 font-medium">ยกเลิก</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-slate-50 rounded-b-lg text-right border-t">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50">ปิด</button>
                    </div>
                </div>
            </div>
            {deleteConfirmId && <ConfirmationModal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} onConfirm={handleDeleteUser} title="ยืนยันการลบผู้ใช้" message="คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้" />}
        </>
    );
};

export default UserManagementModal;