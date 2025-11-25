import React, { useState, useRef, useEffect } from 'react';
import { AppNotification } from '../types';
import { BellIcon, CheckCircleIcon, WarningTriangleIcon, XCircleIcon, ClockIcon, TrashIcon } from './icons';

interface NotificationCenterProps {
    notifications: AppNotification[];
    onMarkAsRead: (ids: string[]) => void;
    onClearAll: () => void;
    onDelete: (id: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onMarkAsRead, onClearAll, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            // Mark all as read when opening, or we could do it on individual click
            const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
            onMarkAsRead(unreadIds);
        }
    };

    const getIcon = (type: AppNotification['type']) => {
        switch (type) {
            case 'success': return <span className="text-green-500"><CheckCircleIcon /></span>;
            case 'warning': return <span className="text-amber-500"><WarningTriangleIcon /></span>;
            case 'error': return <span className="text-red-500"><XCircleIcon /></span>;
            default: return <span className="text-blue-500"><ClockIcon /></span>;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'เมื่อสักครู่';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
        return date.toLocaleDateString('th-TH');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={handleToggle}
                className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
                title="การแจ้งเตือน"
            >
                <BellIcon />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                    <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-800">การแจ้งเตือน</h3>
                        {notifications.length > 0 && (
                            <button 
                                onClick={onClearAll}
                                className="text-xs text-slate-500 hover:text-red-600 transition-colors"
                            >
                                ล้างทั้งหมด
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <p>ไม่มีการแจ้งเตือนใหม่</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {notifications.map(notification => (
                                    <li key={notification.id} className={`p-4 hover:bg-slate-50 transition-colors relative group ${!notification.isRead ? 'bg-blue-50/50' : ''}`}>
                                        <div className="flex gap-3 items-start pr-6">
                                            <div className="flex-shrink-0 mt-1">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm text-slate-800 ${!notification.isRead ? 'font-medium' : ''}`}>
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {formatDate(notification.timestamp)}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
                                                className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="ลบ"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;