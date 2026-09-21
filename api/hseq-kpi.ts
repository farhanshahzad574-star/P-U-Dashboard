export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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
    let sheetUrl = (req.query?.url as string) || process.env.HSEQ_KPI || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTyc0eRsaIpv3DWLdBbEplWo5FqrNwuCFpFrXM4_A6pRTkQgHz56DaN9FMV0cuCkQXnXfPDyKS_nsYC/pub?gid=553516171&single=true&output=csv';
    sheetUrl = sheetUrl.trim();

    const candidateUrls: string[] = [];
    if (sheetUrl.includes('/pub') && sheetUrl.includes('output=csv')) {
      candidateUrls.push(sheetUrl);
    } else if (sheetUrl.includes('/pub')) {
      const glue = sheetUrl.includes('?') ? '&' : '?';
      candidateUrls.push(`${sheetUrl}${glue}single=true&output=csv`);
      candidateUrls.push(sheetUrl);
    } else {
      const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        const id = match[1];
        const gidMatch = sheetUrl.match(/[#?&]gid=([0-9]+)/);
        const gid = gidMatch ? gidMatch[1] : '553516171';
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=HSEQ_KPI`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&sheet=HSEQ_KPI`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`);
      }
      candidateUrls.push(sheetUrl);
    }
    candidateUrls.push('https://docs.google.com/spreadsheets/d/e/2PACX-1vTyc0eRsaIpv3DWLdBbEplWo5FqrNwuCFpFrXM4_A6pRTkQgHz56DaN9FMV0cuCkQXnXfPDyKS_nsYC/pub?gid=553516171&single=true&output=csv');

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
      } catch (fetchErr) {
        // continue
      }
    }

    if (!csvText) {
      throw new Error('Could not fetch CSV content from HSEQ_KPI sheet candidate URLs');
    }

    const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('HSEQ_KPI sheet is empty or missing data rows');
    }

    const parseCsvRow = (rowStr: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(s => s.replace(/^["']|["']$/g, '').trim());
    };

    const headers = parseCsvRow(lines[0]);
    const values = parseCsvRow(lines[1]);

    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h.toLowerCase().replace(/[^a-z0-9]/g, '')] = values[idx] !== undefined ? values[idx] : '';
    });

    const getNum = (keys: string[], defaultVal: number): number => {
      for (const k of keys) {
        const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (record[norm] !== undefined && record[norm] !== '') {
          const parsed = parseInt(record[norm].replace(/,/g, ''), 10);
          if (!isNaN(parsed)) return parsed;
        }
      }
      return defaultVal;
    };

    const parseFallbackNum = (val: any, fallback: number): number => {
      if (val === undefined || val === null || val === '') return fallback;
      const num = parseInt(String(val).replace(/,/g, ''), 10);
      return isNaN(num) ? fallback : num;
    };

    const safeManhours = getNum(['Safe Manhours', 'Safe_Manhours', 'SafeManhours', 'Manhours'], parseFallbackNum(values[1], 2200445));
    const fire = getNum(['Fire', 'Fire Incidents'], parseFallbackNum(values[2], 0));
    const lti = getNum(['LTI', 'Lost Time Injury'], parseFallbackNum(values[3], 0));
    const medicalTreatment = getNum(['Medical Treatment', 'Medical_Treatment', 'Medical'], parseFallbackNum(values[4], 0));
    const firstAidCase = getNum(['First Aid Case', 'First_Aid_Case', 'First Aid', 'FirstAidCase'], parseFallbackNum(values[5], 5));
    const nearmiss = getNum(['Nearmiss', 'Near Miss', 'Near Misses'], parseFallbackNum(values[6], 24));

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.json({
      success: true,
      sheetName: 'HSEQ_KPI',
      updatedAt: new Date().toISOString(),
      kpis: {
        safeManhours,
        fire,
        lti,
        medicalTreatment,
        firstAidCase,
        nearmiss
      },
      rawHeaders: headers,
      rawValues: values,
      csvText
    });
  } catch (err: any) {
    res.json({
      success: false,
      error: err?.message || 'Failed to fetch HSEQ_KPI sheet',
      sheetName: 'HSEQ_KPI',
      updatedAt: new Date().toISOString(),
      kpis: {
        safeManhours: 2200445,
        fire: 0,
        lti: 0,
        medicalTreatment: 0,
        firstAidCase: 5,
        nearmiss: 24
      }
    });
  }
}
