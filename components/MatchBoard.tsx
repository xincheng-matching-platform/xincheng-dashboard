'use client';

import { useMemo } from 'react';
import { PartyPopper, CalendarDays } from 'lucide-react';

interface MatchBoardProps {
  matches: any[];
}

export default function MatchBoard({ matches }: MatchBoardProps) {
  // 篩選邏輯：僅顯示過去兩週（14天）內的媒合成功資訊
  const recentMatches = useMemo(() => {
    if (!matches) return [];
    
    const now = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    return matches
      .map((match) => {
        let matchTime: number;

        // 1. 優先判斷是否為純數字或數字字串（Unix Timestamp）
        const rawTime = match.timestamp;
        if (rawTime && !isNaN(Number(rawTime))) {
          matchTime = Number(rawTime);
        } else {
          // 2. 處理日期格式相容性（將中文時間標記轉換為標準格式）
          // 修正：將 AM/PM 放至時間末尾，並處理連字號以提高 new Date() 成功率
          const rawDateStr = String(match.date || match.timestamp || "");
          const isPM = rawDateStr.includes('下午');
          const isAM = rawDateStr.includes('上午');
          
          let dateStr = rawDateStr
            .replace('上午', '')
            .replace('下午', '')
            .trim()
            .replace(/\//g, '-');
          
          if (isPM) dateStr += ' PM';
          if (isAM) dateStr += ' AM';
          
          const parsedDate = new Date(dateStr);
          matchTime = parsedDate.getTime();
        }

        const diff = now - matchTime;

        return {
          ...match,
          matchTime,
          // 如果解析失敗 (NaN)，或日期不合理，則不顯示
          isRecent: !isNaN(matchTime) && matchTime > 0 && diff >= 0 && diff < fourteenDaysMs
        };
      })
      .filter(match => match.isRecent)
      .sort((a, b) => b.matchTime - a.matchTime); // 最新的排在前面
  }, [matches]);

  if (recentMatches.length === 0) return null;

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center mb-4 px-1">
        <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
          🎉 媒合成功資訊 <PartyPopper size={12} className="text-orange-400" />
        </h2>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
        {recentMatches.map((match, i) => (
          <div 
            key={`match-${match.company}-${match.matchTime}-${i}`}
            className="flex-shrink-0 w-72 p-6 bg-white border-2 border-green-50 rounded-[2.5rem] shadow-sm snap-start relative overflow-hidden hover:shadow-md transition-all group"
          >
            {/* 背景裝飾 */}
            <div className="absolute -right-4 -bottom-4 text-green-50 opacity-10 group-hover:scale-110 transition-transform">
              <PartyPopper size={100} />
            </div>

            <div className="text-green-600 font-black text-sm truncate mb-1">
              {match.company}
            </div>
            <div className="text-gray-400 text-[10px] font-bold mb-4 italic flex items-center gap-1">
              成功完成人才媒合！
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-green-50 relative z-10">
              <div className="text-slate-900 font-black text-xs flex items-center gap-1">
                <span className="text-green-500 text-lg">🎉</span> {match.seeker}
              </div>
              <div className="text-[9px] text-gray-400 font-bold bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 flex items-center gap-1">
                <CalendarDays size={10} /> 
                {isNaN(match.matchTime) ? '-' : new Date(match.matchTime).toLocaleDateString('zh-TW')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}