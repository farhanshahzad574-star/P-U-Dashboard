/**
 * FPCL Executive Operations & Compliance Portal
 * Strategic Department Sheets Dataset & Definitions
 * 
 * Each department tile is connected to a single Google Sheet.
 * The Strategic Dashboard tile serves as the Executive Summary rollup across all department sheets.
 */

(function () {
  'use strict';

  const SHARED_STRATEGIC_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing';

  const STRATEGIC_EMPLOYEES_CONFIG = [
    {
      id: 'strategic-master',
      name: 'Strategic Dashboard',
      code: 'STRAT-COO',
      isBossDashboard: true,
      category: 'Executive & Governance',
      icon: 'target',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: SHARED_STRATEGIC_SHEET_URL,
      sheetTab: 'ExecutiveRollup',
      gid: '0',
      theme: {
        bg: '#FAF5FF',
        border: '#E9D5FF',
        primary: '#7C3AED',
        secondary: '#A855F7',
        text: '#581C87',
        gradient: 'from-purple-600 via-violet-600 to-indigo-700',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      description: 'Executive rollup dashboard to track overall status of actions across all departments.'
    },
    {
      id: 'admin-security',
      name: 'Admin & Security',
      code: 'ADM',
      isBossDashboard: false,
      category: 'Corporate Services',
      icon: 'shield-check',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: SHARED_STRATEGIC_SHEET_URL,
      sheetTab: 'Admin_Security_Actions',
      gid: '0',
      theme: {
        bg: '#F8FAFC',
        border: '#CBD5E1',
        primary: '#334155',
        secondary: '#64748B',
        text: '#0F172A',
        gradient: 'from-slate-700 via-slate-800 to-zinc-900',
        badgeBg: 'bg-slate-100 text-slate-800 border-slate-300'
      },
      actions: [
        { id: 'ADM-01', title: 'Complete annual plant biometric access audit and contractor gate permissions review', status: 'Closed', dueDate: '2026-02-15', closureDate: '2026-02-14', remarks: 'Gate audit finalized with 100% badge compliance verification.' },
        { id: 'ADM-02', title: 'Upgrade perimeter CCTV surveillance network along East boundary line', status: 'Open', dueDate: '2026-04-10', closureDate: '', remarks: 'Vendor procurement RFP in progress with SCM.' },
        { id: 'ADM-03', title: 'Renew municipal administrative licenses and security guard deployment roster', status: 'Closed', dueDate: '2026-01-30', closureDate: '2026-01-28', remarks: 'Security contractor agreement renewed for FY 2026.' },
        { id: 'ADM-04', title: 'Implement smart vehicle tracking and visitor parking automated gate protocol', status: 'Open', dueDate: '2026-05-01', closureDate: '', remarks: 'Sensors delivered, installation scheduled for next shutdown.' },
        { id: 'ADM-05', title: 'Audit emergency physical evacuation muster points and administrative safety signage', status: 'Closed', dueDate: '2026-03-05', closureDate: '2026-03-04', remarks: 'All 8 muster points updated with high-visibility solar markers.' }
      ]
    },
    {
      id: 'asset-integrity',
      name: 'Asset Integrity',
      code: 'AI',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'activity',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1al3SsYo9FWHZxc8rYrJE5SV4H3RafPcd1xGSyfcy5Nc/edit',
      sheetTab: 'ASSET_INTEGRITY_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#FDF4FF',
        border: '#F0ABFC',
        primary: '#C026D3',
        secondary: '#E879F9',
        text: '#701A75',
        gradient: 'from-fuchsia-600 via-pink-600 to-rose-600',
        badgeBg: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'business-development',
      name: 'Business Development',
      code: 'BD',
      isBossDashboard: false,
      category: 'Strategic Commercial',
      icon: 'trending-up',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1PYQlmmzy2VFMohIlNxipiFsfgKPsopgd2VdAdXhMiB4/edit',
      sheetTab: 'COMMERCIAL_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#F0FDF4',
        border: '#BBF7D0',
        primary: '#16A34A',
        secondary: '#4ADE80',
        text: '#14532D',
        gradient: 'from-emerald-600 via-green-600 to-teal-700',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'civil',
      name: 'Civil',
      code: 'CIV',
      isBossDashboard: false,
      category: 'Engineering & Maintenance',
      icon: 'hard-hat',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1EPIHm33gIOTrAfXvjGO3yRQhu5jPl_BjstTaWtWgs_0/edit',
      sheetTab: 'CIVIL_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#FFFBEB',
        border: '#FDE68A',
        primary: '#D97706',
        secondary: '#FBBF24',
        text: '#78350F',
        gradient: 'from-amber-600 via-orange-600 to-yellow-600',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'ei',
      name: 'E&I',
      code: 'EI',
      isBossDashboard: false,
      category: 'Engineering & Maintenance',
      icon: 'cpu',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1ap9EfOwDUaoere3nKGmfvLNBKoCNp_KB_8KSEc3Y3fA/edit',
      sheetTab: 'EI_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#EFF6FF',
        border: '#BFDBFE',
        primary: '#2563EB',
        secondary: '#60A5FA',
        text: '#1E3A8A',
        gradient: 'from-blue-600 via-indigo-600 to-cyan-600',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'finance',
      name: 'Finance',
      code: 'FIN',
      isBossDashboard: false,
      category: 'Corporate Services',
      icon: 'calculator',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1hpQsdyMteOhlFCSAm9Yb3GQT_veTVArxcy3inSpkGdA/edit',
      sheetTab: 'FINANCE_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#F0FDF4',
        border: '#86EFAC',
        primary: '#059669',
        secondary: '#34D399',
        text: '#064E3B',
        gradient: 'from-emerald-700 via-teal-700 to-green-800',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'hseq',
      name: 'HSEQ',
      code: 'HSEQ',
      isBossDashboard: false,
      category: 'Health, Safety & Quality',
      icon: 'shield-alert',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1jXMXuX2b6HAF_U4e6tiGOzWw2adMpCyUPI5kbODxoPI/edit',
      sheetTab: 'HSEQ_Actions',
      gid: '0',
      theme: {
        bg: '#FEF2F2',
        border: '#FECACA',
        primary: '#DC2626',
        secondary: '#F87171',
        text: '#7F1D1D',
        gradient: 'from-red-600 via-rose-600 to-pink-700',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200'
      },
      actions: [
        { id: '1', title: 'abdc', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'abdc', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'hseq', category: 'Director M&O', assignedTo: 'hseq', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'abc', ackBy: '', rawColumns: { 'S_No': '2', 'Assigned Action': 'hseq', 'Action category': 'Director M&O', 'Assigned to': 'hseq', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'abc', 'Ack by': '' } },
        { id: '3', title: 'test', category: 'ACM', assignedTo: 'sdf', dueDate: '30/09/2026', status: 'Closed', closureDate: '30/09/2026', remarks: 'sdf', ackBy: '', rawColumns: { 'S_No': '3', 'Assigned Action': 'test', 'Action category': 'ACM', 'Assigned to': 'sdf', 'Target date': '30/09/2026', 'Status detail': 'Close', 'Remarks': 'sdf', 'Ack by': '' } }
      ]
    },
    {
      id: 'hcm',
      name: 'HCM',
      code: 'HCM',
      isBossDashboard: false,
      category: 'Corporate Services & People',
      icon: 'users',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1Macb6nmGzel3tseZPp61lHuL8NagAxZPZFRQnw4yCU0/edit',
      sheetTab: 'HCM_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#FDF2F8',
        border: '#FBCFE8',
        primary: '#DB2777',
        secondary: '#F472B6',
        text: '#831843',
        gradient: 'from-pink-600 via-rose-600 to-purple-700',
        badgeBg: 'bg-pink-100 text-pink-800 border-pink-200'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: 'a', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': 'a', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'ims',
      name: 'IMS',
      code: 'IMS',
      isBossDashboard: false,
      category: 'Health, Safety & Quality',
      icon: 'file-check',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1kyekkmRkxYCWxXYjKp5zCSM_NAnb6uqmCBnLcgDR6iM/edit',
      sheetTab: 'IMS_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#F5F3FF',
        border: '#DDD6FE',
        primary: '#6D28D9',
        secondary: '#A78BFA',
        text: '#4C1D95',
        gradient: 'from-violet-600 via-purple-600 to-indigo-700',
        badgeBg: 'bg-violet-100 text-violet-800 border-violet-200'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'it',
      name: 'Information Technology',
      code: 'IT',
      isBossDashboard: false,
      category: 'Corporate Services',
      icon: 'server',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1wJ-MIlSvfguUMTz06eqJ2brAYt47gtqKB_nPGrGMuaM/edit',
      sheetTab: 'IT_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#F8FAFC',
        border: '#94A3B8',
        primary: '#475569',
        secondary: '#64748B',
        text: '#0F172A',
        gradient: 'from-slate-700 via-gray-800 to-zinc-900',
        badgeBg: 'bg-slate-100 text-slate-800 border-slate-300'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'inspection',
      name: 'Inspection & Workshop Services',
      code: 'INSP',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'wrench',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1fW4P4HXfD6Yt5uvNnB2B6u4GveOBK8VSEPal-giXCIw/edit',
      sheetTab: 'INSPECTION_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#F0F9FF',
        border: '#BAE6FD',
        primary: '#0284C7',
        secondary: '#38BDF8',
        text: '#0C4A6E',
        gradient: 'from-sky-600 via-cyan-600 to-blue-700',
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-200'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'ld',
      name: 'L&D',
      code: 'LD',
      isBossDashboard: false,
      category: 'Corporate Services & People',
      icon: 'graduation-cap',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1lWSPmrx5LBX64E4vY-VWafLWwql8K7aBcxicprO3ZE0/edit',
      sheetTab: 'LD_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#FFF1F2',
        border: '#FECDD3',
        primary: '#E11D48',
        secondary: '#FB7185',
        text: '#881337',
        gradient: 'from-rose-600 via-pink-600 to-red-700',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'machinery',
      name: 'Machinery',
      code: 'MACH',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'cog',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1zRmPlFDlRijQOTboLfhukEjdFHeUR9P5pcRIUeV7rY0/edit',
      sheetTab: 'MACHINERY_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#FFF7ED',
        border: '#FED7AA',
        primary: '#EA580C',
        secondary: '#FB923C',
        text: '#7C2D12',
        gradient: 'from-orange-600 via-amber-600 to-yellow-700',
        badgeBg: 'bg-orange-100 text-orange-800 border-orange-200'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'mechanical',
      name: 'Mechanical',
      code: 'MECH',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'settings',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1gedfNYWwLaLDL85bz2PuDGi1NZP8QiwW42Vklym5i1w/edit',
      sheetTab: 'MECHANICAL_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#F8FAFC',
        border: '#CBD5E1',
        primary: '#475569',
        secondary: '#94A3B8',
        text: '#1E293B',
        gradient: 'from-slate-600 via-slate-700 to-gray-800',
        badgeBg: 'bg-slate-100 text-slate-800 border-slate-300'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'operations',
      name: 'Operations',
      code: 'OPS',
      isBossDashboard: false,
      category: 'Operations',
      icon: 'play',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/19iQ_D6k_hvKYP8-FTuBZ51yTcu3Zo2Q0VhXv67wRVZ0/edit',
      sheetTab: 'OPERATIONS_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#F0FDF4',
        border: '#86EFAC',
        primary: '#15803D',
        secondary: '#22C55E',
        text: '#14532D',
        gradient: 'from-green-600 via-emerald-600 to-teal-700',
        badgeBg: 'bg-green-100 text-green-800 border-green-200'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'reliability',
      name: 'Reliability',
      code: 'REL',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'gauge',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/15H3FZaEOczMu5_XcGo7Rs576n4CVakY0iRlvHYdbyvk/edit',
      sheetTab: 'RELIABILITY_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#FDF4FF',
        border: '#E879F9',
        primary: '#A21CAF',
        secondary: '#C026D3',
        text: '#701A75',
        gradient: 'from-purple-600 via-fuchsia-600 to-pink-700',
        badgeBg: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'scm',
      name: 'SCM',
      code: 'SCM',
      isBossDashboard: false,
      category: 'Corporate Services',
      icon: 'truck',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1SXhHYiQy21bF1g0PimScyhhyBGNch37VWTSHTgWPbP0/edit',
      sheetTab: 'SCM_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#FEFCE8',
        border: '#FEF08A',
        primary: '#CA8A04',
        secondary: '#EAB308',
        text: '#713F12',
        gradient: 'from-amber-600 via-yellow-600 to-orange-700',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200'
      },
      actions: [
        { id: '1', title: 'test scm', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'test scm', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'abcd gef', category: 'COO', assignedTo: 'abc', dueDate: '30/09/2026', status: 'Closed', closureDate: '30/09/2026', remarks: 'dsf gfgf', ackBy: '', rawColumns: { 'S_No': '2', 'Assigned Action': 'abcd gef', 'Action category': 'COO', 'Assigned to': 'abc', 'Target date': '30/09/2026', 'Status detail': 'Close', 'Remarks': 'dsf gfgf', 'Ack by': '' } },
        { id: '3', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '3', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'projects',
      name: 'Projects',
      code: 'PRJ',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'briefcase',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1Gr0IBANH6GeKMeozJywlHrQccPBdrMuJ5RRctPsQvRI/edit',
      sheetTab: 'PROJECTS',
      gid: '0',
      theme: {
        bg: '#F5F5F4',
        border: '#D6D3D1',
        primary: '#57534E',
        secondary: '#78716C',
        text: '#1C1917',
        gradient: 'from-stone-700 via-stone-800 to-zinc-900',
        badgeBg: 'bg-stone-100 text-stone-800 border-stone-300'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    },
    {
      id: 'process',
      name: 'Process',
      code: 'PROC',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'flask-conical',
      employeeName: '',
      employeeRole: '',
      employeeEmail: '',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1w3ZgX9ixr4xLbesrDIhDZcTV7iQ8wL9XQ3VivZ5YKWs/edit',
      sheetTab: 'PROCESS_SHEET_URL',
      gid: '0',
      theme: {
        bg: '#F0FDFA',
        border: '#99F6E4',
        primary: '#0D9488',
        secondary: '#2DD4BF',
        text: '#134E4A',
        gradient: 'from-teal-600 via-cyan-600 to-emerald-700',
        badgeBg: 'bg-teal-100 text-teal-800 border-teal-200'
      },
      actions: [
        { id: '1', title: 'asset', category: 'ECM', assignedTo: 'abcd', dueDate: '29/09/2026', status: 'Open', closureDate: '', remarks: '', ackBy: 'M.Afzal', rawColumns: { 'S_No': '1', 'Assigned Action': 'asset', 'Action category': 'ECM', 'Assigned to': 'abcd', 'Target date': '29/09/2026', 'Status detail': 'Open', 'Remarks': '', 'Ack by': 'M.Afzal' } },
        { id: '2', title: 'efgh', category: 'Audit committee', assignedTo: 'def', dueDate: '30/09/2026', status: 'Open', closureDate: '', remarks: 'dfd', ackBy: 'M.Afzal', rawColumns: { 'S_No': '2', 'Assigned Action': 'efgh', 'Action category': 'Audit committee', 'Assigned to': 'def', 'Target date': '30/09/2026', 'Status detail': 'Open', 'Remarks': 'dfd', 'Ack by': 'M.Afzal' } }
      ]
    }
  ];

  window.FPCL_STRATEGIC_DATA = {
    EMPLOYEES: STRATEGIC_EMPLOYEES_CONFIG
  };
})();
