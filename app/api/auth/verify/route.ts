// app/api/auth/verify/route.ts
import { NextResponse } from 'next/server';
import { getSheet } from '@/lib/googleSheets';

export async function POST(request: Request) {
  const { name, phoneSuffix, type } = await request.json();
  
  try {
    const ssId = type === 'seeker' ? process.env.APPLY_SS_ID! : process.env.JOB_SS_ID!;
    const sheetName = type === 'seeker' ? '求職者資訊' : '工作機會';
    
    const sheet = await getSheet(ssId, sheetName);
    const rows = await sheet.getRows();

    // 尋找匹配的用戶
    // 假設求職者姓名在索引 2，電話在索引 3 (需依據您的試算表調整)
    const user = rows.find(row => {
      if (type === 'seeker') {
        // 對照「求職者資訊」工作表
        const sName = row.get('求職者的姓名'); // CSV 標題確實是「求職者的姓名」
        const sPhone = row.get('電話');       // CSV 標題是「電話」
        return sName === name && sPhone?.toString().endsWith(phoneSuffix);
      } else {
        // 對照「工作機會」工作表
        const eName = row.get('企業主姓名');   // CSV 標題是「企業主姓名」
        const ePhone = row.get('接洽人員電話'); // CSV 標題是「接洽人員電話」
        return eName === name && ePhone?.toString().endsWith(phoneSuffix);
      }
    });

    if (user) {
      return NextResponse.json({ success: true, userName: user.get('求職者的姓名') || user.get('企業主姓名') });
    } else {
      return NextResponse.json({ success: false, error: '驗證失敗，請檢查輸入資訊' });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}