import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  Activity,
  CheckCircle2,
  TrendingUp,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

const CORRECT_PASSWORD = 'Abcd@1234';
const AUTH_STORAGE_KEY = 'app_authenticated';

// ==========================================
// 1. Modern Dark-Themed Login Screen
// ==========================================
interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Simulate brief authentication verification
    setTimeout(() => {
      if (password === CORRECT_PASSWORD) {
        // Persist session to localStorage
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
        onLoginSuccess();
      } else {
        setError('Incorrect password. Please try again.');
        setIsSubmitting(false);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0d14] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Ambient Glow & Tech Grid Accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] bg-gradient-to-tr from-indigo-600/15 via-blue-600/10 to-teal-400/10 rounded-full blur-3xl opacity-75" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>

      {/* Centered Login Card */}
      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-slate-800/90 rounded-2xl shadow-2xl p-8 sm:p-10 transition-all duration-200 z-10">
        {/* Header with Security Emblem */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4 border border-indigo-400/20 group">
            <Lock className="w-7 h-7 text-white transition-transform group-hover:scale-105 duration-200" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Executive Portal
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xs leading-relaxed">
            Please enter your access password to unlock the executive dashboard.
          </p>
        </div>

        {/* Error Alert Message */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-sm animate-in fade-in slide-in-from-top-1 duration-150">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span className="font-medium text-xs sm:text-sm">{error}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="dashboard-password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Access Password
            </label>

            <div className="relative">
              <input
                id="dashboard-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                disabled={isSubmitting}
                autoFocus
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors pr-11 text-sm disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-150 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Verifying credentials...</span>
            ) : (
              <>
                <span>Enter Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Badge */}
        <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Client-Side Protected
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Session Stored in LocalStorage
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. Main Executive Dashboard Component
// ==========================================
interface DashboardProps {
  onLogout: () => void;
}

export function MainDashboard({ onLogout }: DashboardProps) {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Executive Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-bold border border-indigo-400/20">
              <LayoutDashboard className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 tracking-tight">Executive Dashboard</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Authenticated
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Operations, Health, Safety, Environment & Strategic Portals
              </p>
            </div>
          </div>

          {/* User Controls & Logout Button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="text-slate-300 font-medium">Session Active</span>
              <span className="text-slate-500 font-mono text-[11px]">localStorage Verified</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 text-xs font-medium border border-slate-700/80 hover:border-rose-500/40 transition-colors cursor-pointer"
              title="Clear authentication session and lock dashboard"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" /> Welcome to Protected Executive Portal
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Live Operations & Executive Rollup
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Client-side password protection is active. You will remain logged in across page reloads until you explicitly click Log Out.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-mono">Password: Abcd@1234</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Safe Manhours</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">2,200,445</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero Lost Time Injury (LTI)</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>PLR Recommendations</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">93.1%</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>420 Closed / 31 In Progress</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>PSM Audit Resolution</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">62.8%</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
              <span>76 Closed / 45 Open Findings</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Executive Rollup</span>
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-white">86.7%</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-teal-400 font-medium">
              <span>496 Total Actions Closed</span>
            </div>
          </div>
        </div>

        {/* Dashboard Status & Quick Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-3">Authentication Architecture Summary</h3>
            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                Your React application implements client-side route gating directly within the root component:
              </p>
              <ul className="space-y-2 pl-4 list-disc marker:text-indigo-400">
                <li>
                  <strong className="text-white">State Initialization:</strong> The app checks <code className="text-indigo-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">localStorage.getItem('app_authenticated') === 'true'</code> synchronously when mounting.
                </li>
                <li>
                  <strong className="text-white">Password Evaluation:</strong> Submissions compare against <code className="text-amber-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">"Abcd@1234"</code>. On match, the session flag is persisted to <code className="text-emerald-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">localStorage</code>.
                </li>
                <li>
                  <strong className="text-white">Persistent Refresh:</strong> Refreshing the browser preserves the session without prompting for the password again.
                </li>
                <li>
                  <strong className="text-white">Clean Log Out:</strong> The Log Out button clears the key from <code className="text-rose-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">localStorage</code> and immediately displays the login screen.
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-2">Session Control</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Need to test the login screen or lock the terminal? Click below to immediately wipe the session token.
              </p>
            </div>
            <button
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-600/90 text-white font-medium text-xs border border-slate-700 hover:border-rose-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/40"
            >
              <LogOut className="w-4 h-4" />
              <span>Lock Terminal & Log Out</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 3. Root Application Component
// ==========================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check authentication state in localStorage on app load
  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
    setIsAuthenticated(false);
  };

  // Brief fallback while checking localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0a0d14] flex items-center justify-center text-slate-400">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render Login screen if not authenticated, otherwise render Dashboard
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return <MainDashboard onLogout={handleLogout} />;
}
