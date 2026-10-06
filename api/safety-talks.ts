export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const SAFETY_TALK_SHEET_ID = '1Fgx9ZEdHAQnH_oCuX0NdNO5_V3gEPHu0xjnqKk6GqWc';
const SAFETY_TALK_SHEET_TAB = 'Safety_Talk';

function parseSafetyTalkCsv(csvText: string): any[] {
  if (!csvText || typeof csvText !== 'string') return [];
  const lines: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    if (c === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && csvText[i + 1] === '\n') i++;
      row.push(current.trim());
      current = '';
      if (row.length > 1 || (row[0] && row[0] !== '')) {
        lines.push(row);
      }
      row = [];
    } else {
      current += c;
    }
  }
  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    lines.push(row);
  }

  if (lines.length < 2) return [];

  const headers = lines[0].map(h => String(h || '').trim());
  const colMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    colMap[clean] = idx;
  });

  const getCol = (r: string[], aliases: string[], fallbackIdx: number): string => {
    for (const a of aliases) {
      const idx = colMap[a.toLowerCase().replace(/[^a-z0-9]/g, '')];
      if (idx !== undefined && r[idx] !== undefined) {
        return String(r[idx]).trim();
      }
    }
    if (fallbackIdx !== undefined && r[fallbackIdx] !== undefined) {
      return String(r[fallbackIdx]).trim();
    }
    return '';
  };

  const records: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const r = lines[i];
    if (!r || r.length < 2) continue;

    const sr = getCol(r, ['sr', 'sr#', 'sno', 'id'], 0);
    const dept = getCol(r, ['dept', 'department'], 1);
    const shift = getCol(r, ['shift'], 2);
    const plannedDate = getCol(r, ['planneddate', 'planned_date', 'plan_date'], 3);
    const actualDate = getCol(r, ['actualdate', 'actual_date'], 4);
    const feedbackSubmissionDate = getCol(r, ['feedbacksubmissiondate', 'feedback_date'], 5);
    const feedbackSubmission = getCol(r, ['feedbacksubmission', 'feedback_submission'], 6);
    const stStatus = getCol(r, ['ststatus', 'st_status', 'safetytalkstatus'], 7);
    const plannedTopic = getCol(r, ['plannedtopic', 'planned_topic', 'topic'], 8);
    const actualTopic = getCol(r, ['actualtopic', 'actual_topic'], 9);
    const plannedSpeaker = getCol(r, ['plannedspeaker', 'planned_speaker'], 10);
    const backupSpeaker = getCol(r, ['backupspeaker', 'backup_speaker'], 11);
    const actualSpeaker = getCol(r, ['actualspeaker', 'actual_speaker'], 12);
    const plannedTopicDelivered = getCol(r, ['plannedtopicdelivered', 'topicdelivered'], 13);
    const recommendations = getCol(r, ['recommendations', 'recommendation', 'recs'], 14);
    const rStatus = getCol(r, ['rstatus', 'r_status', 'recommendationstatus'], 15);
    const pendingWith = getCol(r, ['pendingwithresponsibleunit', 'pendingwith', 'responsibleunit'], 16);
    const targetDate = getCol(r, ['targetdate', 'target_date'], 17);
    const closureDate = getCol(r, ['closuredate', 'closure_date'], 18);
    const remarks = getCol(r, ['remarks', 'remark', 'notes'], 19);

    let year = '';
    const dateStr = plannedDate || actualDate || '';
    const fourDigitMatch = dateStr.match(/\b(19\d\d|20\d\d)\b/);
    if (fourDigitMatch) year = fourDigitMatch[1];

    if (sr || dept || plannedTopic || stStatus) {
      records.push({
        sr: sr || String(records.length + 1),
        dept: dept || 'Unassigned',
        shift: shift || '',
        plannedDate: plannedDate || '',
        actualDate: actualDate || '',
        year: year,
        feedbackSubmissionDate: feedbackSubmissionDate || '',
        feedbackSubmission: feedbackSubmission || '',
        stStatus: stStatus || 'No',
        plannedTopic: plannedTopic || '',
        actualTopic: actualTopic || '',
        plannedSpeaker: plannedSpeaker || '',
        backupSpeaker: backupSpeaker || '',
        actualSpeaker: actualSpeaker || '',
        plannedTopicDelivered: plannedTopicDelivered || '',
        recommendations: recommendations || '',
        rStatus: rStatus || '',
        pendingWith: pendingWith || '',
        targetDate: targetDate || '',
        closureDate: closureDate || '',
        remarks: remarks || ''
      });
    }
  }

  return records;
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
  const targetTab = String(req.query?.tab || req.query?.sheetTab || req.body?.tab || req.body?.sheetTab || SAFETY_TALK_SHEET_TAB).trim();
  const envUrl = process.env.SAFETY_TALKS_SHEET_URL || process.env.SAFETY_TALK_SHEET_URL;

  const candidateUrls: string[] = [
    `https://docs.google.com/spreadsheets/d/${SAFETY_TALK_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(targetTab)}&_t=${now}&_nocache=${nonce}`,
    ...(envUrl ? [envUrl.includes('_t=') ? envUrl : `${envUrl}&_t=${now}&_nocache=${nonce}`] : []),
    `https://docs.google.com/spreadsheets/d/${SAFETY_TALK_SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(targetTab)}&_t=${now}&_nocache=${nonce}`,
    `https://docs.google.com/spreadsheets/d/${SAFETY_TALK_SHEET_ID}/gviz/tq?tqx=out:csv&_t=${now}`
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
          lower.includes('st status') || lower.includes('safety') || lower.includes('talk') ||
          lower.includes('dept') || lower.includes('planned date') || lower.includes('recommendations')
        );
        if (isValid) {
          rawCsv = text;
          sourceUrl = url;
          break;
        }
      }
    } catch (_e) {
      // Continue to next candidate
    }
  }

  if (rawCsv) {
    const records = parseSafetyTalkCsv(rawCsv);
    res.status(200).json({
      success: true,
      sheetId: SAFETY_TALK_SHEET_ID,
      tab: targetTab,
      sourceUrl,
      count: records.length,
      records,
      csvText: rawCsv,
      timestamp: now
    });
    return;
  }

  res.status(502).json({
    success: false,
    error: 'Failed to retrieve live data from Google Sheet'
  });
}
