import { NextResponse } from 'next/server';
import { getSheet } from '@/lib/googleSheets';

/**
 * 標準化時間戳記，確保應徵人數比對正確
 */
function normalizeTimestamp(raw: string): string {
  if (!raw) return "";
  try {
    const str = String(raw).trim().replace(/-/g, '/');
    const parts = str.split(' ');
    if (parts.length === 0) return "";
    const dateSegments = parts[0].split('/');
    if (dateSegments.length < 3) return str;

    const y = dateSegments[0];
    const m = dateSegments[1].padStart(2, '0');
    const d = dateSegments[2].padStart(2, '0');
    
    if (parts.length === 1) return `${y}/${m}/${d}`;

    let h = 0, min = 0, sec = 0;
    const hasAmPm = str.includes('上午') || str.includes('下午') || str.includes('AM') || str.includes('PM');
    
    if (hasAmPm) {
      const ampm = parts[1];
      const timeSegments = (parts[2] || "00:00:00").split(':');
      h = parseInt(timeSegments[0] || "0");
      min = parseInt(timeSegments[1] || "0");
      sec = parseInt(timeSegments[2] || "0");
      if ((ampm.includes('下午') || ampm.includes('PM')) && h < 12) h += 12;
      if ((ampm.includes('上午') || ampm.includes('AM')) && h === 12) h = 0;
    } else {
      const timeSegments = (parts[1] || "00:00:00").split(':');
      h = parseInt(timeSegments[0] || "0");
      min = parseInt(timeSegments[1] || "0");
      sec = parseInt(timeSegments[2] || "0");
    }
    return `${y}/${m}/${d} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  } catch (e) {
    return raw;
  }
}

export async function GET() {
  try {
    const JOB_SS_ID = process.env.JOB_SS_ID!;
    const APPLY_SS_ID = process.env.APPLY_SS_ID!;

    const [jobSheet, applyLogSheet, matchSheet] = await Promise.all([
      getSheet(JOB_SS_ID, '心成鐘點費用媒合工作'),
      getSheet(APPLY_SS_ID, '應徵職缺紀錄'),
      getSheet(APPLY_SS_ID, '媒合成功')
    ]);

    const jobRows = await jobSheet.getRows();
    const applyRows = await applyLogSheet.getRows();
    const matchRows = await matchSheet.getRows();

    // 建立應徵計數器
    const applyCounts: Record<string, number> = {};
    applyRows.forEach(row => {
      const rawId = row.get('應徵公司名稱')?.trim() || "";
      const idParts = rawId.split(' | ');
      if (idParts.length < 2) return;
      const key = `${idParts[0].trim()} | ${normalizeTimestamp(idParts[1])}`;
      applyCounts[key] = (applyCounts[key] || 0) + 1;
    });

    // 處理職缺：採用 _rawData 索引匹配以確保抓取成功
    const processedJobs = jobRows
      .filter(row => row.get('職缺狀態') !== '已下架' && (row.get('公司名稱') || row.get('公司')))
      .map(row => {
        // 使用 row._rawData[index] 是最穩定的方式 (索引比照 GAS)
        // 0:時間, 1:體系, 2:企業主, 3:窗口, 4:電話, 5:LINE ID, 6:LINE 名稱, 7:公司名稱, 10:工作內容, 12:地點, 16:備註
        const raw = (row as any)._rawData;
        const timestamp = raw[0] || '';
        const company = raw[7] || '';
        const normTs = normalizeTimestamp(timestamp);
        const fullId = `${company} | ${normTs}`;

        return {
          timestamp,
          postedTimestamp: new Date(timestamp.replace('上午', ' AM').replace('下午', ' PM').replace(/\//g, '-')).getTime() || 0,
          system: raw[1] || '一般體系',
          company,
          jobType: raw[9] || '兼職',
          content: raw[10] || '',
          location: raw[12] || '',
          timeSlots: raw[13] || '請洽詢',
          expiry: raw[14] || '長期有效',
          applyCount: applyCounts[fullId] || 0,
          
          // 聯絡資訊與備註 (強烈確保抓取)
          owner: raw[2] || '',
          person: raw[3] || '',
          phone: raw[4] || '',
          lineId: raw[5] || '',
          lineName: raw[6] || '',
          remark: raw[16] || '',
          
          coords: row.get('Latitude') ? { 
            lat: Number(row.get('Latitude')), 
            lng: Number(row.get('Longitude')) 
          } : null,
        };
      })
      .sort((a, b) => b.postedTimestamp - a.postedTimestamp);

    const processedMatches = matchRows.map(row => ({
      company: row.get('媒合成功之公司行號') || row.get('公司'),
      seeker: row.get('求職者的姓名') || '匿名',
      date: row.get('時間戳記'),
      formattedDate: row.get('時間戳記')?.split(' ')[0]
    }));

    return NextResponse.json({ success: true, jobs: processedJobs, matches: processedMatches });
  } catch (error: any) {
    console.error('Jobs API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}