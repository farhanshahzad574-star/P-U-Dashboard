/**
 * Live Crew Week Shift Roster endpoint from Google Sheet
 * Sheet ID: 1vbclqX2smmSq2C4tu_fw44mApg1ng6wVZ9bgPC7aUBk
 * Tab: Crew_Week
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const SHEET_ID = process.env.CREW_WEEK_SHEET_ID || '1vbclqX2smmSq2C4tu_fw44mApg1ng6wVZ9bgPC7aUBk';
const SHEET_TAB = process.env.CREW_WEEK_SHEET_TAB || 'Crew_Week';

export interface CrewWeekPersonnel {
  sr: string;
  name: string;
  position: string;
  crewWeek: string;
  designation: string;
  orgUnit: string;
}

export function parseCrewWeekCsv(csvText: string): CrewWeekPersonnel[] {
  if (!csvText || typeof csvText !== 'string') return [];
  const rows: string[][] = [];
  let curRow: string[] = [];
  let curField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    if (inQuotes) {
      if (c === '"' && csvText[i + 1] === '"') {
        curField += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        curField += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        curRow.push(curField.trim());
        curField = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && csvText[i + 1] === '\n') i++;
        curRow.push(curField.trim());
        if (curRow.length > 1 || curRow[0] !== '') {
          rows.push(curRow);
        }
        curRow = [];
        curField = '';
      } else {
        curField += c;
      }
    }
  }
  if (curField || curRow.length) {
    curRow.push(curField.trim());
    if (curRow.length > 1 || curRow[0] !== '') {
      rows.push(curRow);
    }
  }

  if (rows.length <= 1) return [];

  // Remove potential headers
  const dataRows = rows[0][0].toLowerCase().includes('sr') ? rows.slice(1) : rows;

  return dataRows
    .filter(r => r.length >= 2 && r[1])
    .map(r => ({
      sr: (r[0] || '').trim(),
      name: (r[1] || '').trim(),
      position: (r[2] || '').trim(),
      crewWeek: (r[3] || '').trim(),
      designation: (r[4] || '').trim(),
      orgUnit: (r[5] || '').trim(),
    }));
}

export function parseGroupCsv(csvText: string): { headers: string[]; rows: any[] } {
  if (!csvText || typeof csvText !== 'string') return { headers: [], rows: [] };
  const rows: string[][] = [];
  let curRow: string[] = [];
  let curField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    if (inQuotes) {
      if (c === '"' && csvText[i + 1] === '"') {
        curField += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        curField += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        curRow.push(curField.trim());
        curField = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && csvText[i + 1] === '\n') i++;
        curRow.push(curField.trim());
        if (curRow.length > 1 || (curRow.length === 1 && curRow[0] !== '')) {
          rows.push(curRow);
        }
        curRow = [];
        curField = '';
      } else {
        curField += c;
      }
    }
  }
  if (curField || curRow.length) {
    curRow.push(curField.trim());
    if (curRow.length > 1 || (curRow.length === 1 && curRow[0] !== '')) {
      rows.push(curRow);
    }
  }

  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0].map(h => (h || '').trim());
  const dataRows = rows.slice(1).map((r, idx) => ({
    cycle: idx + 1,
    groupA: (r[0] || '').trim(),
    groupB: (r[1] || '').trim(),
    groupC: (r[2] || '').trim(),
    groupD: (r[3] || '').trim(),
    values: r.map(v => (v || '').trim())
  }));

  return { headers, rows: dataRows };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const requestedTab = (req.query?.tab as string) || (req.query?.sheetTab as string) || SHEET_TAB;
  const isGroupTab = requestedTab.toLowerCase() === 'group';
  const effectiveTab = isGroupTab ? 'Group' : SHEET_TAB;

  const now = Date.now();
  const nonce = Math.floor(Math.random() * 10000000);

  const customUrl = process.env.CREW_WEEK_SHEET_URL || process.env.CREW_WEEK;
  const candidateUrls: string[] = [];

  if (customUrl && !isGroupTab) {
    candidateUrls.push(customUrl);
  }

  candidateUrls.push(
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(effectiveTab)}&_t=${now}&_nocache=${nonce}`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(effectiveTab)}&_t=${now}&_nocache=${nonce}`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&_t=${now}`
  );

  let rawCsv = '';
  let sourceUrl = '';

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'text/csv,text/plain,*/*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        redirect: 'follow',
        cache: 'no-store',
      });
      if (response.ok) {
        const text = await response.text();
        if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html') && text.includes(',')) {
          rawCsv = text;
          sourceUrl = url;
          break;
        }
      }
    } catch (_err) {
      // Continue to next candidate URL
    }
  }

  if (!rawCsv) {
    res.status(502).json({
      success: false,
      error: `Unable to reach Google Sheets endpoints for tab: ${effectiveTab}`,
      sheetId: SHEET_ID,
      tab: effectiveTab,
    });
    return;
  }

  if (isGroupTab) {
    const { headers, rows } = parseGroupCsv(rawCsv);
    res.json({
      success: true,
      sheetId: SHEET_ID,
      tab: 'Group',
      sourceUrl,
      headers,
      count: rows.length,
      data: rows,
      rawCsv,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const records = parseCrewWeekCsv(rawCsv);

  res.json({
    success: true,
    sheetId: SHEET_ID,
    tab: SHEET_TAB,
    sourceUrl,
    count: records.length,
    data: records,
    rawCsv,
    timestamp: new Date().toISOString(),
  });
}
