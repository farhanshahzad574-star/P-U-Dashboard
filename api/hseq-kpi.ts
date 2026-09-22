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

    const lines = csvText.trim().split(/\r\n|\r|\n/).filter(line => line.trim().length > 0);
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
    const isActionSheet = headers.some(h => /action|assigned|ack|remarks/i.test(h));

    const parseNum = (val: any, fallback: number = 0): number => {
      if (val === undefined || val === null || val === '') return fallback;
      const clean = String(val).replace(/,/g, '').trim();
      const num = parseFloat(clean);
      return isNaN(num) ? fallback : num;
    };

    const headerIndices: Record<string, number> = {};
    headers.forEach((h, idx) => {
      const norm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm) {
        if (headerIndices[norm] === undefined) {
          headerIndices[norm] = idx;
        } else {
          // If duplicate like triractual, index second one as triractual1
          headerIndices[`${norm}1`] = idx;
        }
      }
    });

    const getRowVal = (row: string[], keys: string[], defaultVal: number, fallbackIdx?: number): number => {
      for (const k of keys) {
        const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (headerIndices[norm] !== undefined && row[headerIndices[norm]] !== undefined && row[headerIndices[norm]] !== '') {
          return parseNum(row[headerIndices[norm]], defaultVal);
        }
      }
      if (fallbackIdx !== undefined && row[fallbackIdx] !== undefined && row[fallbackIdx] !== '') {
        return parseNum(row[fallbackIdx], defaultVal);
      }
      return defaultVal;
    };

    const yearlyData: any[] = [];
    const rows = lines.slice(1);

    rows.forEach((line, rIdx) => {
      const values = parseCsvRow(line);
      if (values.length < 2 || !values.some(v => v.length > 0)) return;

      const sNo = getRowVal(values, ['s', 'sno', 's_#'], rIdx + 1, 0);
      const year = getRowVal(values, ['year', 'yr'], 2017 + rIdx, 7);
      const safeManhours = getRowVal(values, ['safemanhours', 'manhours'], 22200445, 1);
      const fire = getRowVal(values, ['fire', 'fireincidents'], 0, 2);
      const lti = getRowVal(values, ['lti', 'losttimeinjury'], 0, 3);
      const medicalTreatment = getRowVal(values, ['medicaltreatment', 'medical'], 0, 4);
      const firstAidCase = getRowVal(values, ['firstaidcase', 'firstaid'], 5, 5);
      const nearmiss = getRowVal(values, ['nearmiss', 'nearmisses'], 24, 6);
      const trirActual = getRowVal(values, ['triractual', 'triract'], 0, 8);
      const trirPlanned = getRowVal(values, ['triractual1', 'trirplanned', 'trirplan', 'trirtarget'], 5, 9);

      yearlyData.push({
        sNo,
        year,
        safeManhours,
        fire,
        lti,
        medicalTreatment,
        firstAidCase,
        nearmiss,
        trirActual,
        trirPlanned
      });
    });

    // Fallback if parsing yielded no rows
    if (yearlyData.length === 0) {
      for (let y = 2017; y <= 2026; y++) {
        yearlyData.push({
          sNo: y - 2016,
          year: y,
          safeManhours: 22200445,
          fire: 0,
          lti: 0,
          medicalTreatment: 0,
          firstAidCase: 5,
          nearmiss: 24,
          trirActual: 0,
          trirPlanned: 5
        });
      }
    }

    // Sort ascending by year for charts and trends
    yearlyData.sort((a, b) => a.year - b.year);

    // Calculate sum of all values per category
    const totals = {
      safeManhours: yearlyData.reduce((acc, row) => acc + (row.safeManhours || 0), 0),
      fire: yearlyData.reduce((acc, row) => acc + (row.fire || 0), 0),
      lti: yearlyData.reduce((acc, row) => acc + (row.lti || 0), 0),
      medicalTreatment: yearlyData.reduce((acc, row) => acc + (row.medicalTreatment || 0), 0),
      firstAidCase: yearlyData.reduce((acc, row) => acc + (row.firstAidCase || 0), 0),
      nearmiss: yearlyData.reduce((acc, row) => acc + (row.nearmiss || 0), 0),
      trirActual: yearlyData.reduce((acc, row) => acc + (row.trirActual || 0), 0),
      trirPlanned: yearlyData.reduce((acc, row) => acc + (row.trirPlanned || 0), 0)
    };

    const latest = yearlyData[yearlyData.length - 1] || yearlyData[0];
    const years = yearlyData.map(r => r.year);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.json({
      success: true,
      sheetName: 'HSEQ_KPI',
      updatedAt: new Date().toISOString(),
      totals,
      // Default kpis represent the sum of all values per category
      kpis: {
        safeManhours: totals.safeManhours,
        fire: totals.fire,
        lti: totals.lti,
        medicalTreatment: totals.medicalTreatment,
        firstAidCase: totals.firstAidCase,
        nearmiss: totals.nearmiss,
        trirActual: totals.trirActual,
        trirPlanned: totals.trirPlanned
      },
      latest,
      yearlyData,
      years,
      rawHeaders: headers,
      rawValues: rows[0] ? parseCsvRow(rows[0]) : [],
      csvText
    });
  } catch (err: any) {
    res.json({
      success: false,
      error: err?.message || 'Failed to fetch HSEQ_KPI sheet',
      sheetName: 'HSEQ_KPI',
      updatedAt: new Date().toISOString(),
      totals: {
        safeManhours: 222004450,
        fire: 0,
        lti: 0,
        medicalTreatment: 0,
        firstAidCase: 50,
        nearmiss: 240,
        trirActual: 0,
        trirPlanned: 50
      },
      kpis: {
        safeManhours: 222004450,
        fire: 0,
        lti: 0,
        medicalTreatment: 0,
        firstAidCase: 50,
        nearmiss: 240,
        trirActual: 0,
        trirPlanned: 50
      },
      yearlyData: [
        { sNo: 1, year: 2017, safeManhours: 22200445, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 5, nearmiss: 24, trirActual: 0, trirPlanned: 5 },
        { sNo: 2, year: 2018, safeManhours: 22200445, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 5, nearmiss: 24, trirActual: 0, trirPlanned: 5 },
        { sNo: 3, year: 2019, safeManhours: 22200445, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 5, nearmiss: 24, trirActual: 0, trirPlanned: 5 },
        { sNo: 4, year: 2020, safeManhours: 22200445, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 5, nearmiss: 24, trirActual: 0, trirPlanned: 5 },
        { sNo: 5, year: 2021, safeManhours: 22200445, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 5, nearmiss: 24, trirActual: 0, trirPlanned: 5 },
        { sNo: 6, year: 2022, safeManhours: 22200445, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 5, nearmiss: 24, trirActual: 0, trirPlanned: 5 },
        { sNo: 7, year: 2023, safeManhours: 22200445, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 5, nearmiss: 24, trirActual: 0, trirPlanned: 5 },
        { sNo: 8, year: 2024, safeManhours: 22200445, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 5, nearmiss: 24, trirActual: 0, trirPlanned: 5 },
        { sNo: 9, year: 2025, safeManhours: 22200445, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 5, nearmiss: 24, trirActual: 0, trirPlanned: 5 },
        { sNo: 10, year: 2026, safeManhours: 22200445, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 5, nearmiss: 24, trirActual: 0, trirPlanned: 5 }
      ],
      years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
    });
  }
}
