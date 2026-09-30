export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const SHEET_ID = '1SrPdaxzEXbOFVbWin4zJvrc-m9TQKtxFjcyZYamXfpg';
const SHEET_TAB = 'FPCL_Directory';

function parseCsvRow(rowStr: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    if (char === '"') {
      if (inQuotes && rowStr[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(s => s.replace(/^["']|["']$/g, '').trim());
}

export default async function handler(req: any, res: any) {
  // CORS headers
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

  const now = Date.now();
  const nonce = Math.floor(Math.random() * 10000000);

  const candidateUrls: string[] = [
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}&_t=${now}&_nocache=${nonce}`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(SHEET_TAB)}&_t=${now}&_nocache=${nonce}`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&_t=${now}`
  ];

  let rawCsv = '';
  let sourceUrl = '';

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/csv,text/plain,*/*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        redirect: 'follow',
        cache: 'no-store'
      });

      if (response.ok) {
        const text = await response.text();
        if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html') && text.includes(',')) {
          rawCsv = text;
          sourceUrl = url;
          break;
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  if (rawCsv) {
    const lines = rawCsv.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length > 1) {
      const headerCells = parseCsvRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      let srIdx = headerCells.findIndex(h => h.includes('sr') || h.includes('no') || h === 'sno');
      let extIdx = headerCells.findIndex(h => h.includes('ext') || h.includes('phone') || h.includes('number'));
      let nameIdx = headerCells.findIndex(h => h.includes('user') || h.includes('name') || h.includes('contact'));

      if (srIdx === -1) srIdx = 0;
      if (extIdx === -1) extIdx = 1;
      if (nameIdx === -1) nameIdx = 2;

      const parsed: Array<{ sr: string; ext: string; name: string }> = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvRow(lines[i]);
        const sr = (cells[srIdx] || String(parsed.length + 1)).trim();
        const ext = (cells[extIdx] || '').trim();
        const name = (cells[nameIdx] || '').trim();

        if (ext || name) {
          parsed.push({ sr, ext, name });
        }
      }

      if (parsed.length > 0) {
        res.status(200).json({
          success: true,
          count: parsed.length,
          data: parsed,
          csvText: rawCsv,
          source: 'live',
          sourceUrl,
          sheetId: SHEET_ID,
          tabName: SHEET_TAB,
          lastUpdated: new Date(now).toISOString()
        });
        return;
      }
    }
  }

  res.status(502).json({
    success: false,
    error: 'Could not fetch FPCL Directory from Google Sheet',
    sheetId: SHEET_ID,
    tabName: SHEET_TAB
  });
}
