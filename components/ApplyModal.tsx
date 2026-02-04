'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, User, Phone, Send } from 'lucide-react';

interface ApplyModalProps {
  job: {
    company: string;
    timestamp: string;
    postedTimestamp?: number;
  };
  user: {
    name: string;
    phoneSuffix?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyModal({ job, user, onClose, onSuccess }: ApplyModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        onSuccess();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, onSuccess]);

  /**
   * 核心邏輯：比照 GAS 版本格式化職缺識別碼
   * 將 "2025/12/18 下午 10:23:09" 轉換為 "2025/12/18 22:23:09"
   */
  const formatToGasId = (company: string, rawTimestamp: string) => {
    try {
      const parts = rawTimestamp.split(' ');
      if (parts.length < 3) return `${company} | ${rawTimestamp}`;

      const datePart = parts[0]; // 2025/12/18
      const ampm = parts[1];    // 下午
      const timePart = parts[2]; // 10:23:09

      let [h, m, s] = timePart.split(':').map(Number);
      if (ampm.includes('下午') && h < 12) h += 12;
      if (ampm.includes('上午') && h === 12) h = 0;

      const formattedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      return `${company} | ${datePart} ${formattedTime}`;
    } catch (e) {
      return `${company} | ${rawTimestamp}`;
    }
  };

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    setStatus('idle');
    setErrorMessage('');
    
    try {
      // 構建 GAS 版本的唯一識別碼
      const jobIdentifier = formatToGasId(job.company, job.timestamp);
      const currentPhoneSuffix = user.phoneSuffix || sessionStorage.getItem('phoneSuffix');

      if (!currentPhoneSuffix) {
        throw new Error('驗證資訊遺失，請重新登入');
      }

      const res = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobIdentifier, // 傳送格式如：公司名稱 | 2026/01/25 20:20:49
          seekerName: user.name,
          phoneSuffix: currentPhoneSuffix,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`提交失敗 (${res.status})`);
      }

      const data = await res.json();

      if (data.success) {
        setStatus('success');
      } else {
        throw new Error(data.error || '提交失敗');
      }
    } catch (err: any) {
      console.error('Apply Error:', err);
      setStatus('error');
      setErrorMessage(err.message || '網路連線異常，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        <div className="h-2 bg-blue-600 w-full" />
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
          <X size={20} />
        </button>

        <div className="p-8">
          {status === 'success' ? (
            <div className="py-12 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 text-green-500 rounded-full mb-2">
                <CheckCircle2 size={48} className="animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">應徵意願已送出！</h3>
              <p className="text-slate-500 font-medium px-4">心成管理員將盡速為您媒合，請保持電話暢通。</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <span className="text-blue-600 font-black text-xs uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg">確認應徵資訊</span>
                <h3 className="text-2xl font-black text-slate-900 mt-3 line-clamp-1">{job.company}</h3>
                <p className="text-slate-400 text-sm font-bold mt-1">發布於 {job.timestamp?.split(' ')[0]}</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600"><User size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">應徵姓名</p>
                    <p className="font-black text-slate-800">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600"><Phone size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">手機末三碼</p>
                    <p className="font-black text-slate-800">{user.phoneSuffix || sessionStorage.getItem('phoneSuffix') || '未設定'}</p>
                  </div>
                </div>
              </div>

              {status === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm font-bold">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button onClick={onClose} className="py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all border border-slate-100">取消返回</button>
                <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:bg-slate-300 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={20} className="animate-spin" />傳送中...</> : <><Send size={18} />確認送出</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}