import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Member, MemberType, FilterStatus, User, UserRole, DocumentHistoryLog, AppNotification, AppConfig } from './types';
import { getRequiredDocuments, getCoreRequiredDocuments } from './constants';
import * as auth from './auth';
import * as gsheet from './googleApi';
import { MemberWithRow } from './googleApi';

import Dashboard from './components/Dashboard';
import Controls from './components/Controls';
import MemberTable from './components/MemberTable';
import Pagination from './components/Pagination';
import AddMemberModal from './components/AddMemberModal';
import ImportModal from './components/ImportModal';
import DocumentChecklistModal from './components/DocumentChecklistModal';
import ConfirmationModal from './components/ConfirmationModal';
import LoginScreen from './components/LoginScreen';
import UserManagementModal from './components/UserManagementModal';
import HistoryModal from './components/HistoryModal';
import EditMemberModal from './components/EditMemberModal';
import GoogleSheetSetup from './components/GoogleSheetSetup';
import GoogleSheetCredsModal from './components/GoogleSheetCredsModal';
import NotificationCenter from './components/NotificationCenter';
import ReportModal from './components/ReportModal';
import LoadingOverlay from './components/LoadingOverlay';

// Default Apps Script URL provided by user
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzBsgNrkuieqsCyScyGRcRsFD8grZAW3oafEZ5iRYHDPoXD_7nH_klfaAi7kXAIOk04/exec';
// Direct link to the Google Sheet for easy access
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1V6CAPIIcmUB5wtxyzvYNRWW_YOFBU3v6JZ0cp7EpJtg/edit';

