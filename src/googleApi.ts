
import { Member, MemberType } from './types';

// We no longer use GAPI directly. We use fetch to talk to a Google Apps Script Web App.

const sheetNameMap: Record<MemberType, string> = {
    [MemberType.Current]: 'พนักงานปัจจุบัน',
    [MemberType.External]: 'นอกหน่วย', // Still mapping to the old sheet name to preserve data structure if needed, or 'พนักงานนอกหน่วย' if new sheet
    [MemberType.Retired]: 'พนักงานบำนาญ',
    [MemberType.Associate]: 'สมาชิกสมทบ',
};

const getSheetNameForMemberType = (memberType: MemberType): string => {
    return sheetNameMap[memberType];
};

export interface MemberWithRow extends Member {
    rowIndex: number;
    sheetName: string;
}

// Helper to transform Member object to Array for Sheet
const memberToRow = (member: Member): any[] => {
    return [
        member.id,
        member.name,
        member.memberType,
        member.registrationDate,
        JSON.stringify(member.documents),
        member.documentIssuer || '',
        member.auditor || '',
        JSON.stringify(member.documentHistory)
    ];
};

// Helper to transform Array from Sheet to Member object
const rowToMember = (row: any[], index: number, sheetName: string): MemberWithRow | null => {
    try {
        const [id, name, rawMemberType, registrationDate, documentsStr, documentIssuer, auditor, documentHistoryStr] = row;
        
        if (!id || !name || !rawMemberType) return null;

        // Data Migration/Normalization
        let memberType = rawMemberType as MemberType;
        const typeStr = String(rawMemberType).trim();

        if (typeStr.includes('พนักงานปัจจุบัน') || typeStr.includes('เจ้าหน้าที่สหกรณ์')) {
            memberType = MemberType.Current;
        } else if (typeStr === 'นอกหน่วย' || typeStr === 'สมาชิกนอกหน่วย') {
            memberType = MemberType.External;
        } else if (typeStr === 'พนักงานนอกหน่วย') {
            memberType = MemberType.External;
        } else if (typeStr === 'พนักงานบำนาญ') {
             memberType = MemberType.Retired;
        } else if (typeStr === 'สมาชิกสมทบ') {
             memberType = MemberType.Associate;
        }

        // Ensure ID is always 5 digits (e.g., "1" -> "00001")
        const normalizedId = String(id).trim().padStart(5, '0');

        return {
            id: normalizedId,
            name,
            memberType: memberType,
            registrationDate: registrationDate || new Date().toISOString(),
            documents: documentsStr ? JSON.parse(documentsStr) : {},
            documentIssuer: documentIssuer || '',
            auditor: auditor || '',
            documentHistory: documentHistoryStr ? JSON.parse(documentHistoryStr) : [],
            rowIndex: index, // The index returned from the script (usually row number)
            sheetName,
        };
    } catch (e) {
        console.error("Failed to parse row:", row, e);
        return null;
    }
};

// --- API Functions using fetch ---

// Ping the script to check connectivity
export const checkConnection = async (scriptUrl: string): Promise<boolean> => {
    try {
        // Simple read request to verify URL
        const response = await fetch(scriptUrl, {
            method: 'POST',
            mode: 'cors', // Google Apps Script Web Apps support CORS
            body: JSON.stringify({ action: 'READ_ALL' })
        });
        const result = await response.json();
        return result && result.status !== 'error';
    } catch (e) {
        console.error("Connection check failed", e);
        return false;
    }
};

export const loadMembers = async (scriptUrl: string): Promise<MemberWithRow[]> => {
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({ action: 'READ_ALL' })
        });
        
        const result = await response.json();
        
        if (result.status === 'error') {
            throw new Error(result.message);
        }

        const rawMembers: any[] = result.members || [];
        
        return rawMembers
            .map((item: any) => rowToMember(item.rowData, item.rowIndex, item.sheetName))
            .filter((m): m is MemberWithRow => m !== null);

    } catch (e: any) {
        console.error("Load members failed", e);
        throw new Error(`ไม่สามารถโหลดข้อมูลได้: ${e.message}`);
    }
};

export const addMember = async (scriptUrl: string, member: Member): Promise<void> => {
    const sheetName = getSheetNameForMemberType(member.memberType);
    const rowData = memberToRow(member);

    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({ 
                action: 'ADD',
                sheetName,
                rowData
            })
        });
        const result = await response.json();
        if (result.status === 'error') throw new Error(result.message);
    } catch (e: any) {
        throw new Error(`ไม่สามารถเพิ่มสมาชิกได้: ${e.message}`);
    }
};

export const bulkAddMembers = async (scriptUrl: string, members: Member[]): Promise<void> => {
    // Group members by Sheet Name to optimize
    const grouped: Record<string, any[]> = {};
    
    members.forEach(m => {
        const sheetName = getSheetNameForMemberType(m.memberType);
        if (!grouped[sheetName]) grouped[sheetName] = [];
        grouped[sheetName].push(memberToRow(m));
    });

    try {
        // Send requests sequentially for each sheet (or could be parallel, but sequential is safer for locking)
        for (const sheetName of Object.keys(grouped)) {
            const response = await fetch(scriptUrl, {
                method: 'POST',
                mode: 'cors',
                body: JSON.stringify({ 
                    action: 'BULK_ADD',
                    sheetName,
                    rowsData: grouped[sheetName]
                })
            });
            const result = await response.json();
             if (result.status === 'error') throw new Error(result.message);
        }
    } catch (e: any) {
        throw new Error(`การนำเข้าข้อมูลแบบกลุ่มล้มเหลว: ${e.message}`);
    }
};

export const updateMember = async (scriptUrl: string, member: MemberWithRow): Promise<void> => {
    const rowData = memberToRow(member);

    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({ 
                action: 'UPDATE',
                sheetName: member.sheetName,
                rowIndex: member.rowIndex,
                rowData
            })
        });
        const result = await response.json();
        if (result.status === 'error') throw new Error(result.message);
    } catch (e: any) {
         throw new Error(`ไม่สามารถอัปเดตสมาชิกได้: ${e.message}`);
    }
};

export const deleteMember = async (scriptUrl: string, rowIndex: number, sheetName: string): Promise<void> => {
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({ 
                action: 'DELETE',
                sheetName,
                rowIndex
            })
        });
        const result = await response.json();
        if (result.status === 'error') throw new Error(result.message);
    } catch (e: any) {
         throw new Error(`ไม่สามารถลบสมาชิกได้: ${e.message}`);
    }
};

// Re-export for compatibility if needed, though App.tsx will be updated
export const handleSignOut = () => {};
