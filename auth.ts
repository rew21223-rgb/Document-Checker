import { User, UserRole } from './types';

const USERS_STORAGE_KEY = 'document_checker_users';

// --- SYSTEM USERS (ฝังถาวร ใช้ได้ทุกเครื่อง) ---
// คุณสามารถเพิ่ม/ลบ ผู้ใช้ที่ต้องการให้มีทุกที่ได้ตรงนี้
const SYSTEM_USERS: User[] = [
    { id: 'sys_admin', username: 'admin', password: 'admin', role: UserRole.Admin },
    { id: 'sys_reviewer', username: 'reviewer', password: '123', role: UserRole.Reviewer },
];

// Helper: ดึง User ที่เพิ่มเองจากเครื่อง (Local Storage)
const getLocalUsers = (): User[] => {
    try {
        const json = localStorage.getItem(USERS_STORAGE_KEY);
        return json ? JSON.parse(json) : [];
    } catch {
        return [];
    }
};

// Helper: บันทึก User ที่เพิ่มเองลงเครื่อง
const saveLocalUsers = (users: User[]): void => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// ดึงรายชื่อผู้ใช้ทั้งหมด (System + Local)
export const getUsers = (): User[] => {
    const localUsers = getLocalUsers();
    // รวมผู้ใช้ 2 กลุ่มเข้าด้วยกัน
    return [...SYSTEM_USERS, ...localUsers];
};

export const login = (username: string, password: string): User | null => {
    const allUsers = getUsers();
    const user = allUsers.find(u => u.username === username && u.password === password);
    if (user) {
        const { password, ...userToStore } = user;
        sessionStorage.setItem('currentUser', JSON.stringify(userToStore));
        return userToStore;
    }
    return null;
};

export const logout = (): void => {
    sessionStorage.removeItem('currentUser');
};

export const getCurrentUser = (): User | null => {
    const userJson = sessionStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
};

// เพิ่มผู้ใช้ใหม่ (จะถูกบันทึกลง Local Storage ของเครื่องนั้นๆ)
export const addUser = (newUser: Omit<User, 'id'>): User => {
    const localUsers = getLocalUsers();
    
    // เช็คซ้ำกับทั้ง System และ Local
    if (getUsers().some(u => u.username === newUser.username)) {
        throw new Error('ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว');
    }

    const user: User = { ...newUser, id: `local_${Date.now()}` };
    saveLocalUsers([...localUsers, user]);
    return user;
};

// แก้ไขผู้ใช้
export const updateUser = (updatedUser: User): User | null => {
    // ป้องกันการแก้ไข System Users
    if (updatedUser.id.startsWith('sys_')) {
        console.warn("ไม่สามารถแก้ไขผู้ใช้ระบบ (System User) ได้");
        return null;
    }

    let localUsers = getLocalUsers();
    const index = localUsers.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
        localUsers[index] = { ...localUsers[index], ...updatedUser };
        saveLocalUsers(localUsers);
        return localUsers[index];
    }
    return null;
};

// ลบผู้ใช้
export const deleteUser = (userId: string): boolean => {
    // ป้องกันการลบ System Users
    if (userId.startsWith('sys_')) {
        console.warn("ไม่สามารถลบผู้ใช้ระบบ (System User) ได้");
        return false;
    }

    let localUsers = getLocalUsers();
    const initialLength = localUsers.length;
    const newLocalUsers = localUsers.filter(u => u.id !== userId);
    
    if (newLocalUsers.length < initialLength) {
        saveLocalUsers(newLocalUsers);
        return true;
    }
    return false;
};

export const usernameExists = (username: string, excludeUserId?: string): boolean => {
    const users = getUsers();
    return users.some(u => u.username === username && u.id !== excludeUserId);
};

// Legacy support (no operation needed as users are hardcoded)
export const initializeUsers = (): void => {};