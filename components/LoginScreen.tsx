'use client';
import { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: (data: { name: string; type: string; phoneSuffix: string }) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [type, setType] = useState<'seeker' | 'employer'>('seeker');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });

  const handleLogin = async () => {
    if (!form.name || !form.phone) return alert('請輸入完整資訊');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phoneSuffix: form.phone, type }),
      });
      const data = await res.json();
      
      if (data.success) {
        const userData = { 
          name: data.userName, 
          type, 
          phoneSuffix: form.phone 
        };
        // 儲存使用者資訊與手機末三碼供後續應徵使用
        sessionStorage.setItem('jobUser', JSON.stringify(userData));
        sessionStorage.setItem('phoneSuffix', form.phone);
        
        onLoginSuccess(userData);
      } else {
        alert(data.error || '驗證失敗');
      }
    } catch (err) {
      alert('系統錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
        {/* 頂部標題區 */}
        <div className="p-8 text-center bg-blue-600 text-white">
          <h2 className="text-2xl font-black mb-2 tracking-tight">心成鐘點媒合儀表板</h2>
          <p className="text-sm opacity-90 font-medium">請驗證身分以存取職缺資料</p>
        </div>
        
        <div className="p-8">
          {/* 切換頁籤 */}
          <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => setType('seeker')}
              className={`flex-grow py-3 rounded-xl text-sm font-black transition-all ${
                type === 'seeker' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
              }`}
            >我是求職者</button>
            <button 
              onClick={() => setType('employer')}
              className={`flex-grow py-3 rounded-xl text-sm font-black transition-all ${
                type === 'employer' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
              }`}
            >我是企業主</button>
          </div>

          <div className="space-y-6">
            {/* 姓名輸入框 */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest">
                {type === 'seeker' ? '您的姓名' : '企業主姓名'}
              </label>
              <input 
                type="text" 
                placeholder="請輸入完整姓名"
                className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-600 font-black text-slate-900 text-lg placeholder:text-slate-300 transition-colors"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
              />
            </div>

            {/* 手機末三碼輸入框 */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest">
                手機末三碼
              </label>
              <input 
                type="password" 
                placeholder="例如：123" 
                maxLength={3}
                className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-600 font-black text-slate-900 text-lg tracking-[0.5em] placeholder:tracking-normal placeholder:text-slate-300 transition-colors"
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
              />
            </div>

            {/* 提交按鈕 */}
            <button 
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl transition-all shadow-xl active:scale-95 text-lg disabled:bg-slate-300 disabled:shadow-none mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  驗證中...
                </span>
              ) : '完成驗證進入系統'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}