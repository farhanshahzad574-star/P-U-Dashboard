import React, { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  LogOut,
  RefreshCw,
  FileCode,
  Terminal,
  Server,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const MIDDLEWARE_CODE = `import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const appPassword = process.env.APP_PASSWORD;

  // Intercept all requests except static assets (_next/static, _next/image, favicon.ico)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow public access to /login and /api/auth
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    const authToken = request.cookies.get('auth_token')?.value;
    if (pathname === '/login' && authToken && authToken === appPassword) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // For all other pages, check if the auth_token cookie matches process.env.APP_PASSWORD
  const authToken = request.cookies.get('auth_token')?.value;

  if (!authToken || authToken !== appPassword) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};`;

const API_AUTH_CODE = `import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;
    const expectedPassword = process.env.APP_PASSWORD;

    if (!expectedPassword) {
      console.error('APP_PASSWORD is not set in environment variables');
      return NextResponse.json(
        { success: false, error: 'Server authentication configuration missing' },
        { status: 500 }
      );
    }

    // Verify submitted password against process.env.APP_PASSWORD
    if (!password || password !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Await cookies() in Next.js 15+ App Router
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';

    // Set HTTP-only, secure cookie named auth_token with maxAge of 7 days
    cookieStore.set('auth_token', expectedPassword, {
      httpOnly: true,
      secure: isProduction,
      maxAge: 60 * 60 * 24 * 7, // 7 days (604800s)
      path: '/',
      sameSite: 'strict',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling /api/auth request:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request payload' },
      { status: 400 }
    );
  }
}`;

const LOGIN_PAGE_CODE = `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        // Successful authentication
        router.push('/');
        router.refresh();
      } else {
        // Authentication failed (e.g., HTTP 401)
        setError(data.error || 'Incorrect password');
      }
    } catch (err) {
      setError('Failed to connect to authentication server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0d14] text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-indigo-600/15 via-blue-600/10 to-teal-400/10 rounded-full blur-3xl opacity-70" />
      </div>

      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-8 sm:p-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4 border border-indigo-400/20">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Protected Application</h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Please enter your access password to continue
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                disabled={isLoading}
                autoFocus
                placeholder="Enter access password"
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors pr-11 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-150 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? <span>Authenticating...</span> : <span>Sign In</span>}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          Protected with Edge Middleware & HTTP-only sessions
        </div>
      </div>
    </div>
  );
}`;

export default function App() {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'routes' | 'architecture'>('preview');
  const [selectedCodeFile, setSelectedCodeFile] = useState<'middleware' | 'route' | 'login'>('middleware');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Authentication Simulation State
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedAt, setAuthenticatedAt] = useState<string | null>(null);
  const [lastAttemptStatus, setLastAttemptStatus] = useState<string | null>(null);

  // Check auth status on load
  useEffect(() => {
    fetch('/api/auth/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAuthenticatedAt(new Date().toLocaleTimeString());
        }
      })
      .catch(() => {});
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSimulateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMsg('Please enter a password');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    setLastAttemptStatus('Sending POST /api/auth with JSON payload...');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setAuthenticatedAt(new Date().toLocaleTimeString());
        setLastAttemptStatus('HTTP 200 OK — auth_token cookie set with 7-day max-age');
        setPasswordInput('');
      } else {
        setErrorMsg(data.error || 'Incorrect password');
        setLastAttemptStatus(`HTTP ${response.status} — ${data.error || 'Authentication failed'}`);
      }
    } catch {
      setErrorMsg('Failed to connect to authentication server. Please try again.');
      setLastAttemptStatus('Network error occurred during POST /api/auth');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
    setAuthenticatedAt(null);
    setLastAttemptStatus('Session terminated. Cookie expired (Max-Age=0)');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-bold border border-indigo-400/20">
              <ShieldCheck className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 tracking-tight">Next.js Edge Password Auth</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Vercel Production Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lightweight route protection via Edge Middleware & HTTP-only cookies
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Interactive Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Source Files</span>
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'routes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Route Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'architecture'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Edge Spec</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TAB 1: INTERACTIVE SIMULATOR */}
        {activeTab === 'preview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left side: Context & Quick Actions */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" /> Live Verification Bench
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Test the Full Authentication Cycle
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Try logging in with both invalid passwords and the secret password{' '}
                  <code className="text-xs bg-slate-950 px-2 py-0.5 rounded text-amber-300 font-mono border border-slate-800">
                    Abcd@1234
                  </code>
                  . The form dispatches to <code className="text-xs text-indigo-300 font-mono">POST /api/auth</code> and sets the HTTP-only cookie.
                </p>

                {/* Quick Test Credentials Box */}
                <div className="mt-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-3">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Configured Environment Secret:</span>
                    <span className="text-[11px] text-emerald-400 font-mono">process.env.APP_PASSWORD</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-mono text-sm text-amber-400 font-medium">Abcd@1234</span>
                    <button
                      onClick={() => {
                        setPasswordInput('Abcd@1234');
                        setErrorMsg('');
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded transition-colors font-medium"
                    >
                      Fill Correct Password
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-mono text-sm text-rose-400 line-through">wrong-password-999</span>
                    <button
                      onClick={() => {
                        setPasswordInput('wrong-pass');
                        setErrorMsg('');
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded transition-colors font-medium"
                    >
                      Fill Incorrect Password
                    </button>
                  </div>
                </div>

                {/* Session Status Display */}
                <div className="mt-5 pt-5 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isAuthenticated ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-slate-300 font-medium">
                      Status: {isAuthenticated ? 'Authenticated (Cookie Active)' : 'Unauthenticated (Redirected)'}
                    </span>
                  </div>
                  {isAuthenticated && (
                    <button
                      onClick={handleSimulateLogout}
                      className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  )}
                </div>

                {lastAttemptStatus && (
                  <div className="mt-3 text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/60 truncate">
                    &gt; {lastAttemptStatus}
                  </div>
                )}
              </div>

              {/* Edge Middleware Execution Simulation card */}
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 text-xs space-y-3">
                <div className="font-semibold text-slate-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Edge Middleware Trace Logic</span>
                </div>
                <div className="space-y-1.5 text-slate-400 font-mono text-[11px] bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-500">// Incoming Request Evaluation</div>
                  <div>Request: <span className="text-indigo-300">GET /dashboard</span></div>
                  <div>Static asset check: <span className="text-slate-400">false (proceed)</span></div>
                  <div>Public path check (/login, /api/auth): <span className="text-slate-400">false</span></div>
                  <div>Cookie <code className="text-amber-300">auth_token</code> check: {isAuthenticated ? (
                    <span className="text-emerald-400 font-semibold">Matched APP_PASSWORD (Allow)</span>
                  ) : (
                    <span className="text-rose-400 font-semibold">Missing/Invalid (Redirect to /login)</span>
                  )}</div>
                </div>
              </div>
            </div>

            {/* Right side: The Actual Dark Themed Login Form UI */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center">
              <div className="w-full max-w-md">
                {isAuthenticated ? (
                  /* Authenticated Welcome Screen */
                  <div className="bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
                      <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Route Authorized
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-3">Access Granted</h2>
                    <p className="text-sm text-slate-400 mt-2">
                      Your <code className="text-emerald-300 font-mono text-xs">auth_token</code> cookie is active and verified by Next.js Edge Middleware. All application routes are unlocked.
                    </p>

                    <div className="mt-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Cookie Name:</span>
                        <span className="font-mono text-slate-200">auth_token</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Cookie Attributes:</span>
                        <span className="font-mono text-indigo-300">HttpOnly; Secure; SameSite=Strict</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Expiration:</span>
                        <span className="font-mono text-slate-200">7 Days (604,800s)</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Session Authenticated At:</span>
                        <span className="font-mono text-emerald-400">{authenticatedAt || 'Just now'}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setActiveTab('code')}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileCode className="w-4 h-4" />
                        <span>Inspect Middleware Code</span>
                      </button>
                      <button
                        onClick={handleSimulateLogout}
                        className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Test Re-Login</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Clean Modern Dark-Themed Login Form (Exact mirror of app/login/page.jsx) */
                  <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl p-8 sm:p-10 transition-all">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4 border border-indigo-400/20">
                        <Lock className="w-7 h-7 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight text-white">Protected Application</h1>
                      <p className="text-sm text-slate-400 mt-1.5">
                        Please enter your access password to continue
                      </p>
                    </div>

                    {/* Error Banner */}
                    {errorMsg && (
                      <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{errorMsg}</span>
                      </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSimulateLogin} className="space-y-5">
                      <div className="space-y-2">
                        <label
                          htmlFor="sim-password"
                          className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="sim-password"
                            type={showPassword ? 'text' : 'password'}
                            value={passwordInput}
                            onChange={(e) => {
                              setPasswordInput(e.target.value);
                              if (errorMsg) setErrorMsg('');
                            }}
                            disabled={isSubmitting}
                            autoFocus
                            placeholder="Enter access password"
                            className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors pr-11 disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-150 disabled:opacity-60 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Authenticating...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In</span>
                            <ArrowRight className="w-4 h-4 ml-0.5" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-8 text-center text-xs text-slate-500">
                      Protected with Edge Middleware & HTTP-only sessions
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SOURCE FILES WITH 1-CLICK COPY */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCodeFile('middleware')}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-medium transition-colors ${
                    selectedCodeFile === 'middleware'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  middleware.js (Root)
                </button>
                <button
                  onClick={() => setSelectedCodeFile('route')}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-medium transition-colors ${
                    selectedCodeFile === 'route'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  app/api/auth/route.js
                </button>
                <button
                  onClick={() => setSelectedCodeFile('login')}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-medium transition-colors ${
                    selectedCodeFile === 'login'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  app/login/page.jsx
                </button>
              </div>

              <button
                onClick={() => {
                  const content =
                    selectedCodeFile === 'middleware'
                      ? MIDDLEWARE_CODE
                      : selectedCodeFile === 'route'
                      ? API_AUTH_CODE
                      : LOGIN_PAGE_CODE;
                  handleCopy(content, selectedCodeFile);
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium border border-slate-700 transition-colors"
              >
                {copiedKey === selectedCodeFile ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copy Full Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code View Card */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
                <div className="flex items-center gap-2 font-mono">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-slate-300">
                    {selectedCodeFile === 'middleware'
                      ? 'middleware.js'
                      : selectedCodeFile === 'route'
                      ? 'app/api/auth/route.js'
                      : 'app/login/page.jsx'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {selectedCodeFile === 'middleware'
                    ? 'Edge Runtime'
                    : selectedCodeFile === 'route'
                    ? 'Node / Edge App Route'
                    : 'Client Component (React 19 / Next.js 15)'}
                </span>
              </div>
              <pre className="p-6 text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto selection:bg-indigo-500/30">
                <code>
                  {selectedCodeFile === 'middleware'
                    ? MIDDLEWARE_CODE
                    : selectedCodeFile === 'route'
                    ? API_AUTH_CODE
                    : LOGIN_PAGE_CODE}
                </code>
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: ROUTE ACCESS MATRIX */}
        {activeTab === 'routes' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">Next.js Edge Middleware Routing Matrix</h2>
              <p className="text-sm text-slate-400">
                How every incoming HTTP path is intercepted and handled by <code className="text-indigo-300 font-mono text-xs">middleware.js</code>:
              </p>
            </div>

            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-4">Path / Pattern</th>
                    <th className="p-4">Route Type</th>
                    <th className="p-4">Access Rule</th>
                    <th className="p-4">Middleware Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 font-mono text-indigo-300">/_next/static/*, /_next/image/*</td>
                    <td className="p-4 text-slate-400">Static Framework Assets</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Public / Unrestricted
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono">NextResponse.next()</td>
                  </tr>
                  <tr className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 font-mono text-indigo-300">/favicon.ico, *.svg, *.png</td>
                    <td className="p-4 text-slate-400">Static Icons & Files</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Public / Unrestricted
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono">NextResponse.next()</td>
                  </tr>
                  <tr className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 font-mono text-indigo-300">/login</td>
                    <td className="p-4 text-slate-400">Login Authentication UI</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Public
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      If already authenticated: redirect to <code className="text-amber-300 font-mono">/</code>; else allow.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 font-mono text-indigo-300">/api/auth</td>
                    <td className="p-4 text-slate-400">Authentication POST API</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Public Endpoint
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      Verifies password; sets 7-day HTTP-only cookie.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-900/30 transition-colors bg-indigo-950/20">
                    <td className="p-4 font-mono text-amber-300">/ (Root)</td>
                    <td className="p-4 text-slate-300">Dashboard / Home</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                        Protected by Cookie
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">
                      If <code className="text-indigo-300 font-mono">auth_token</code> matches <code className="text-amber-300 font-mono">APP_PASSWORD</code> allow; otherwise redirect to <code className="text-rose-300 font-mono">/login</code>.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-900/30 transition-colors bg-indigo-950/20">
                    <td className="p-4 font-mono text-amber-300">/* (All other routes & APIs)</td>
                    <td className="p-4 text-slate-300">All Application Pages</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                        Strictly Protected
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">
                      Enforced at Edge: redirects unauthorized traffic immediately to <code className="text-rose-300 font-mono">/login</code>.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ARCHITECTURE & DEPLOYMENT GUIDE */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base mb-1">Zero Flash of Content</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Next.js Edge Middleware executes on Vercel's global edge network BEFORE the page bundle is downloaded, preventing unauthenticated users from ever seeing private HTML or data.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base mb-1">Secure HTTP-Only Cookies</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The <code className="text-indigo-300 font-mono">auth_token</code> cookie cannot be accessed via client-side JavaScript (<code className="text-slate-300 font-mono">document.cookie</code>), protecting against XSS attacks.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base mb-1">Single Secret Management</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configured seamlessly through Vercel Environment Variables: set <code className="text-amber-300 font-mono">APP_PASSWORD</code> in Vercel Project Settings &gt; Environment Variables.
                </p>
              </div>
            </div>

            {/* Vercel Deployment Checklist */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-white text-base mb-3 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-indigo-400" />
                <span>Vercel Deployment Checklist</span>
              </h3>
              <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside pl-2">
                <li className="leading-relaxed">
                  <strong className="text-white">Save the 3 files:</strong> Ensure <code className="font-mono text-indigo-300">middleware.js</code> is in your project root, <code className="font-mono text-indigo-300">app/api/auth/route.js</code> is in the App Router API folder, and <code className="font-mono text-indigo-300">app/login/page.jsx</code> is in the login folder.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-white">Set Vercel Environment Variable:</strong> In your Vercel Dashboard, go to <em>Settings &rarr; Environment Variables</em>, add <code className="font-mono text-amber-300">APP_PASSWORD</code> with your value <code className="font-mono text-amber-300">Abcd@1234</code>, and select Production, Preview, and Development.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-white">Deploy:</strong> Trigger a deployment via git push or Vercel CLI. Your entire application is immediately protected at the edge network layer!
                </li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
