
import React from 'react';
import { MemberType } from '../types';

interface DashboardProps {
  stats: {
    total: number;
    complete: number;
    pending: number;
    incomplete: number;
    byType: Record<MemberType, {
        total: number;
        complete: number;
        pending: number;
        incomplete: number;
    }>
  };
}

const StatCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 transition-transform duration-300 hover:scale-105" style={{ borderColor: color }}>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value.toLocaleString()}</p>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="สมาชิกทั้งหมด" value={stats.total} color="#3b82f6" />
          <StatCard title="เอกสารครบ" value={stats.complete} color="#22c55e" />
          <StatCard title="รอตรวจสอบ" value={stats.pending} color="#f59e0b" />
          <StatCard title="เอกสารไม่ครบ" value={stats.incomplete} color="#ef4444" />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-3">
                สถิติแยกตามประเภทสมาชิก
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(stats.byType).map(([type, data]) => {
                    const typedData = data as { total: number; complete: number; pending: number; incomplete: number; };
                    if (typedData.total === 0) return null; // Hide types with no members

                    return (
                        <div key={type} className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col transition-transform duration-300 hover:scale-105">
                            <h4 className="font-semibold text-slate-800 border-b pb-2 mb-2 text-sm min-h-[40px] flex items-center">{type}</h4>
                            <div className="space-y-2 text-sm flex-1">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-slate-600">ทั้งหมด:</span>
                                    <span className="font-bold text-blue-600 text-lg">{typedData.total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-slate-600">ครบถ้วน:</span>
                                    <span className="font-bold text-green-600 text-lg">{typedData.complete.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-slate-600">รอตรวจสอบ:</span>
                                    <span className="font-bold text-amber-600 text-lg">{typedData.pending.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-slate-600">ไม่ครบ:</span>
                                    <span className="font-bold text-red-600 text-lg">{typedData.incomplete.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
