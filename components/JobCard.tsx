'use client';

import { useMemo } from 'react';
import { Building2, MapPin, Clock, Flame, Send, Info } from 'lucide-react';

// 定義職缺資料介面
interface Job {
  company: string;
  system: string;
  timestamp: string;
  content: string;
  location: string;
  jobType?: string;
  applyCount: number;
}

// 定義組件參數介面
interface JobCardProps {
  job: Job;
  onApply: () => void;
  onShowContact: () => void;
}

export default function JobCard({ job, onApply, onShowContact }: JobCardProps) {
  const applyCount = useMemo(() => {
    return Number(job.applyCount || 0);
  }, [job.applyCount]);

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border-2 border-transparent hover:border-blue-100 transition-all group relative overflow-hidden">
      {/* 頂部裝飾：體系標籤 */}
      <div className="flex justify-between items-start mb-4">
        <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
          {job.system}
        </span>
        <div className="flex items-center gap-1 text-gray-400 font-mono text-[10px]">
          <Clock size={12} />
          {job.timestamp?.split(' ')[0]}
        </div>
      </div>

      {/* 公司與職別 */}
      <div className="mb-4">
        <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {job.company}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">
            {job.jobType || '兼職'}
          </span>
          <div className="flex items-center gap-1 text-orange-500 font-black text-[10px]">
            <Flame size={12} className={applyCount > 0 ? "animate-pulse" : ""} />
            應徵熱度：{applyCount}
          </div>
        </div>
      </div>

      {/* 工作內容簡述 */}
      <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed mb-6 font-medium italic">
        "{job.content}"
      </p>

      {/* 地點 */}
      <div className="flex items-center gap-2 mb-6 text-slate-400">
        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
          <MapPin size={16} />
        </div>
        <span className="text-xs font-bold truncate">{job.location}</span>
      </div>

      {/* 按鈕組 */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onShowContact}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-xs text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100"
        >
          <Info size={16} />
          詳細資訊
        </button>
        <button 
          onClick={onApply}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95 transition-all"
        >
          <Send size={16} />
          我要應徵
        </button>
      </div>
    </div>
  );
}