export interface StrategicActionItem {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  status: 'Open' | 'Closed';
  closureDate: string;
  remarks: string;
  rawColumns?: Record<string, string>;
  columnHeaders?: string[];
}

export interface StrategicTileConfig {
  sheetId?: string;
  envKeys: string[];
  code: string;
  defaultTab: string;
  name: string;
  fallbackUrl: string;
}

export const STRATEGIC_TILE_REGISTRY: Record<string, StrategicTileConfig> = {
  'strategic-master': {
    envKeys: ['STRATEGIC_SHEET_URL', 'STRATEGIC_MASTER_SHEET_URL'],
    code: 'STRAT',
    defaultTab: 'ExecutiveRollup',
    name: 'Strategic Master (COO)',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjecapStvtMhaYILR7NX-jRI5vcXVVCq7sIaBQmeDoBgqWnBZQPJcGDeN88VETinBOHibJ2BT1H_UX/pub?output=csv'
  },
  'admin-security': {
    envKeys: [
      'ADMIN_SECURITY_SHEET_URL',
      'Admin_&_Security',
      'ADMIN_&_SECURITY',
      'ADMIN_AND_SECURITY',
      'ADMIN_SECURITY',
      'ADMIN_SECURITY_URL',
      'ADMIN_&_SECURITY_SHEET_URL',
      'ADMIN_AND_SECURITY_SHEET_URL',
      'Admin_Security',
      'Admin_Security_Sheet_Url',
      'ADMIN_SHEET_URL',
      'SECURITY_SHEET_URL',
      'STRATEGIC_ADMIN_SECURITY_SHEET_URL'
    ],
    code: 'ADM',
    defaultTab: 'Admin_Security_Actions',
    name: 'Admin & Security',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'asset-integrity': {
    sheetId: '1al3SsYo9FWHZxc8rYrJE5SV4H3RafPcd1xGSyfcy5Nc',
    envKeys: ['ASSET_INTEGRITY_SHEET_URL', 'ASSET_INTEGRITY', 'Asset_Integrity', 'STRATEGIC_ASSET_INTEGRITY_SHEET_URL'],
    code: 'AI',
    defaultTab: 'ASSET_INTEGRITY_SHEET_URL',
    name: 'Asset Integrity',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1al3SsYo9FWHZxc8rYrJE5SV4H3RafPcd1xGSyfcy5Nc/edit'
  },
  'business-development': {
    sheetId: '1PYQlmmzy2VFMohIlNxipiFsfgKPsopgd2VdAdXhMiB4',
    envKeys: ['COMMERCIAL_SHEET_URL', 'BUSINESS_DEVELOPMENT_SHEET_URL', 'COMMERCIAL', 'BUSINESS_DEVELOPMENT', 'STRATEGIC_BUSINESS_DEVELOPMENT_SHEET_URL'],
    code: 'BD',
    defaultTab: 'COMMERCIAL_SHEET_URL',
    name: 'Business Development',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PYQlmmzy2VFMohIlNxipiFsfgKPsopgd2VdAdXhMiB4/edit'
  },
  'civil': {
    sheetId: '1EPIHm33gIOTrAfXvjGO3yRQhu5jPl_BjstTaWtWgs_0',
    envKeys: ['CIVIL_SHEET_URL', 'CIVIL', 'Civil', 'STRATEGIC_CIVIL_SHEET_URL'],
    code: 'CIV',
    defaultTab: 'CIVIL_SHEET_URL',
    name: 'Civil',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1EPIHm33gIOTrAfXvjGO3yRQhu5jPl_BjstTaWtWgs_0/edit'
  },
  'ei': {
    sheetId: '1ap9EfOwDUaoere3nKGmfvLNBKoCNp_KB_8KSEc3Y3fA',
    envKeys: ['EI_SHEET_URL', 'EI', 'E&I', 'STRATEGIC_EI_SHEET_URL'],
    code: 'EI',
    defaultTab: 'EI_SHEET_URL',
    name: 'E&I',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1ap9EfOwDUaoere3nKGmfvLNBKoCNp_KB_8KSEc3Y3fA/edit'
  },
  'finance': {
    sheetId: '1hpQsdyMteOhlFCSAm9Yb3GQT_veTVArxcy3inSpkGdA',
    envKeys: ['FINANCE_SHEET_URL', 'FINANCE', 'Finance', 'STRATEGIC_FINANCE_SHEET_URL'],
    code: 'FIN',
    defaultTab: 'FINANCE_SHEET_URL',
    name: 'Finance',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1hpQsdyMteOhlFCSAm9Yb3GQT_veTVArxcy3inSpkGdA/edit'
  },
  'hseq': {
    sheetId: '1jXMXuX2b6HAF_U4e6tiGOzWw2adMpCyUPI5kbODxoPI',
    envKeys: ['HSEQ_SHEET_URL', 'HSEQ_KPI'],
    code: 'HSEQ',
    defaultTab: 'HSEQ_Actions',
    name: 'HSEQ',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1jXMXuX2b6HAF_U4e6tiGOzWw2adMpCyUPI5kbODxoPI/gviz/tq?tqx=out:csv&sheet=HSEQ_SHEET_URL'
  },
  'hcm': {
    sheetId: '1Macb6nmGzel3tseZPp61lHuL8NagAxZPZFRQnw4yCU0',
    envKeys: ['HCM_SHEET_URL', 'STRATEGIC_HCM_SHEET_URL', 'HCM'],
    code: 'HCM',
    defaultTab: 'HCM_SHEET_URL',
    name: 'HCM',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1Macb6nmGzel3tseZPp61lHuL8NagAxZPZFRQnw4yCU0/edit'
  },
  'ims': {
    sheetId: '1kyekkmRkxYCWxXYjKp5zCSM_NAnb6uqmCBnLcgDR6iM',
    envKeys: ['IMS_SHEET_URL', 'STRATEGIC_IMS_SHEET_URL', 'IMS_STRATEGIC', 'IMS_STRATEGIC_SHEET_URL'],
    code: 'IMS',
    defaultTab: 'IMS_SHEET_URL',
    name: 'IMS',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1kyekkmRkxYCWxXYjKp5zCSM_NAnb6uqmCBnLcgDR6iM/edit'
  },
  'it': {
    sheetId: '1wJ-MIlSvfguUMTz06eqJ2brAYt47gtqKB_nPGrGMuaM',
    envKeys: ['IT_SHEET_URL', 'IT', 'Information_Technology', 'STRATEGIC_IT_SHEET_URL'],
    code: 'IT',
    defaultTab: 'IT_SHEET_URL',
    name: 'IT',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1wJ-MIlSvfguUMTz06eqJ2brAYt47gtqKB_nPGrGMuaM/edit'
  },
  'inspection': {
    sheetId: '1fW4P4HXfD6Yt5uvNnB2B6u4GveOBK8VSEPal-giXCIw',
    envKeys: ['INSPECTION_SHEET_URL', 'INSPECTION', 'Inspection', 'STRATEGIC_INSPECTION_SHEET_URL'],
    code: 'INSP',
    defaultTab: 'INSPECTION_SHEET_URL',
    name: 'Inspection',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1fW4P4HXfD6Yt5uvNnB2B6u4GveOBK8VSEPal-giXCIw/edit'
  },
  'ld': {
    sheetId: '1lWSPmrx5LBX64E4vY-VWafLWwql8K7aBcxicprO3ZE0',
    envKeys: ['LD_SHEET_URL', 'LD', 'L&D', 'STRATEGIC_LD_SHEET_URL'],
    code: 'LD',
    defaultTab: 'LD_SHEET_URL',
    name: 'L&D',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1lWSPmrx5LBX64E4vY-VWafLWwql8K7aBcxicprO3ZE0/edit'
  },
  'machinery': {
    sheetId: '1zRmPlFDlRijQOTboLfhukEjdFHeUR9P5pcRIUeV7rY0',
    envKeys: ['MACHINERY_SHEET_URL', 'MACHINERY', 'Machinery', 'STRATEGIC_MACHINERY_SHEET_URL'],
    code: 'MACH',
    defaultTab: 'MACHINERY_SHEET_URL',
    name: 'Machinery',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1zRmPlFDlRijQOTboLfhukEjdFHeUR9P5pcRIUeV7rY0/edit'
  },
  'mechanical': {
    sheetId: '1gedfNYWwLaLDL85bz2PuDGi1NZP8QiwW42Vklym5i1w',
    envKeys: ['MECHANICAL_SHEET_URL', 'MECHANICAL', 'Mechanical', 'STRATEGIC_MECHANICAL_SHEET_URL'],
    code: 'MECH',
    defaultTab: 'MECHANICAL_SHEET_URL',
    name: 'Mechanical',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1gedfNYWwLaLDL85bz2PuDGi1NZP8QiwW42Vklym5i1w/edit'
  },
  'operations': {
    sheetId: '19iQ_D6k_hvKYP8-FTuBZ51yTcu3Zo2Q0VhXv67wRVZ0',
    envKeys: ['OPERATIONS_SHEET_URL', 'OPERATIONS', 'Operations', 'STRATEGIC_OPERATIONS_SHEET_URL'],
    code: 'OPS',
    defaultTab: 'OPERATIONS_SHEET_URL',
    name: 'Operations',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/19iQ_D6k_hvKYP8-FTuBZ51yTcu3Zo2Q0VhXv67wRVZ0/edit'
  },
  'reliability': {
    sheetId: '15H3FZaEOczMu5_XcGo7Rs576n4CVakY0iRlvHYdbyvk',
    envKeys: ['RELIABILITY_SHEET_URL', 'RELIABILITY', 'Reliability', 'STRATEGIC_RELIABILITY_SHEET_URL'],
    code: 'REL',
    defaultTab: 'RELIABILITY_SHEET_URL',
    name: 'Reliability',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/15H3FZaEOczMu5_XcGo7Rs576n4CVakY0iRlvHYdbyvk/edit'
  },
  'scm': {
    sheetId: '1SXhHYiQy21bF1g0PimScyhhyBGNch37VWTSHTgWPbP0',
    envKeys: ['SCM_SHEET_URL', 'STRATEGIC_SCM_SHEET_URL', 'GOOGLE_SHEET_SCM', 'SCM_URL', 'SCM'],
    code: 'SCM',
    defaultTab: 'SCM_SHEET_URL',
    name: 'SCM',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1SXhHYiQy21bF1g0PimScyhhyBGNch37VWTSHTgWPbP0/edit'
  },
  'projects': {
    sheetId: '1Gr0IBANH6GeKMeozJywlHrQccPBdrMuJ5RRctPsQvRI',
    envKeys: ['PROJECTS_SHEET_URL', 'PROJECTS', 'Projects', 'STRATEGIC_PROJECTS_SHEET_URL'],
    code: 'PRJ',
    defaultTab: 'PROJECTS',
    name: 'Projects',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1Gr0IBANH6GeKMeozJywlHrQccPBdrMuJ5RRctPsQvRI/edit'
  },
  'process': {
    sheetId: '1w3ZgX9ixr4xLbesrDIhDZcTV7iQ8wL9XQ3VivZ5YKWs',
    envKeys: ['PROCESS_SHEET_URL', 'PROCESS', 'Process', 'STRATEGIC_PROCESS_SHEET_URL'],
    code: 'PROC',
    defaultTab: 'PROCESS_SHEET_URL',
    name: 'Process',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1w3ZgX9ixr4xLbesrDIhDZcTV7iQ8wL9XQ3VivZ5YKWs/edit'
  }
};

export function getCandidateTabsForTile(tileId: string, sheetUrl?: string): string[] {
  const normalizedId = tileId === 'admin_security' || tileId === 'Admin_&_Security' ? 'admin-security' : tileId;
  const reg = STRATEGIC_TILE_REGISTRY[normalizedId];
  const candidateTabs: string[] = [];

  if (sheetUrl) {
    const urlSheetMatch = sheetUrl.match(/[?&]sheet=([^&#]+)/);
    if (urlSheetMatch) {
      try {
        const decoded = decodeURIComponent(urlSheetMatch[1]);
        if (decoded && !candidateTabs.includes(decoded)) candidateTabs.push(decoded);
      } catch (e) {}
    }
  }

  if (reg) {
    if (reg.defaultTab && !candidateTabs.includes(reg.defaultTab)) candidateTabs.push(reg.defaultTab);

    const rawName = reg.name || '';
    const nameUnderscore = rawName.replace(/[\s&]+/g, '_');
    const nameNoSpecial = rawName.replace(/[^a-zA-Z0-9]/g, '');

    const tabCandidates = [
      `${nameUnderscore}_Actions`,
      `${rawName}_Actions`,
      `${reg.code}_Actions`,
      `${reg.code}_Action`,
      rawName,
      nameUnderscore,
      nameNoSpecial,
      reg.code,
      ...(reg.envKeys || [])
    ];

    for (const t of tabCandidates) {
      if (t && !candidateTabs.includes(t)) candidateTabs.push(t);
    }
  }

  if (normalizedId === 'admin-security') {
    ['Admin_Security_Actions', 'Admin_&_Security', 'Admin & Security', 'Admin_Security', 'Admin and Security', 'Admin', 'Security'].forEach(t => {
      if (!candidateTabs.includes(t)) candidateTabs.push(t);
    });
  } else if (normalizedId === 'scm') {
    ['SCM_SHEET_URL', 'SCM_Actions', 'SCM', 'SCM Actions', 'Supply Chain', 'Procurement'].forEach(t => {
      if (!candidateTabs.includes(t)) candidateTabs.push(t);
    });
  } else if (normalizedId === 'hcm') {
    ['HCM_SHEET_URL', 'HCM_Actions', 'HCM', 'HCM Actions', 'Human Capital'].forEach(t => {
      if (!candidateTabs.includes(t)) candidateTabs.push(t);
    });
  }

  if (!candidateTabs.includes('Sheet1')) candidateTabs.push('Sheet1');

  return candidateTabs;
}

export function getSheetUrlForTile(tileId: string): string {
  const normalizedId = tileId === 'admin_security' || tileId === 'Admin_&_Security' ? 'admin-security' : tileId;
  const reg = STRATEGIC_TILE_REGISTRY[normalizedId];
  if (!reg) return '';

  // If this tile has an explicit designated sheetId, ONLY accept environment variables that contain this exact sheetId!
  // This prevents mismatched secrets (e.g. LD_SHEET_URL containing IT sheet URL, or PROJECTS_SHEET_URL containing an old URL)
  // from overriding the user's intended target sheet.
  if (reg.sheetId) {
    for (const k of reg.envKeys) {
      const val = process.env[k];
      if (val && typeof val === 'string' && val.trim().includes(reg.sheetId)) {
        return val.trim();
      }
    }
    // Return canonical fallback URL with designated sheetId
    return reg.fallbackUrl;
  }

  for (const k of reg.envKeys) {
    const val = process.env[k];
    if (val && typeof val === 'string' && val.trim()) {
      return val.trim();
    }
  }

  return reg.fallbackUrl;
}

export function parseCsvToStrategicActions(csvText: string, defaultCode: string): StrategicActionItem[] {
  if (!csvText) return [];
  const lines = csvText.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const parseRowTokens = (line: string): string[] => {
    const row: string[] = [];
    let inQuotes = false;
    let token = '';
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        row.push(token.trim().replace(/^"|"$/g, ''));
        token = '';
      } else {
        token += ch;
      }
    }
    row.push(token.trim().replace(/^"|"$/g, ''));
    return row;
  };

  const rawHeaders = parseRowTokens(lines[0]).filter(h => h.length > 0);
  const headers = rawHeaders.map(h => h.toLowerCase());
  const findCol = (candidates: string[]) => headers.findIndex(h => candidates.some(c => h.includes(c)));

  const idCol = findCol(['id', 'code', 'action #', 'action#', 'item', 'sr', 's_no', 's.no', 'sno', 'no', '#']);
  const descCol = findCol(['action', 'task', 'title', 'desc', 'description', 'activity', 'deliverable']);
  const statusCol = findCol(['status', 'state', 'condition', 'open_close status', 'open_close', 'status detail']);
  const priorityCol = findCol(['priority', 'prio', 'urgency']);
  const dueCol = findCol(['due', 'target', 'deadline', 'date', 'target date']);
  const remarksCol = findCol(['remark', 'note', 'comment', 'closure', 'remarks']);
  const closureCol = findCol(['closure date', 'closed on', 'completed date', 'resolved date']);

  const parsed: StrategicActionItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseRowTokens(lines[i]);

    const desc = descCol !== -1 ? (row[descCol] || '') : (row[1] || row[0] || '');
    if (!desc || desc.trim().length === 0) continue;

    // Ignore placeholder header repeats or sample student data
    if (/student name|extracurricular|alexandra|class level/i.test(desc)) continue;

    const rawStatus = statusCol !== -1 ? (row[statusCol] || 'Open') : 'Open';
    const isClosed = /close|done|complete|resolved/i.test(rawStatus);
    const status: 'Open' | 'Closed' = isClosed ? 'Closed' : 'Open';

    let rawId = idCol !== -1 && row[idCol] ? row[idCol].trim() : '';
    let id = rawId;
    if (!id) {
      id = `${defaultCode}-${String(i).padStart(2, '0')}`;
    } else if (/^\d+$/.test(id)) {
      id = `${defaultCode}-${id.padStart(2, '0')}`;
    }

    const rawPriority = priorityCol !== -1 ? (row[priorityCol] || '') : '';
    let priority: 'High' | 'Medium' | 'Low' = 'High';
    if (/low|p3/i.test(rawPriority)) {
      priority = 'Low';
    } else if (/med|medium|p2/i.test(rawPriority)) {
      priority = 'Medium';
    } else if (/high|critical|p1/i.test(rawPriority)) {
      priority = 'High';
    } else {
      priority = i % 2 === 0 ? 'Medium' : 'High';
    }

    const dueDate = dueCol !== -1 ? (row[dueCol] || '') : '';
    const remarks = remarksCol !== -1 ? (row[remarksCol] || '') : '';
    const closureDate = closureCol !== -1 ? (row[closureCol] || '') : (isClosed ? (dueDate || new Date().toISOString().split('T')[0]) : '');

    const rawColumns: Record<string, string> = {};
    for (let c = 0; c < rawHeaders.length; c++) {
      const headerName = rawHeaders[c];
      rawColumns[headerName] = row[c] || '';
    }

    parsed.push({
      id,
      title: desc,
      priority,
      dueDate,
      status,
      closureDate,
      remarks,
      rawColumns,
      columnHeaders: rawHeaders
    });
  }
  return parsed;
}
