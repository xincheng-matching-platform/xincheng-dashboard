import { MapPin, Briefcase, ExternalLink, Flame, Info } from 'lucide-react';
import { useMemo } from 'react';

export default function JobCard({ job, onApply, onShowContact }) {
  const applyCount = useMemo(() => {
    return Number(job.applyCount || 0);
  }, [job.applyCount]);

  const isNew = useMemo(() => {
    if (!job.postedTimestamp) return false;
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    return (Date.now() - job.postedTimestamp) < threeDaysMs;
  }, [job.postedTimestamp]);

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-lg border border-gray-50 transition-all active:scale-[0.98] relative overflow-hidden flex flex-col h-full">
      {isNew && (
        <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] px-4 py-1.5 font-black rounded-bl-3xl animate-pulse z-10">
          NEW
        </div>
      )}

      <div className="mb-4">
        <h3 className="font-black text-xl text-gray-900 leading-tight mb-1 pr-10" onClick={onShowContact}>
          {job.company}
        </h3>
        <p className="text-xs text-blue-500 font-bold">{job.system}</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 text-gray-500 text-[11px] font-bold">
        <div className="flex items-center">
          <MapPin size={14} className="mr-1 text-gray-400" /> {job.location || '地點請洽詢'}
        </div>
        <div className={`flex items-center ${applyCount > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
          <Flame size={14} className={`mr-1 ${applyCount > 0 ? 'animate-bounce' : ''}`} /> {applyCount} 人應徵
        </div>
      </div>

      <div className="bg-gray-50 p-5 rounded-3xl mb-6 flex-grow border border-gray-100/50">
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
          {job.content}
        </p>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={onShowContact}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-4 rounded-2xl font-black text-xs transition-colors flex items-center justify-center gap-2"
        >
          <Info size={16} /> 詳情
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onApply(); }}
          className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
        >
          <ExternalLink size={16} /> 我要應徵
        </button>
      </div>
    </div>
  );
}