
import { MemberType } from './types';

export interface DocumentSpec {
    name: string;
    important: boolean;
}

export const DEFAULT_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQ4AAADgCAMAAACjM2kKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkIxMjU2NEIyNkM2OTExRUI4OTBBRkEyRkI5NkVENkJGIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkIxMjU2NEIzNkM2OTExRUI4OTBBRkEyRkI5NkVENkJGIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QjEyNTY0QjA2QzY5MTFFQjg5MEFGQTJGQjk2RUQ2QkYiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QjEyNTY0QjE2QzY5MTFFQjg5MEFGQTJGQjk2RUQ2QkYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6vjPwuAAABM1BMVEVHcEz///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8aT79bAAAAZ3RSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyEiJCUnKiwtLi8xMjM1ODk6Ozw9PkBBQkNERUZISUpMTU5PUFFSU1VYWVpbXF1eX2FiY2RlZmdoaWprbG1ucHFzdHV2d3h5ent8fn+Ag4SGh4iJiouMjY6PkJGSlJWWl5iZmpucnZ6foKGio6Slpqeoqaqys7S1tre4ubq7vL2+v8DBwsPExcbHyMnK0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+rnWGyAAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfiBhwUADl4/w3sAAADPUlEQVRo3u3b63bbRhCGIUgQIgYxJjaJm0m2SWKbDE1icGzTpgGb1ul0ul6z13W95/f9AQUFJSF05h8iH/jXjS+eLhS+FkX5v20wM5YxJ24lB+8n+VvF7zI75Kz+a7BwG+2gR0Kz2V2wM/Wf9T+t+G1I8L1A0FhC9/J18q+I3+V2wU7W/9S+r3z/QeD/B8FjC92xXfK/iN/ldsdO1v/Uvr/D9x8EHj8IHiV3R3bF/yJ+l9sldsdO1v/Uvr/D9x8E/vsgeJjdHVvzP8l/iN/ldsdO1v/Uvr/D9z/IPCHB8Gj6e7Yl/Nf4jf5XbFTtL81f8f3HwQ+9iB4mdwdW/M/y3+I3+V2xU7S/tT8Hd9/EPhzB8HT6e7Yl/Nfx++S/E7Yqdpfmp/j+w8Cf3wQPErujqz5n+U/xO+S/E7Yqdpfmp/j+w8C//9B8Ch8u2J/nf8Vv8vtiq2k/Vnzu77/INB/g+B5dndszf8s/yF+l9sVW0n7s+Z3ff9B4A8PgsfD3bEt+V/F75L8Ttip2l+an+P7DwL/fRA8Su6OrPm/7O8TtkvtirWt/Zz5Wd9/EOifg+DzdHdsv8J/iN/ldkVa1/7O/KzvPwjwPweBxxO6l/9F/I7YKbQ17W/Lz/reQ6D/AQieq9S+k/klfhfaGva35ef97iHQPwgCjya176T+Cv8ttDXtb8vPe9xDoH8QBJ7L1L6T+SX+F9oa9rfk7/jcg6B/HASen9S+k/kl/hfaGva35O/43IOgfxwETk9q30n9Ff4baGvS35K/EzkH+kdD8LyJ9p3ML/K7QlrT/lT8TuQe6B8PgdfntO9kfpXfBbQ17U/F7ybuQf6xETyv0b6T+VX+LaCtaX8qfo9xD/TPQ+D1Te07mV/l3wLaWlan4vcQ90D/PAReX9S+k/lV/i2grWl9Kn6P4R7o/xkInlWofSfzK/wbotpaWpen4vfM/0T/Kwi8pVH7TuaX+G2i2lpanqbj+L3OfyL6B0PwmkfLfpD5Jb5dVG+l5Zl/yO/n/IuofwAET23p25H+D9kXF0P/Af8H1J+I/gHw8fH/g3eXf3n3z/t3A35H0L/D+v8t/1HlR5381/sPq5zT8X8+5/mP0+1H/b9O8z9W/P//v6Tyn/+5H92/S89/mHlI1v/s/t3Wn5z9/8l/qP691p+c/T/J/5D+Pdafmf0/yf8A/1P/fQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgH8BHgAEAGl0Wd5pX6tXAAAAAElFTkSuQmCC';

// Lists all possible documents for each member type
export const ORDINARY_MEMBER_DOCS: DocumentSpec[] = [
    { name: 'สำเนาบัตรประชาชนผู้สมัคร', important: true },
    { name: 'สำเนาทะเบียนบ้านผู้สมัคร', important: true },
    { name: 'สำเนาหน้า Book กรุงไทยผู้สมัคร', important: true },
    { name: 'สำเนาบัตรประชาชนผู้รับผลประโยชน์ หรือ สูติบัตร', important: true },
    { name: 'สำเนาทะเบียนสมรส', important: false },
    { name: 'สำเนาใบเปลี่ยนแปลงชื่อ-สกุล', important: false }
];

export const ASSOCIATE_MEMBER_DOCS: DocumentSpec[] = [
    { name: 'สำเนาบัตรประชาชนผู้สมัคร', important: true },
    { name: 'สำเนาบัตรประชาชนสมาชิกหลัก', important: true },
    { name: 'สำเนาทะเบียนบ้านผู้สมัคร', important: true },
    { name: 'สำเนาทะเบียนบ้านสมาชิกหลัก', important: true },
    { name: 'สำเนาหน้า Book กรุงไทยผู้สมัคร', important: true },
    { name: 'สำเนาบัตรประชาชนผู้รับผลประโยชน์ หรือ สูติบัตร', important: true },
    { name: 'สำเนาทะเบียนสมรส', important: false },
    { name: 'สำเนาใบเปลี่ยนแปลงชื่อ-สกุล', important: false }
];

/**
 * Returns the full list of document specifications for each member type (including optional ones).
 * Used for checklists and progress tracking.
 */
export const getRequiredDocuments = (memberType: MemberType): DocumentSpec[] => {
    // Ordinary Members (Current, Retired, External) share the same document list
    // Associate Members have a specific list
    return memberType === MemberType.Associate ? ASSOCIATE_MEMBER_DOCS : ORDINARY_MEMBER_DOCS;
};

/**
 * Returns only the essential (important) documents required for a member's status to be "complete".
 * Used for validation and status checks.
 */
export const getCoreRequiredDocuments = (memberType: MemberType): DocumentSpec[] => {
    const allDocs = getRequiredDocuments(memberType);
    return allDocs.filter(doc => doc.important);
}