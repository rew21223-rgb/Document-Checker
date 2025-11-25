
export enum MemberType {
  Current = 'พนักงานปัจจุบัน',
  External = 'พนักงานนอกหน่วย',
  Retired = 'พนักงานบำนาญ',
  Associate = 'สมาชิกสมทบ',
}

export enum FilterStatus {
  All = 'ทั้งหมด',
  Complete = 'เอกสารครบ',
  Incomplete = 'เอกสารไม่ครบ',
}

export interface DocumentHistoryLog {
  timestamp: string; // ISO date string
  auditor: string;
  changes: {
    document: string;
    from: boolean;
    to: boolean;
  }[];
}

export interface Member {
  id: string;
  name: string;
  memberType: MemberType;
  registrationDate: string; // ISO date string
  documents: Record<string, boolean>;
  documentIssuer?: string;
  auditor?: string;
  documentHistory: DocumentHistoryLog[];
}

export enum UserRole {
    Admin = 'Admin',
    Reviewer = 'Reviewer',
}

export interface User {
    id: string;
    username: string;
    password?: string; // Optional for security when sending to client
    role: UserRole;
}

export interface AppNotification {
    id: string;
    type: 'success' | 'warning' | 'info' | 'error';
    message: string;
    timestamp: string;
    isRead: boolean;
}

export interface AppConfig {
    scriptUrl: string;
}
