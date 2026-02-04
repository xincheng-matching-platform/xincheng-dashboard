import { ShieldCheck, LogOut, ExternalLink } from 'lucide-react';

interface HeaderProps {
  user: {
    name: string;
    phoneSuffix?: string;
    type?: string; // 區分 seeker 或 employer
  };
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  // 假設企業管理平台的連結路徑，您可以根據實際 GAS 部署後的 URL 進行替換
  const employerPlatformUrl = "https://script.google.com/macros/s/AKfycbwudiwdd-6630NsE-A25lsOopXI8GNqrIf39rar9eY8oXlURJ4xdOk8r_Yen2LXTqCR/exec"; 

  return (
    <header className="bg-white shadow-sm border-b p-5 sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">心成職缺儀表板</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            歡迎回來，
            <span className="text-slate-900 font-black underline underline-offset-4 decoration-blue-500">
              {user?.name}
            </span> 
            {user?.phoneSuffix && (
              <span className="ml-1 text-gray-400 font-bold">({user.phoneSuffix})</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 企業主管理入口：新增此連結按鈕 */}
          <a 
            href={employerPlatformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-blue-600 font-black text-xs px-5 py-2.5 bg-white border-2 border-blue-100 rounded-full hover:bg-blue-50 hover:border-blue-200 transition-all active:scale-95"
          >
            <ShieldCheck size={16} />
            企業管理登入
            <ExternalLink size={12} className="opacity-40" />
          </a>

          {/* 登出按鈕 */}
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-red-500 font-black text-xs px-5 py-2.5 bg-red-50 rounded-full hover:bg-red-100 transition-colors border border-red-100 active:scale-95"
          >
            <LogOut size={16} />
            <span className="hidden xs:inline">登出系統</span>
          </button>
        </div>
      </div>
    </header>
  );
}