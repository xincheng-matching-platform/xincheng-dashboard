// lib/googleSheets.ts
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

// 1. 檢查變數是否存在 (除錯用)
const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key = process.env.GOOGLE_PRIVATE_KEY;



if (!email || !key) {
  console.error("❌ 關鍵錯誤：環境變數 GOOGLE_SERVICE_ACCOUNT_EMAIL 或 GOOGLE_PRIVATE_KEY 缺失！");
}

// 2. 初始化授權
const serviceAccountAuth = new JWT({
  email: email,
  // 核心修復：使用 replace 處理換行，並確保 key 存在
  key: key?.replace(/\\n/g, '\n'), 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export async function getSheet(spreadsheetId: string, sheetName: string) {
  try {
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      console.warn(`找不到工作表 "${sheetName}"，嘗試讀取第一個工作表。`);
      return doc.sheetsByIndex[0];
    }
    return sheet;
  } catch (error) {
    console.error("Google Sheets 連線失敗:", error);
    throw error;
  }
}