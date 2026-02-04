import { NextResponse } from 'next/server';
import { getSheet } from '@/lib/googleSheets';

export async function POST(req: Request) {
  try {
    const APPLY_SS_ID = process.env.APPLY_SS_ID!;
    const { jobId, seekerName, phoneSuffix } = await req.json();

    if (!jobId || !seekerName || !phoneSuffix) {
      return NextResponse.json({ success: false, error: '資料欄位不完整' }, { status: 400 });
    }

    // 取得工作表
    const [applySheet, seekerSheet] = await Promise.all([
      getSheet(APPLY_SS_ID, '應徵職缺紀錄'),
      getSheet(APPLY_SS_ID, '求職者資訊')
    ]);

    const seekerRows = await seekerSheet.getRows();
    const seekerProfile = seekerRows.find(row => 
      row.get('求職者的姓名') === seekerName && 
      row.get('電話')?.endsWith(phoneSuffix)
    );

    // 比照 GAS 版本邏輯：
    // 在「應徵職缺紀錄」工作表中，B 欄位名稱為「應徵公司名稱」，存放的是 "公司 | 時間戳記"
    await applySheet.addRow({
      '時間戳記': new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
      '應徵公司名稱': jobId, // 這裡寫入完整的識別碼
      '求職者體系': seekerProfile?.get('體系') || '未識別',
      '求職者姓名': seekerName,
      '求職者電話': seekerProfile?.get('電話') || `末碼:${phoneSuffix}`,
      '求職者LINE ID': seekerProfile?.get('LINE ID') || '',
      '求職者LINE 名稱': seekerProfile?.get('LINE 名稱') || ''
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Apply API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '寫入失敗，請確認試算表 B 欄位標題為「應徵公司名稱」' 
    }, { status: 500 });
  }
}