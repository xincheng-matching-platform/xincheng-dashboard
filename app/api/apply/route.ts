import { NextResponse } from 'next/server';
import { getSheet } from '@/lib/googleSheets';

/**
 * 應徵提交 API
 * 處理求職者在儀表板點擊「確認送出」後的邏輯
 */
export async function POST(req: Request) {
  try {
    const APPLY_SS_ID = process.env.APPLY_SS_ID!;
    const { jobId, seekerName, phoneSuffix } = await req.json();

    if (!jobId || !seekerName || !phoneSuffix) {
      return NextResponse.json({ success: false, error: '缺少必要的應徵資訊' }, { status: 400 });
    }

    // 1. 取得相關工作表
    const [applyLogSheet, seekerSheet] = await Promise.all([
      getSheet(APPLY_SS_ID, '應徵職缺紀錄'),
      getSheet(APPLY_SS_ID, '求職者資訊')
    ]);

    // 2. 驗證求職者資訊 (選填，可增加安全性)
    const seekerRows = await seekerSheet.getRows();
    const currentSeeker = seekerRows.find(row => 
      row.get('求職者的姓名') === seekerName && 
      row.get('電話')?.endsWith(phoneSuffix)
    );

    // 3. 寫入應徵紀錄
    const companyName = jobId.split(' | ')[0]; // 從 "公司 | 時間" 中分離出公司名
    
    await applyLogSheet.addRow({
      '時間戳記': new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
      '應徵公司名稱': companyName,
      '應徵職缺標記': jobId,
      '求職者體系': currentSeeker?.get('體系') || '未對接',
      '求職者姓名': seekerName,
      '求職者電話': currentSeeker?.get('電話') || `末三碼:${phoneSuffix}`,
      '求職者LINE ID': currentSeeker?.get('LINE ID') || '',
      '求職者LINE 名稱': currentSeeker?.get('LINE 名稱') || ''
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Apply API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}