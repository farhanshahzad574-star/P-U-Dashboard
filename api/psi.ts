export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const PSI_SHEET_ID = '1vWYE3G4W7TxHBVzsUJuu1Z-aufjXD-xFeodTpFUTZtY';
const PSI_SHEET_TAB = 'PSI';

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
  const targetTab = String(req.query?.tab || req.query?.sheetTab || req.body?.tab || req.body?.sheetTab || 'PSI').trim();
  const envUrl = process.env.PSI || process.env.PSI_SHEET_URL;

  const candidateUrls: string[] = [
    `https://docs.google.com/spreadsheets/d/${PSI_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(targetTab)}&_t=${now}&_nocache=${nonce}`,
    ...(envUrl && targetTab === 'PSI' ? [envUrl.includes('_t=') ? envUrl : `${envUrl}&_t=${now}&_nocache=${nonce}`] : []),
    `https://docs.google.com/spreadsheets/d/${PSI_SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(targetTab)}&_t=${now}&_nocache=${nonce}`,
    `https://docs.google.com/spreadsheets/d/${PSI_SHEET_ID}/gviz/tq?tqx=out:csv&_t=${now}`
  ];

  let rawCsv = '';
  let sourceUrl = '';

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/csv,text/plain,*/*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const text = await response.text();
        const lower = text.toLowerCase();
        const isValid = text && !text.includes('<!DOCTYPE html>') && (
          lower.includes('hold') || lower.includes('point') || lower.includes('package') ||
          lower.includes('responsible') || lower.includes('steam') || lower.includes('planned') || lower.includes('balance') || lower.includes('date')
        );
        if (isValid) {
          rawCsv = text;
          sourceUrl = url;
          break;
        }
      }
    } catch {
      // try next
    }
  }

  if (rawCsv) {
    res.status(200).json({
      success: true,
      source: sourceUrl,
      sheetId: PSI_SHEET_ID,
      tabName: PSI_SHEET_TAB,
      csvText: rawCsv,
      lastUpdated: new Date(now).toISOString()
    });
    return;
  }

  res.status(502).json({
    success: false,
    error: 'Could not fetch live PSI data from Google Sheet',
    sheetId: PSI_SHEET_ID,
    tabName: PSI_SHEET_TAB
  });
}
