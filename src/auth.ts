import { User, UserRole } from './types';

const USERS_STORAGE_KEY = 'document_checker_users';

// Define default users constant for reuse and restoration
const DEFAULT_USERS: User[] = [
    { id: '1', username: 'admin', password: 'admin', role: UserRole.Admin },
    { id: '2', username: 'reviewer', password: '123', role: UserRole.Reviewer },
    { id: '3', username: 'staff', password: '123', role: UserRole.Reviewer },
];

// Initialize with default users if none exist in localStorage
export const initializeUsers = (): void => {
    const existing = localStorage.getItem(USERS_STORAGE_KEY);
    if (!existing || JSON.parse(existing).length === 0) {
        console.log("System: Initializing default users...");
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    }
};

// Function to force reset users to default (useful for admin to recover system)
export const resetToDefaultUsers = (): void => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
};

// Auto-run initialization when this module is loaded
initializeUsers();

export const getUsers = (): User[] => {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    // Double check if empty, if so re-initialize immediately
    if (!usersJson) {
        initializeUsers();
        return DEFAULT_USERS;
    }
    return JSON.parse(usersJson);
};

const saveUsers = (users: User[]): void => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const login = (username: string, password: string):User | null => {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        // Don't store password in session
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

export const addUser = (newUser: Omit<User, 'id'>): User => {
    const users = getUsers();
    const user: User = { ...newUser, id: String(Date.now()) };
    saveUsers([...users, user]);
    return user;
};

export const updateUser = (updatedUser: User): User | null => {
    let users = getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
        users[index] = { ...users[index], ...updatedUser };
        saveUsers(users);
        return users[index];
    }
    return null;
};

export const deleteUser = (userId: string): boolean => {
    let users = getUsers();
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);
    if (users.length < initialLength) {
        saveUsers(users);
        return true;
    }
    return false;
};

export const usernameExists = (username: string, excludeUserId?: string): boolean => {
    const users = getUsers();
    return users.some(u => u.username === username && u.id !== excludeUserId);
};
