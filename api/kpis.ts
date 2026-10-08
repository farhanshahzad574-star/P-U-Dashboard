/**
 * Live KPIs endpoint from Google Sheet
 * Sheet ID: 1gkO-kV44ABOuB2JB72FQbwLYdAcAZKBzcIBMBZnR8Ts
 * Tab: KPIs
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const SHEET_ID = process.env.KPIS_SHEET_ID || '1gkO-kV44ABOuB2JB72FQbwLYdAcAZKBzcIBMBZnR8Ts';
const SHEET_TAB = process.env.KPIS_SHEET_TAB || 'KPIs';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const candidateUrls: string[] = [
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`,
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(SHEET_TAB)}`
    ];

    if (process.env.KPIS_SHEET_URL) {
      candidateUrls.unshift(process.env.KPIS_SHEET_URL);
    }

    let csvText = '';
    for (const testUrl of candidateUrls) {
      try {
        const response = await fetch(testUrl, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        });
        if (response.ok) {
          const text = await response.text();
          if (text && !text.includes('<!DOCTYPE html>') && text.includes(',')) {
            csvText = text;
            break;
          }
        }
      } catch (err) {}
    }

    if (!csvText) {
      return res.status(502).json({
        success: false,
        error: 'Unable to reach Google Sheets API for KPIs tab.'
      });
    }

    return res.status(200).json({
      success: true,
      sheetId: SHEET_ID,
      tab: SHEET_TAB,
      csvText
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error while fetching KPIs sheet.'
    });
  }
}
