'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import LoginScreen from '@/components/LoginScreen';
import JobCard from '@/components/JobCard';
import MatchBoard from '@/components/MatchBoard';
import NoticeBoard from '@/components/NoticeBoard';
import ApplyModal from '@/components/ApplyModal';
import { 
  Loader2, Search, Filter, RotateCcw, X, Phone, MessageCircle, 
  Info, Flame, ArrowUpDown, ChevronUp, ChevronDown, Copy, Check, Building2, User as UserIcon, Map as MapIcon
} from 'lucide-react';

interface Job {
  company: string;
  system: string;
  timestamp: string;      
  postedTimestamp?: number; 
  content: string;
  location: string;
  jobType?: string;
  applyCount: number;
  timeSlots?: string; 
  expiry?: string;    
  owner?: string;
  person?: string;
  phone?: string;
  lineId?: string;
  lineName?: string;
  remark?: string;
  coords?: { lat: number; lng: number } | null;
}

const JobMap = dynamic(() => import('@/components/JobMap').then(mod => mod.default), { 
  ssr: false,
  loading: () => <div className="h-[250px] md:h-[400px] w-full bg-gray-100 animate-pulse rounded-[2.5rem]" />
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [filters, setFilters] = useState({ system: '', keyword: '' });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [contactJob, setContactJob] = useState<Job | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  
  const [tooltip, setTooltip] = useState<{ content: string; visible: boolean; x: number; y: number }>({ content: '', visible: false, x: 0, y: 0 });
  const [mapTooltip, setMapTooltip] = useState<{ location: string; visible: boolean; x: number; y: number }>({ location: '', visible: false, x: 0, y: 0 });
  
  // 初始排序設定：依照刊登時間由新到舊 (desc)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Job; direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });

  const { data, isLoading, mutate } = useSWR('/api/jobs', fetcher, { refreshInterval: 60000 });

  useEffect(() => {
    const savedUser = sessionStorage.getItem('jobUser');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  /**
   * 強化日期解析函式 (專治 Google Sheets 中文格式)
   * 格式範例: "2026/2/3 下午 10:38:21"
   */
  const getSafeTime = (job: Job) => {
    if (job.postedTimestamp && job.postedTimestamp > 0) return job.postedTimestamp;
    
    try {
      const raw = String(job.timestamp || "");
      if (!raw) return 0;

      const parts = raw.split(' ');
      const dateStr = parts[0].replace(/\//g, '-'); 
      const ampm = parts[1] || "";
      const timeStr = parts[2] || "00:00:00";

      const timeParts = timeStr.split(':');
      let h = parseInt(timeParts[0] || "0");
      const m = parseInt(timeParts[1] || "0");
      const s = parseInt(timeParts[2] || "0");

      if (ampm.includes('下午') && h < 12) h += 12;
      if (ampm.includes('上午') && h === 12) h = 0;

      const dateSegments = dateStr.split('-');
      const year = parseInt(dateSegments[0]);
      const month = parseInt(dateSegments[1]) - 1; 
      const day = parseInt(dateSegments[2]);

      const d = new Date(year, month, day, h, m, s);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    } catch (e) {
      return 0;
    }
  };

  /**
   * 排序請求處理
   */
  const requestSort = (key: keyof Job) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  /**
   * 核心篩選與排序邏輯
   * 修正點：自動補上「體系」後綴，確保篩選與顯示一致
   */
  const filteredJobs = useMemo(() => {
    if (!data?.jobs) return [];
    
    // 先進行資料標準化：自動補上體系後綴
    let jobs = (data.jobs as Job[]).map(job => {
      const sysName = String(job.system || "").trim();
      const fixedSystem = sysName && !sysName.endsWith('體系') ? `${sysName}體系` : sysName;
      return { ...job, system: fixedSystem };
    }).filter((job) => {
      const matchSystem = !filters.system || job.system === filters.system;
      const matchKeyword = !filters.keyword || 
        (job.company + job.content + (job.location || '')).toLowerCase().includes(filters.keyword.toLowerCase());
      return matchSystem && matchKeyword;
    });

    // 執行排序
    jobs.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortConfig.key === 'timestamp' || sortConfig.key === 'postedTimestamp') {
        valA = getSafeTime(a);
        valB = getSafeTime(b);
      } else {
        valA = String((a as any)[sortConfig.key] || "").toLowerCase();
        valB = String((b as any)[sortConfig.key] || "").toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return jobs;
  }, [data?.jobs, filters, sortConfig]);

  /**
   * 篩選器中的體系清單
   * 修正點：下拉選單也自動補上「體系」後綴
   */
  const systems = useMemo(() => {
    if (!data?.jobs) return [];
    const sysSet = new Set((data.jobs as Job[]).map(j => {
      const s = String(j.system || "").trim();
      return (s && !s.endsWith('體系')) ? `${s}體系` : s;
    }));
    return Array.from(sysSet).filter(Boolean).sort() as string[];
  }, [data?.jobs]);

  const handleCopy = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopySuccess(text);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const getSortIcon = (key: keyof Job) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="ml-1 opacity-20 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="ml-1 text-blue-600" /> : <ChevronDown size={12} className="ml-1 text-blue-600" />;
  };

  if (!user) return <LoginScreen onLoginSuccess={setUser} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 font-sans text-slate-900">
      <Header user={user} onLogout={() => { sessionStorage.clear(); setUser(null); }} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-blue-600 font-black">正在同步職缺資料...</p>
          </div>
        ) : (
          <>
            <div className="space-y-8 mb-10">
              {data?.matches && <MatchBoard matches={data.matches} />}
              {data?.jobs && <NoticeBoard jobs={data.jobs} onQuickSearch={(c: string) => setFilters({...filters, keyword: c})} />}
            </div>

            <div className="mb-10 shadow-2xl rounded-[2.5rem] overflow-hidden border-4 border-white"><JobMap jobs={filteredJobs} /></div>

            {/* 篩選區塊 */}
            <section className="bg-white p-6 rounded-[2.5rem] shadow-sm mb-8 grid grid-cols-1 md:grid-cols-12 gap-4 border border-blue-50">
              <div className="relative md:col-span-6">
                <Search className="absolute left-4 top-3.5 text-blue-400" size={18} />
                <input type="text" placeholder="搜尋職缺..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 ring-blue-500 font-medium text-sm" value={filters.keyword} onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))} />
              </div>
              <div className="relative md:col-span-4">
                <Filter className="absolute left-4 top-3.5 text-blue-400" size={18} />
                <select className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 ring-blue-500 appearance-none font-medium text-gray-600 text-sm" value={filters.system} onChange={(e) => setFilters(prev => ({ ...prev, system: e.target.value }))}>
                  <option value="">所有體系</option>
                  {systems.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={() => setFilters({ system: '', keyword: '' })} className="md:col-span-2 flex items-center justify-center gap-2 text-gray-400 font-black hover:text-blue-600 bg-gray-100 rounded-2xl py-4 transition-all text-xs"><RotateCcw size={14} /> 重設</button>
            </section>

            <h2 className="text-2xl font-black text-gray-900 mb-8 px-2 tracking-tight">可投遞職缺</h2>

            {/* 桌機表格 */}
            <div className="hidden md:block bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 mb-10 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th onClick={() => requestSort('timestamp')} className="p-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer group transition-colors hover:text-blue-600">
                      <div className="flex items-center">刊登日期 {getSortIcon('timestamp')}</div>
                    </th>
                    <th onClick={() => requestSort('system')} className="p-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer group transition-colors hover:text-blue-600">
                      <div className="flex items-center">體系 {getSortIcon('system')}</div>
                    </th>
                    <th onClick={() => requestSort('company')} className="p-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer group transition-colors hover:text-blue-600">
                      <div className="flex items-center">公司名稱 {getSortIcon('company')}</div>
                    </th>
                    <th onClick={() => requestSort('jobType')} className="p-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer group transition-colors hover:text-blue-600">
                      <div className="flex items-center">職別 {getSortIcon('jobType')}</div>
                    </th>
                    <th className="p-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">摘要</th>
                    <th className="p-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">時段</th>
                    <th onClick={() => requestSort('expiry')} className="p-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer group transition-colors hover:text-blue-600">
                      <div className="flex items-center">刊登期限 {getSortIcon('expiry')}</div>
                    </th>
                    <th onClick={() => requestSort('location')} className="p-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer group transition-colors hover:text-blue-600">
                      <div className="flex items-center">地點 {getSortIcon('location')}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {filteredJobs.map((job, i) => (
                    <tr key={i} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="p-5 font-mono text-gray-400">{job.timestamp.split(' ')[0]}</td>
                      <td className="p-5 font-black text-slate-800"><div className="w-4 break-words leading-tight">{job.system}</div></td>
                      <td className="p-5"><button onClick={() => setContactJob(job)} className="font-black text-blue-600 hover:underline text-left leading-snug">{job.company}</button></td>
                      <td className="p-5 font-bold text-slate-600">{job.jobType}</td>
                      <td 
                        className="p-5 min-w-[280px] cursor-help" 
                        onMouseEnter={(e) => setTooltip({content: job.content, visible: true, x: e.clientX+15, y: e.clientY+15})} 
                        onMouseMove={(e) => setTooltip(p => ({...p, x: e.clientX+15, y: e.clientY+15}))} 
                        onMouseLeave={() => setTooltip(p => ({...p, visible: false}))}
                      >
                        <div className="flex flex-col gap-2"><p className="text-xs text-gray-500 line-clamp-2">{job.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1 text-orange-500 font-black text-[10px]"><Flame size={12} className={job.applyCount > 0 ? "animate-pulse" : ""} />應徵 : {job.applyCount}</div>
                            <button onClick={() => setSelectedJob(job)} className="bg-blue-600 text-white px-4 py-1.5 rounded-xl font-black text-[10px] shadow-md shadow-blue-100 active:scale-95 transition-transform">我要應徵</button>
                          </div>
                        </div>
                      </td>
                      
                      <td 
                        className="p-5 text-xs text-slate-400 font-medium cursor-help max-w-[180px]"
                        onMouseEnter={(e) => job.timeSlots && setTooltip({content: job.timeSlots, visible: true, x: e.clientX+15, y: e.clientY+15})} 
                        onMouseMove={(e) => setTooltip(p => ({...p, x: e.clientX+15, y: e.clientY+15}))} 
                        onMouseLeave={() => setTooltip(p => ({...p, visible: false}))}
                      >
                        <div className="truncate">{job.timeSlots || '-'}</div>
                      </td>

                      <td className="p-5 text-xs font-mono text-gray-400 whitespace-nowrap">{job.expiry || '-'}</td>
                      <td 
                        className="p-5 cursor-pointer group"
                        onMouseEnter={(e) => setMapTooltip({location: job.location, visible: true, x: e.clientX+15, y: e.clientY+15})}
                        onMouseMove={(e) => setMapTooltip(p => ({...p, x: e.clientX+15, y: e.clientY+15}))}
                        onMouseLeave={() => setMapTooltip(p => ({...p, visible: false}))}
                        onClick={() => setContactJob(job)}
                      >
                        <button className="text-blue-500 text-xs font-bold hover:underline flex items-center gap-1">
                          <MapIcon size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          {job.location?.split(' ')[0]}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-6">
              {filteredJobs.map((job, i) => (
                <JobCard key={i} job={job} onApply={() => setSelectedJob(job)} onShowContact={() => setContactJob(job)} />
              ))}
            </div>
          </>
        )}
      </main>

      {selectedJob && <ApplyModal job={selectedJob} user={user} onClose={() => setSelectedJob(null)} onSuccess={() => { mutate(); setSelectedJob(null); }} />}

      <div className={`fixed inset-0 z-[150] transition-opacity duration-300 ${contactJob ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setContactJob(null)} />
        <div className={`absolute top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl transition-transform duration-500 transform ${contactJob ? 'translate-x-0' : 'translate-x-full'}`}>
          {contactJob && (
            <div className="flex flex-col h-full">
              <div className="p-8 bg-blue-600 text-white relative">
                <button onClick={() => setContactJob(null)} className="absolute top-6 right-6 p-2 bg-white/20 rounded-full hover:bg-white/30 text-white"><X size={20} /></button>
                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">企業聯絡資訊</p>
                <h3 className="text-2xl font-black text-white leading-tight">{contactJob.company}</h3>
                <p className="text-sm font-bold opacity-80 mt-2">{contactJob.system}</p>
              </div>
              <div className="flex-grow p-8 overflow-y-auto space-y-6 bg-gray-50">
                <div className="p-6 bg-yellow-50 rounded-[2rem] border-l-8 border-yellow-400 shadow-sm relative">
                  <div className="absolute -left-3 top-6 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-white"><Info size={12} /></div>
                  <p className="text-[10px] font-black text-yellow-600 uppercase mb-2 ml-2 tracking-widest text-xs">💡 備註 / 工作內容</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium ml-2">{contactJob.remark || contactJob.content}</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: '企業主', value: contactJob.owner, icon: <Building2 size={20} />, color: 'blue' },
                    { label: '窗口人員', value: contactJob.person, icon: <UserIcon size={20} />, color: 'blue' },
                    { label: '電話', value: contactJob.phone, icon: <Phone size={20} />, color: 'green', isPhone: true },
                    { label: 'LINE ID', value: contactJob.lineId, icon: <MessageCircle size={20} />, color: 'blue' },
                    { label: 'LINE 名稱', value: contactJob.lineName, icon: <MessageCircle size={20} />, color: 'blue' },
                    { label: '工作地點', value: contactJob.location, icon: <MapIcon size={20} />, color: 'slate' }
                  ].map((item, idx) => item.value && (
                    <div key={idx} onClick={() => handleCopy(item.value!)} className="p-5 bg-white rounded-2xl border-2 border-gray-100 flex items-center justify-between cursor-pointer group active:border-blue-300 transition-all hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-${item.color}-50 rounded-xl flex items-center justify-center text-${item.color}-600`}>{item.icon}</div>
                        <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{item.label}</p><p className="font-black text-gray-900 leading-tight">{item.value}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.isPhone && <button onClick={(e) => {e.stopPropagation(); window.location.assign(`tel:${item.value}`);}} className="bg-green-500 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg shadow-green-100 active:scale-95 transition-all">撥打</button>}
                        {copySuccess === item.value ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-300 group-hover:text-blue-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-8 bg-white border-t border-gray-100"><button onClick={() => { const j = contactJob; setContactJob(null); setSelectedJob(j); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all">前往應徵該職缺</button></div>
            </div>
          )}
        </div>
      </div>

      {tooltip.visible && (
        <div 
          className="fixed z-[9999] pointer-events-none bg-slate-900/95 backdrop-blur-md text-white p-6 rounded-2xl shadow-2xl max-w-sm border border-slate-700/50 animate-in fade-in zoom-in-95 duration-150" 
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{tooltip.content}</p>
        </div>
      )}

      {mapTooltip.visible && (
        <div 
          className="fixed z-[9999] pointer-events-none bg-white p-1 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ left: mapTooltip.x, top: mapTooltip.y, width: '320px', height: '240px' }}
        >
          <iframe 
            width="100%" height="100%" frameBorder="0" style={{ border: 0 }}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapTooltip.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
          />
          <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
             <p className="text-[10px] font-black text-gray-800 truncate">📍 {mapTooltip.location}</p>
          </div>
        </div>
      )}
    </div>
  );
}