const App: React.FC = () => {
    // User Auth State
    const [currentUser, setCurrentUser] = useState<User | null>(() => auth.getCurrentUser());
    const [users, setUsers] = useState<User[]>(() => auth.getUsers());

    // Google Apps Script URL - Use stored URL or Default
    const [scriptUrl, setScriptUrl] = useState<string | null>(() => {
        try {
            return localStorage.getItem('appsScriptUrl') || DEFAULT_SCRIPT_URL;
        } catch (e) { return DEFAULT_SCRIPT_URL; }
    });

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('กำลังประมวลผล...');
    const [error, setError] = useState<string | null>(null);
    const [retryAction, setRetryAction] = useState<(() => void) | null>(null);
    
    // Flag for offline mode - Default to false to try connecting automatically
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    // App Data State
    const [members, setMembers] = useState<MemberWithRow[]>(() => {
        try {
            const saved = localStorage.getItem('local_members');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.map((m: any) => {
                    // MIGRATION LOGIC FOR OLD DATA TYPES
                    let newType = m.memberType;
                    const typeStr = String(m.memberType).trim();
                    
                    if (typeStr.includes('พนักงานปัจจุบัน') || typeStr.includes('เจ้าหน้าที่สหกรณ์')) {
                        newType = MemberType.Current;
                    } else if (typeStr === 'นอกหน่วย' || typeStr === 'สมาชิกนอกหน่วย') {
                        newType = MemberType.External;
                    }

                    return {
                        ...m,
                        id: String(m.id).trim().padStart(5, '0'), // Ensure ID padding on load
                        memberType: newType
                    };
                });
            }
            return [];
        } catch (e) { return []; }
    });

    const [notifications, setNotifications] = useState<AppNotification[]>(() => {
        try {
            const saved = localStorage.getItem('app_notifications');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>(FilterStatus.All);
    const [filterType, setFilterType] = useState<MemberType | 'ทั้งหมด'>('ทั้งหมด');
    const [filterIssuer, setFilterIssuer] = useState('');
    const [filterAuditor, setFilterAuditor] = useState('');
    
    // UI State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isUserManagementModalOpen, setUserManagementModalOpen] = useState(false);
    const [isCredsModalOpen, setCredsModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<MemberWithRow | null>(null);
    const [editingMemberDetails, setEditingMemberDetails] = useState<MemberWithRow | null>(null);
    const [deletingMember, setDeletingMember] = useState<MemberWithRow | null>(null);
    const [viewingHistoryMember, setViewingHistoryMember] = useState<Member | null>(null);

    const isOnline = useMemo(() => 
        !!(scriptUrl && !isOfflineMode), 
        [scriptUrl, isOfflineMode]
    );

    // --- PERSISTENCE LOGIC ---
    useEffect(() => {
        if (!isOnline) {
            try {
                localStorage.setItem('local_members', JSON.stringify(members));
            } catch (e) {
                console.error("Failed to save to local storage", e);
                setError("พื้นที่จัดเก็บเต็มหรือไม่สามารถบันทึกข้อมูลได้");
            }
        }
    }, [members, isOnline]);

    // Save notifications
    useEffect(() => {
        try {
            localStorage.setItem('app_notifications', JSON.stringify(notifications));
        } catch (e) {
            console.error("Failed to save notifications", e);
        }
    }, [notifications]);

    // --- NOTIFICATION LOGIC ---
    const addNotification = (type: AppNotification['type'], message: string) => {
        const newNote: AppNotification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type,
            message,
            timestamp: new Date().toISOString(),
            isRead: false
        };
        setNotifications(prev => [newNote, ...prev].slice(0, 50)); // Keep last 50
    };

    const handleMarkNotificationsRead = (ids: string[]) => {
        setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n));
    };

    const handleClearAllNotifications = () => {
        setNotifications([]);
    };
    
    const handleDeleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }

    // Check for overdue documents
    useEffect(() => {
        const checkForOverdue = () => {
            const now = new Date();
            const overdueMembers = members.filter(m => {
                const regDate = new Date(m.registrationDate);
                const diffTime = Math.abs(now.getTime() - regDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                const coreDocs = getCoreRequiredDocuments(m.memberType);
                const isComplete = coreDocs.every(doc => m.documents[doc.name]);
                
                return diffDays > 30 && !isComplete;
            });

            if (overdueMembers.length > 0) {
                const today = new Date().toDateString();
                const alreadyWarned = notifications.some(n => 
                    n.type === 'warning' && 
                    n.message.includes('เอกสารค้างส่ง') && 
                    new Date(n.timestamp).toDateString() === today
                );

                if (!alreadyWarned) {
                    addNotification('warning', `แจ้งเตือน: มีสมาชิก ${overdueMembers.length} รายที่สมัครเกิน 30 วันแล้วแต่เอกสารยังไม่ครบ`);
                }
            }
        };
        
        const timer = setTimeout(checkForOverdue, 2000);
        return () => clearTimeout(timer);
    }, [members]);


    const saveToLocal = (data: MemberWithRow[]) => {
        try {
            localStorage.setItem('local_members', JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save to local storage", e);
        }
    };

    const loadSheetData = useCallback(async () => {
        if (!scriptUrl || isOfflineMode) return;
        setLoadingMessage('กำลังโหลดข้อมูลสมาชิก...');
        setIsLoading(true);
        setError(null);
        setRetryAction(null);

        try {
            const data = await gsheet.loadMembers(scriptUrl);
            setMembers(data);
            saveToLocal(data); 
        } catch (err: any) {
            console.error(err);
            setError(`ไม่สามารถโหลดข้อมูลจาก Google Sheet ได้: ${err.message}`);
            // Offer a retry action
            setRetryAction(() => loadSheetData);
        } finally {
            setIsLoading(false);
        }
    }, [scriptUrl, isOfflineMode]);

    // Initialize connection if script URL exists
    useEffect(() => {
        if (scriptUrl && !isOfflineMode) {
            loadSheetData();
        }
    }, [scriptUrl, isOfflineMode, loadSheetData]);


    const handleLogin = (user: User) => setCurrentUser(user);
    const handleLogout = () => {
        auth.logout();
        setCurrentUser(null);
    };

    // Update current user state and session storage when they edit their own profile
    const handleUpdateCurrentUser = (updatedUser: User) => {
        setCurrentUser(updatedUser);
        // We need to re-save to sessionStorage to persist the update across reloads
        // (assuming auth.login does this, but we need to do it here for updates)
        const { password, ...userToStore } = updatedUser;
        sessionStorage.setItem('currentUser', JSON.stringify(userToStore));
    };
    
    const handleSaveSettings = (config: AppConfig) => {
        if (currentUser?.role !== UserRole.Admin) {
            addNotification('error', 'คุณไม่มีสิทธิ์ในการตั้งค่าระบบ');
            return;
        }
        localStorage.setItem('appsScriptUrl', config.scriptUrl);
        setScriptUrl(config.scriptUrl);
        setCredsModalOpen(false);
        setIsOfflineMode(false); 
        // Trigger reload
        setTimeout(() => loadSheetData(), 100);
    };
    
    const retryInitialization = () => {
        setError(null);
        if(scriptUrl) {
            setIsOfflineMode(false);
            loadSheetData();
        }
    };

    const handleOpenGoogleSheet = () => {
        if (currentUser?.role !== UserRole.Admin) {
            addNotification('error', 'คุณไม่มีสิทธิ์เข้าถึง Google Sheet โดยตรง');
            return;
        }
        window.open(GOOGLE_SHEET_URL, '_blank');
    };
    
    // Helper to save member locally
    const saveMemberLocally = (newMember: Member) => {
        const localMember: MemberWithRow = { ...newMember, rowIndex: -1, sheetName: 'Local' };
        setMembers(prev => [...prev, localMember]);
    };

    const handleAddMember = async (newMemberData: { name: string; memberType: MemberType; documentIssuer: string; registrationDate: string }) => {
        if (!currentUser) return;
        
        const requiredDocs = getRequiredDocuments(newMemberData.memberType);
        const documents = requiredDocs.reduce((acc: Record<string, boolean>, doc) => ({ ...acc, [doc.name]: false }), {});
        
        // Find max ID to increment
        const maxId = members.length > 0 ? Math.max(...members.map(m => parseInt(m.id, 10)).filter(id => !isNaN(id))) : 0;
        const newId = String(maxId + 1).padStart(5, '0');
        
        const newMember: Member = {
            ...newMemberData,
            id: newId,
            registrationDate: new Date(newMemberData.registrationDate).toISOString(), // Use provided date
            documents,
            auditor: currentUser.username,
            documentHistory: [],
        };

        if (isOnline && scriptUrl) {
            setLoadingMessage(`กำลังบันทึกสมาชิกใหม่: ${newMemberData.name}...`);
            setIsLoading(true);
            try {
                await gsheet.addMember(scriptUrl, newMember);
                await loadSheetData(); 
                addNotification('success', `เพิ่มสมาชิกใหม่เรียบร้อย: ${newMemberData.name} (${newId})`);
            } catch (err: any) {
                console.error("API Error during Add:", err);
                // Fallback to local save to prevent data loss
                saveMemberLocally(newMember);
                addNotification('warning', `การเชื่อมต่อขัดข้อง: บันทึก "${newMemberData.name}" ลงในเครื่องแทนแล้ว`);
            } finally {
                setIsLoading(false);
            }
        } else {
            saveMemberLocally(newMember);
            addNotification('success', `เพิ่มสมาชิกใหม่เรียบร้อย (Local): ${newMemberData.name} (${newId})`);
        }
    };
    
    const handleUpdateMemberDocs = async (memberId: string, updatedDocs: Record<string, boolean>) => {
        if (!currentUser) return;
        
        const memberToUpdate = members.find(m => m.id === memberId);
        if (!memberToUpdate) return;

        const changes: DocumentHistoryLog['changes'] = [];
        Object.keys(updatedDocs).forEach(docKey => {
            if (memberToUpdate.documents[docKey] !== updatedDocs[docKey]) {
                changes.push({
                    document: docKey,
                    from: !!memberToUpdate.documents[docKey],
                    to: updatedDocs[docKey],
                });
            }
        });

        let updatedMember = memberToUpdate;
        if (changes.length > 0) {
            const historyLog: DocumentHistoryLog = {
                timestamp: new Date().toISOString(),
                auditor: currentUser.username,
                changes,
            };
            updatedMember = { 
                ...memberToUpdate, 
                documents: updatedDocs, 
                auditor: currentUser.username, 
                documentHistory: [historyLog, ...memberToUpdate.documentHistory] 
            };
        }

        if (isOnline && scriptUrl) {
            setLoadingMessage('กำลังบันทึกสถานะเอกสาร...');
            setIsLoading(true);
            try {
                await gsheet.updateMember(scriptUrl, updatedMember);
                setMembers(prev => prev.map(m => m.id === memberId ? updatedMember : m));
            } catch (err: any) {
                setError(`ไม่สามารถอัปเดตเอกสารได้: ${err.message}`);
            } finally {
                setIsLoading(false);
                setEditingMember(null);
            }
        } else {
            const updatedList = members.map(m => m.id === memberId ? updatedMember : m);
            setMembers(updatedList);
            setEditingMember(null);
        }
    };

    const handleUpdateMemberDetails = async (memberId: string, updatedDetails: { name: string; memberType: MemberType, registrationDate: string; documentIssuer: string; }) => {
        if (!currentUser) return;

        const memberToUpdate = members.find(m => m.id === memberId);
        if (!memberToUpdate) return;
        
        const wasTypeChanged = memberToUpdate.memberType !== updatedDetails.memberType;

        if (isOnline && scriptUrl) {
            setLoadingMessage('กำลังบันทึกการแก้ไขข้อมูลสมาชิก...');
            setIsLoading(true);
            try {
                if (wasTypeChanged) {
                    // If type changed, we might need to move sheets in backend logic or just delete and re-add
                    // Simplified strategy: Delete old, Add new
                    const newDocuments = getRequiredDocuments(updatedDetails.memberType).reduce((acc: Record<string, boolean>, doc) => ({ ...acc, [doc.name]: false }), {});
                    const newMemberData: Member = {
                        ...memberToUpdate,
                        ...updatedDetails,
                        documents: newDocuments,
                        auditor: currentUser.username,
                        documentHistory: [],
                    };

                    await gsheet.addMember(scriptUrl, newMemberData);
                    await gsheet.deleteMember(scriptUrl, memberToUpdate.rowIndex, memberToUpdate.sheetName);
                    
                    await loadSheetData();
                } else {
                    const updatedMember: MemberWithRow = {
                        ...memberToUpdate,
                        ...updatedDetails,
                        auditor: currentUser.username
                    };

                    await gsheet.updateMember(scriptUrl, updatedMember);
                    setMembers(prev => prev.map(m => m.id === memberId ? updatedMember : m));
                }
                addNotification('info', `แก้ไขข้อมูลสมาชิกเรียบร้อย: ${updatedDetails.name}`);
            } catch (err: any) {
                 setError(`ไม่สามารถแก้ไขข้อมูลสมาชิกได้: ${err.message}`);
            } finally {
                setIsLoading(false);
                setEditingMemberDetails(null);
            }
        } else {
             let updatedMember: MemberWithRow;
             if (wasTypeChanged) {
                  const newDocuments = getRequiredDocuments(updatedDetails.memberType).reduce((acc: Record<string, boolean>, doc) => ({ ...acc, [doc.name]: false }), {});
                  updatedMember = {
                      ...memberToUpdate,
                      ...updatedDetails,
                      documents: newDocuments,
                      documentHistory: [],
                      auditor: currentUser.username
                  };
             } else {
                  updatedMember = {
                      ...memberToUpdate,
                      ...updatedDetails,
                      auditor: currentUser.username
                  };
             }
             const updatedList = members.map(m => m.id === memberId ? updatedMember : m);
             setMembers(updatedList);
             setEditingMemberDetails(null);
             addNotification('info', `แก้ไขข้อมูลสมาชิกเรียบร้อย: ${updatedDetails.name}`);
        }
    };
    
    const handleConfirmDelete = async () => {
        // PERMISSION CHECK: Only Admin can delete
        if (!currentUser || currentUser.role !== UserRole.Admin) {
            addNotification('error', 'คุณไม่มีสิทธิ์ลบข้อมูลสมาชิก');
            setDeletingMember(null);
            return;
        }

        if (!deletingMember) return;
        const name = deletingMember.name;

        if (isOnline && scriptUrl) {
            setLoadingMessage(`กำลังลบข้อมูล: ${name}...`);
            setIsLoading(true);
            try {
                await gsheet.deleteMember(scriptUrl, deletingMember.rowIndex, deletingMember.sheetName);
                await loadSheetData();
                addNotification('success', `ลบสมาชิกเรียบร้อย: ${name}`);
            } catch (err: any) {
                setError(`ไม่สามารถลบสมาชิกได้: ${err.message}`);
            } finally {
                setIsLoading(false);
                setDeletingMember(null);
            }
        } else {
            const updatedList = members.filter(m => m.id !== deletingMember.id);
            setMembers(updatedList);
            setDeletingMember(null);
            addNotification('success', `ลบสมาชิกเรียบร้อย: ${name}`);
        }
    };

    const handleImportMembers = async (importedMembers: { id: string; name: string; memberType: MemberType; registrationDate: string; documentIssuer: string; }[]) => {
        if (!currentUser) return;
        if (currentUser.role !== UserRole.Admin) {
            addNotification('error', 'คุณไม่มีสิทธิ์นำเข้าข้อมูล');
            return;
        }

        // Ensure all imported IDs are padded
        const normalizedImports = importedMembers.map(m => ({
            ...m,
            id: String(m.id).trim().padStart(5, '0')
        }));

        let updatedMembersList = [...members];
        
        if (isOnline && scriptUrl) {
             setLoadingMessage('กำลังเตรียมข้อมูลสำหรับนำเข้า...');
             setIsLoading(true);
             try {
                const existingIds = new Set(members.map(m => m.id));
                
                // Logic 1: Members to ADD (completely new ID)
                const membersToAdd = normalizedImports.filter(m => !existingIds.has(m.id));
                
                // Logic 2: Members to UPDATE (same ID)
                const membersToUpdate = normalizedImports.filter(m => existingIds.has(m.id));

                // Prepare data for Bulk Add
                const bulkAddData = membersToAdd.map(m => {
                    const requiredDocs = getRequiredDocuments(m.memberType);
                    const documents = requiredDocs.reduce((acc: Record<string, boolean>, doc) => ({ ...acc, [doc.name]: false }), {});
                    return { ...m, documents, auditor: currentUser.username, documentHistory: [] };
                });

                // Send Bulk Add Request
                if (bulkAddData.length > 0) {
                    setLoadingMessage(`กำลังเพิ่มสมาชิกใหม่ ${bulkAddData.length} รายการ...`);
                    await gsheet.bulkAddMembers(scriptUrl, bulkAddData);
                }

                // Handle Updates (Loop or Bulk Update - here doing loop for safety as bulk update is complex with row indexes)
                // Optimally, we would add a bulk update endpoint too, but for now let's update essential info
                // Important: We need to know the rowIndex and sheetName from existing data to update correctly
                if (membersToUpdate.length > 0) {
                    for (let i = 0; i < membersToUpdate.length; i++) {
                        const imported = membersToUpdate[i];
                        const existing = members.find(m => m.id === imported.id);
                        
                        setLoadingMessage(`กำลังอัปเดตข้อมูลสมาชิก... (${i + 1}/${membersToUpdate.length})`);

                        if (existing) {
                            // Determine if type changed (requires move) or just data update
                            if (existing.memberType !== imported.memberType) {
                                // Type changed: Delete old, Add new (simplified)
                                await gsheet.deleteMember(scriptUrl, existing.rowIndex, existing.sheetName);
                                const requiredDocs = getRequiredDocuments(imported.memberType);
                                const documents = requiredDocs.reduce((acc: Record<string, boolean>, doc) => ({ ...acc, [doc.name]: false }), {});
                                await gsheet.addMember(scriptUrl, { ...imported, documents, auditor: currentUser.username, documentHistory: [] });
                            } else {
                                // Same type, update details but PRESERVE documents
                                await gsheet.updateMember(scriptUrl, {
                                    ...existing,
                                    name: imported.name,
                                    registrationDate: imported.registrationDate,
                                    documentIssuer: imported.documentIssuer,
                                    auditor: currentUser.username
                                });
                            }
                        }
                    }
                }

                setLoadingMessage('กำลังโหลดข้อมูลล่าสุด...');
                await loadSheetData();
                addNotification('success', `นำเข้าข้อมูลสำเร็จ: เพิ่ม ${membersToAdd.length} รายการ, อัปเดต ${membersToUpdate.length} รายการ`);
             } catch(err: any) {
                 setError(`เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ${err.message}`);
            } finally {
                setIsLoading(false);
            }

        } else {
             let updateCount = 0;
             let addCount = 0;

             normalizedImports.forEach(imported => {
                 const existingIndex = updatedMembersList.findIndex(m => m.id === imported.id);

                 if (existingIndex !== -1) {
                     const existing = updatedMembersList[existingIndex];
                     
                     let finalDocuments = existing.documents;
                     let finalHistory = existing.documentHistory;
                     
                     if (existing.memberType !== imported.memberType) {
                          const requiredDocs = getRequiredDocuments(imported.memberType);
                          finalDocuments = requiredDocs.reduce((acc: Record<string, boolean>, doc) => ({ ...acc, [doc.name]: false }), {});
                          finalHistory = []; 
                     }

                     updatedMembersList[existingIndex] = {
                         ...existing,
                         name: imported.name,
                         memberType: imported.memberType,
                         registrationDate: imported.registrationDate,
                         documentIssuer: imported.documentIssuer,
                         documents: finalDocuments,
                         documentHistory: finalHistory
                     };
                     updateCount++;
                 } else {
                     const requiredDocs = getRequiredDocuments(imported.memberType);
                     const documents = requiredDocs.reduce((acc, doc) => ({ ...acc, [doc.name]: false }), {});
                     
                     updatedMembersList.push({
                         ...imported,
                         documents,
                         auditor: currentUser.username,
                         documentHistory: [],
                         rowIndex: -1,
                         sheetName: 'Local'
                     });
                     addCount++;
                 }
             });

             setMembers(updatedMembersList);
             addNotification('success', `นำเข้าข้อมูลสำเร็จ: เพิ่ม ${addCount} รายการ, อัปเดต ${updateCount} รายการ`);
        }
    };

    const handleClearAllLocalData = () => {
        if (currentUser?.role !== UserRole.Admin) {
            addNotification('error', 'คุณไม่มีสิทธิ์ล้างข้อมูล');
            return;
        }
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลในเครื่องทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
            localStorage.removeItem('local_members');
            setMembers([]);
            addNotification('warning', 'ล้างข้อมูลในเครื่องทั้งหมดเรียบร้อยแล้ว');
        }
    }

    const handleBackupData = () => {
        if (currentUser?.role !== UserRole.Admin) return;
        const dataStr = JSON.stringify(members, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `document_checker_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addNotification('info', 'สำรองข้อมูลเรียบร้อยแล้ว');
    };

    const handleRestoreData = (file: File) => {
        if (currentUser?.role !== UserRole.Admin) {
            addNotification('error', 'คุณไม่มีสิทธิ์กู้คืนข้อมูล');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedData = JSON.parse(content);
                if (Array.isArray(parsedData)) {
                    if(window.confirm(`พบข้อมูลจำนวน ${parsedData.length} รายการ คุณต้องการกู้คืนข้อมูลนี้ใช่หรือไม่? ข้อมูลปัจจุบันจะถูกแทนที่`)) {
                        setMembers(parsedData);
                        addNotification('success', `กู้คืนข้อมูลสำเร็จ (${parsedData.length} รายการ)`);
                    }
                } else {
                    alert('รูปแบบไฟล์ไม่ถูกต้อง');
                }
            } catch (error) {
                alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
            }
        };
        reader.readAsText(file);
    };

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    // If no offline mode selected AND no script URL configured, show setup
    if (!isOfflineMode && !scriptUrl) {
        return <GoogleSheetSetup 
            currentScriptUrl={scriptUrl}
            onSaveScriptUrl={(url) => {
                localStorage.setItem('appsScriptUrl', url);
                setScriptUrl(url);
                setIsOfflineMode(false);
            }}
            error={error} 
            onRetry={retryInitialization}
            onSkip={() => setIsOfflineMode(true)}
            />;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Persistent Status Bar */}
            <div className={`w-full px-4 py-1.5 text-center text-sm font-medium z-40 transition-colors duration-300 shadow-sm ${
                isOnline ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'
            }`}>
                <div className="flex items-center justify-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white' : 'bg-amber-400 animate-pulse'}`}></span>
                    <span>
                        {isOnline 
                            ? 'ระบบออนไลน์: เชื่อมต่อกับ Google Sheet เรียบร้อย' 
                            : 'โหมดออฟไลน์: ข้อมูลจะถูกบันทึกในเครื่องเท่านั้น (Local Storage)'}
                    </span>
                </div>
            </div>

            {isLoading && <LoadingOverlay message={loadingMessage} />}
            
            {/* Enhanced Error Banner */}
            {error && (
                <div className="fixed top-14 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-50">
                    <div className="bg-white border-l-4 border-red-500 rounded-r-lg shadow-xl p-4 flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                            <div className="text-red-500 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-slate-800">เกิดข้อผิดพลาด</h3>
                                <p className="text-sm text-slate-600 mt-1">{error}</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            {retryAction && (
                                <button 
                                    onClick={() => retryAction()} 
                                    className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded hover:bg-blue-100"
                                >
                                    ลองใหม่
                                </button>
                            )}
                            {isOnline && (
                                <button 
                                    onClick={() => { setError(null); setIsOfflineMode(true); }}
                                    className="px-3 py-1.5 bg-slate-50 text-slate-700 text-sm font-medium rounded hover:bg-slate-100"
                                >
                                    ใช้งานโหมดออฟไลน์
                                </button>
                            )}
                            <button 
                                onClick={() => setError(null)} 
                                className="px-3 py-1.5 text-slate-500 text-sm hover:bg-slate-50 rounded"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="p-4 sm:p-6 lg:p-8 flex-1">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">ระบบตรวจสอบเอกสารสมาชิก</h1>
                            <p className="text-slate-500 mt-1">จัดการและตรวจสอบเอกสารการสมัครสมาชิกสหกรณ์</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <NotificationCenter 
                                notifications={notifications} 
                                onMarkAsRead={handleMarkNotificationsRead}
                                onClearAll={handleClearAllNotifications}
                                onDelete={handleDeleteNotification}
                            />
                        </div>
                    </header>

                    <Dashboard stats={
                        (() => {
                             const check = (m: Member) => getCoreRequiredDocuments(m.memberType).every(d => m.documents[d.name]);
                             // Fix: Add explicit type to reducer
                             const initial = Object.values(MemberType).reduce((acc: any, t) => ({...acc, [t as string]: {total:0, complete:0, pending:0, incomplete:0}}), {} as any);
                             const breakdown = members.reduce((acc: any, m) => {
                                if (acc[m.memberType]) {
                                    acc[m.memberType].total++;
                                    const isComplete = check(m);
                                    const hasSome = Object.values(m.documents).some(v=>v);
                                    if(isComplete) acc[m.memberType].complete++;
                                    else if(hasSome) acc[m.memberType].pending++;
                                    else acc[m.memberType].incomplete++;
                                }
                                return acc;
                             }, initial);
                             const complete = members.filter(check).length;
                             const pending = members.filter(m => !check(m) && Object.values(m.documents).some(v=>v)).length;
                             return { total: members.length, complete, pending, incomplete: members.length - complete - pending, byType: breakdown };
                        })()
                    } />

                    <main className="mt-8 bg-white p-6 rounded-lg shadow-sm">
                        <Controls
                            currentUser={currentUser}
                            onAdd={() => setAddModalOpen(true)}
                            onImport={() => setImportModalOpen(true)}
                            onManageUsers={() => setUserManagementModalOpen(true)}
                            onLogout={handleLogout}
                            onClearAllDataRequest={handleClearAllLocalData}
                            onBackup={handleBackupData}
                            onRestore={handleRestoreData}
                            onReport={() => setIsReportModalOpen(true)}
                            onOpenSheet={handleOpenGoogleSheet}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            filterStatus={filterStatus}
                            onFilterStatusChange={setFilterStatus}
                            filterType={filterType}
                            onFilterTypeChange={setFilterType}
                            filterIssuer={filterIssuer}
                            onFilterIssuerChange={setFilterIssuer}
                            filterAuditor={filterAuditor}
                            onFilterAuditorChange={setFilterAuditor}
                            filteredData={members} 
                            onOpenSettings={() => setCredsModalOpen(true)}
                            connectionStatus={isOnline ? 'signedIn' : 'offline'}
                        />

                        <div id="print-area">
                             <h2 className="text-xl font-bold text-slate-700 my-4 print:block hidden">รายงานข้อมูลสมาชิก</h2>
                             <p className="print:block hidden text-sm text-slate-500 mb-4">ณ วันที่ {new Date().toLocaleDateString('th-TH')}</p>
                            <MemberTable
                                members={
                                    members.filter(m => {
                                        const s = searchTerm.toLowerCase();
                                        // Fix: explicit type for d
                                        const isC = getCoreRequiredDocuments(m.memberType).every((d: any) => m.documents[d.name]);
                                        const txt = isC ? 'เอกสารครบ' : 'ไม่ครบ';
                                        
                                        const m1 = m.name.toLowerCase().includes(s) || m.id.toLowerCase().includes(s) || txt.toLowerCase().includes(s);
                                        const m2 = filterType === 'ทั้งหมด' || m.memberType === filterType;
                                        const m3 = filterStatus === FilterStatus.All ? true : (filterStatus === FilterStatus.Complete ? isC : !isC);
                                        const m4 = filterIssuer === '' || (m.documentIssuer && m.documentIssuer.toLowerCase().includes(filterIssuer.toLowerCase()));
                                        const m5 = filterAuditor === '' || (m.auditor && m.auditor.toLowerCase().includes(filterAuditor.toLowerCase()));

                                        return m1 && m2 && m3 && m4 && m5;
                                     }).sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
                                     .slice((currentPage - 1) * itemsPerPage, itemsPerPage === 0 ? undefined : (currentPage - 1) * itemsPerPage + itemsPerPage)
                                }
                                currentUser={currentUser}
                                onCheckDocuments={setEditingMember}
                                onEditDetails={setEditingMemberDetails}
                                onDelete={(id) => setDeletingMember(members.find(m => m.id === id) || null)}
                                onViewHistory={setViewingHistoryMember}
                            />
                        </div>
                        
                        <Pagination
                            currentPage={currentPage}
                            totalItems={
                                members.filter(m => {
                                    const s = searchTerm.toLowerCase();
                                    // Fix: explicit type
                                    const isC = getCoreRequiredDocuments(m.memberType).every((d: any) => m.documents[d.name]);
                                    const txt = isC ? 'เอกสารครบ' : 'ไม่ครบ';
                                    const m1 = m.name.toLowerCase().includes(s) || m.id.toLowerCase().includes(s) || txt.toLowerCase().includes(s);
                                    const m2 = filterType === 'ทั้งหมด' || m.memberType === filterType;
                                    const m3 = filterStatus === FilterStatus.All ? true : (filterStatus === FilterStatus.Complete ? isC : !isC);
                                    const m4 = filterIssuer === '' || (m.documentIssuer && m.documentIssuer.toLowerCase().includes(filterIssuer.toLowerCase()));
                                    const m5 = filterAuditor === '' || (m.auditor && m.auditor.toLowerCase().includes(filterAuditor.toLowerCase()));
                                    return m1 && m2 && m3 && m4 && m5;
                                }).length
                            }
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    </main>
                </div>
            </div>

            {/* Modals */}
            {isAddModalOpen && (
                <AddMemberModal onClose={() => setAddModalOpen(false)} onAddMember={handleAddMember} />
            )}
            {isImportModalOpen && (
                <ImportModal onClose={() => setImportModalOpen(false)} onImport={handleImportMembers} />
            )}
            {isReportModalOpen && (
                <ReportModal members={members} onClose={() => setIsReportModalOpen(false)} />
            )}
            {editingMemberDetails && (
                <EditMemberModal member={editingMemberDetails} onClose={() => setEditingMemberDetails(null)} onUpdate={handleUpdateMemberDetails} />
            )}
            {currentUser.role === UserRole.Admin && isUserManagementModalOpen && (
                <UserManagementModal 
                    isOpen={isUserManagementModalOpen} 
                    onClose={() => setUserManagementModalOpen(false)} 
                    users={users} 
                    setUsers={setUsers} 
                    currentUser={currentUser}
                    onUpdateCurrentUser={handleUpdateCurrentUser}
                />
            )}
            {editingMember && (
                <DocumentChecklistModal member={editingMember} onClose={() => setEditingMember(null)} onSave={handleUpdateMemberDocs} />
            )}
            {viewingHistoryMember && (
                <HistoryModal member={viewingHistoryMember} onClose={() => setViewingHistoryMember(null)} />
            )}
            {deletingMember && (
                <ConfirmationModal isOpen={!!deletingMember} onClose={() => setDeletingMember(null)} onConfirm={handleConfirmDelete} title="ยืนยันการลบสมาชิก" message={`คุณแน่ใจหรือไม่ว่าต้องการลบ "${deletingMember.name}"? การกระทำนี้ไม่สามารถย้อนกลับได้`} />
            )}
            {isCredsModalOpen && (
                <GoogleSheetCredsModal 
                    isOpen={isCredsModalOpen}
                    onClose={() => setCredsModalOpen(false)}
                    onSave={handleSaveSettings}
                    currentScriptUrl={scriptUrl}
                />
            )}
        </div>
    );
};

export default App;