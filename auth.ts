
import { User, UserRole } from './types';

const USERS_STORAGE_KEY = 'document_checker_users';

// Initialize with default users if none exist in localStorage
const initializeUsers = (): void => {
    if (!localStorage.getItem(USERS_STORAGE_KEY)) {
        const defaultUsers: User[] = [
            { id: '1', username: 'admin', password: 'admin', role: UserRole.Admin },
            { id: '2', username: 'reviewer1', password: '123', role: UserRole.Reviewer },
            { id: '3', username: 'reviewer2', password: '123', role: UserRole.Reviewer },
        ];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    }
};

initializeUsers();

export const getUsers = (): User[] => {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
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
