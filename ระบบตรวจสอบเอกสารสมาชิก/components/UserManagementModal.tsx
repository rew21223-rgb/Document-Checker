
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { CloseIcon, PencilIcon, TrashIcon, PlusIcon } from './icons';
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

    if (!isOpen) return null;

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
            password: '', // Leave empty to indicate no change
            role: user.role 
        });
        setError(null);
        setViewMode('FORM');
    };

    const handleSave = () => {
        setError(null);

        // Validation
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
                // Only update password if provided
                if (formData.password) {
                    updatedData.password = formData.password;
                }

                auth.updateUser(updatedData);
                setUsers(prev => prev.map(u => u.id === formData.id ? updatedData : u));

                // If updating self, sync the session state immediately
                if (updatedData.id === currentUser.id) {
                    onUpdateCurrentUser(updatedData);
                }
            }
        } else {
            // Add Mode
            const newUser = auth.addUser({
                username: formData.username,
                password: formData.password,
                role: formData.role
            });
            setUsers(prev => [...prev, newUser]);
        }

        resetForm();
    };

    const handleDeleteUser = () => {
        if (deleteConfirmId) {
            if (auth.deleteUser(deleteConfirmId)) {
                setUsers(prev => prev.filter(u => u.id !== deleteConfirmId));
            }
            setDeleteConfirmId(null);
        }
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
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-slate-500">ผู้ใช้งานทั้งหมด {users.length} คน</p>
                                    <button onClick={handleStartAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium">
                                        <PlusIcon /> เพิ่มผู้ใช้ใหม่
                                    </button>
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
                                            {users.map(user => (
                                                <tr key={user.id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                        {user.username}
                                                        {user.id === currentUser.id && <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">(ฉัน)</span>}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === UserRole.Admin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button 
                                                            onClick={() => handleStartEdit(user)} 
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50"
                                                            title="แก้ไข"
                                                        >
                                                            <PencilIcon />
                                                        </button>
                                                        <button 
                                                            onClick={() => setDeleteConfirmId(user.id)} 
                                                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                            disabled={user.id === currentUser.id}
                                                            title={user.id === currentUser.id ? "ไม่สามารถลบตัวเองได้" : "ลบ"}
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4 max-w-md mx-auto">
                                <h3 className="text-lg font-medium text-slate-900 border-b pb-2">
                                    {formData.id ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
                                </h3>
                                
                                {error && (
                                    <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">ชื่อผู้ใช้</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData(p => ({ ...p, username: e.target.value }))}
                                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        {formData.id ? 'รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)' : 'รหัสผ่าน'}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder={formData.id ? '••••••••' : ''}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">ความยาวอย่างน้อย 4 ตัวอักษร</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">สิทธิ์การใช้งาน</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData(p => ({ ...p, role: e.target.value as UserRole }))}
                                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                        disabled={formData.id === currentUser.id}
                                    >
                                        <option value={UserRole.Reviewer}>Reviewer (ผู้ตรวจสอบ)</option>
                                        <option value={UserRole.Admin}>Admin (ผู้ดูแลระบบ)</option>
                                    </select>
                                    {formData.id === currentUser.id && (
                                        <p className="text-xs text-amber-600 mt-1">เพื่อความปลอดภัย คุณไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้</p>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 shadow-sm font-medium">
                                        บันทึก
                                    </button>
                                    <button onClick={resetForm} className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-md hover:bg-slate-50 font-medium">
                                        ยกเลิก
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-b-lg text-right border-t">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50">ปิด</button>
                    </div>
                </div>
            </div>

            {deleteConfirmId && (
                <ConfirmationModal
                    isOpen={!!deleteConfirmId}
                    onClose={() => setDeleteConfirmId(null)}
                    onConfirm={handleDeleteUser}
                    title="ยืนยันการลบผู้ใช้"
                    message="คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
                />
            )}
        </>
    );
};

export default UserManagementModal;
