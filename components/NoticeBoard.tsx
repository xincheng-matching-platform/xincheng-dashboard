'use client';

import { useMemo } from 'react';
import { Flame, Clock } from 'lucide-react';

export default function NoticeBoard({ jobs, onQuickSearch }) {
  const displayJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];
    
    const now = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    // 1. 預處理所有職缺的日期解析
    const processed = jobs.map(job => {
      let postTime = job.postedTimestamp;
      
      // 使用強化版解析邏輯，確保處理 Google Sheets 的中文日期格式 (下午/上午)
      if (!postTime && job.timestamp) {
        const dateStr = String(job.timestamp);
        const dateMatch = dateStr.match(/(\d{4}\/\d{1,2}\/\d{1,2})/);
        const timeMatch = dateStr.match(/(\d{1,2}:\d{1,2}:\d{1,2})/);
        
        if (dateMatch && timeMatch) {
          let [year, month, day] = dateMatch[1].split('/').map(Number);
          let [hour, minute, second] = timeMatch[1].split(':').map(Number);
          
          // 處理 12 小時制轉換
          if (dateStr.includes('下午') && hour < 12) hour += 12;
          if (dateStr.includes('上午') && hour === 12) hour = 0;
          
          // 注意：JavaScript Date 的月份是 0 索引，所以 month - 1
          const d = new Date(year, month - 1, day, hour, minute, second);
          postTime = d.getTime();
        }
      }
      return { ...job, postTime: postTime || 0 };
    });

    // 2. 篩選 14 天內的職缺
    let result = processed.filter(job => {
      const diff = now - job.postTime;
      // 必須非未來時間且在 14 天內
      return job.postTime > 0 && diff >= 0 && diff < fourteenDaysMs;
    });

    // 3. 排序邏輯：不論是近期職缺還是最舊職缺，都確保最新的排在最左邊 (由新到舊)
    if (result.length === 0) {
      // 如果 14 天內沒有新職缺，顯示資料庫中最新發布的前 5 筆
      result = [...processed]
        .sort((a, b) => b.postTime - a.postTime)
        .slice(0, 5);
    } else {
      // 針對近期職缺也要明確排序，避免 API 回傳順序不一
      result.sort((a, b) => b.postTime - a.postTime);
    }

    // 4. 加上視覺標籤與格式化數據
    return result.map(job => {
      const diff = now - job.postTime;
      return {
        ...job,
        isNew: job.postTime > 0 && diff >= 0 && diff < threeDaysMs,
        displayApplyCount: Number(job.applyCount || 0)
      };
    });
  }, [jobs]);

  if (displayJobs.length === 0) return null;

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center mb-4 px-1">
        <span className="flex h-2 w-2 rounded-full bg-red-500 mr-2"></span>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
          最新職缺公告 <Clock size={12} className="text-blue-400" />
        </h2>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
        {displayJobs.map((job, i) => (
          <div
            key={`notice-${job.company}-${job.postTime}-${i}`}
            onClick={() => onQuickSearch(job.company)}
            className="flex-shrink-0 w-72 p-6 bg-white border-2 border-blue-50 rounded-[2.5rem] cursor-pointer hover:shadow-md transition-all shadow-sm relative overflow-hidden group snap-start"
          >
            {/* NEW 標籤：3 天內發布的顯眼標示 */}
            {job.isNew && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] px-4 py-1.5 font-black rounded-bl-3xl animate-pulse z-20">
                NEW
              </span>
            )}
            
            <div className="text-blue-600 font-black text-base truncate mb-1 pr-8">
              {job.company}
            </div>
            
            <div className="flex items-center gap-1 text-orange-500 text-[11px] font-black mb-4">
              <Flame size={12} className={job.displayApplyCount > 0 ? "animate-bounce" : ""} /> 
              應徵熱度：{job.displayApplyCount} 人
            </div>
            
            <div className="mt-2 flex justify-end">
              <span className="text-[10px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full font-bold border border-gray-100">
                {job.postTime > 0 ? new Date(job.postTime).toLocaleDateString('zh-TW') : '-'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}