import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Cloud, LogOut, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { auth, signInWithGoogle, logOut, onAuthChange, listenToCloudData, syncLocalToCloud } from '../firebase';

interface CloudSyncBannerProps {
  onSyncComplete?: () => void;
  compact?: boolean;
}

export const CloudSyncBanner: React.FC<CloudSyncBannerProps> = ({ onSyncComplete, compact }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthChange((user) => {
      setCurrentUser(user);
      if (user) {
        setIsSyncing(true);
        // Start listening to cloud updates for this user
        const unsubCloud = listenToCloudData(user.uid, () => {
          setIsSyncing(false);
          if (onSyncComplete) onSyncComplete();
        });
        return () => unsubCloud();
      }
    });

    return () => unsubAuth();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      setCurrentUser(user);
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setErrorMsg(err.message || 'Google SSO sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logOut();
      setCurrentUser(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualForceSync = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    await syncLocalToCloud(currentUser.uid);
    setTimeout(() => setIsSyncing(false), 800);
  };

  const [copiedDomain, setCopiedDomain] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const isUnauthorizedDomainError = Boolean(errorMsg && errorMsg.startsWith('UNAUTHORIZED_DOMAIN|'));
  const unauthorizedDomain = (isUnauthorizedDomainError && errorMsg) ? errorMsg.split('|')[1] : '';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {currentUser ? (
          <div className="flex items-center gap-2 bg-slate-800/90 border border-emerald-800/60 rounded-xl px-2.5 py-1 text-xs">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="User" className="w-5 h-5 rounded-full border border-emerald-500/50" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white">
                {currentUser.displayName ? currentUser.displayName[0] : 'U'}
              </div>
            )}
            <div className="hidden md:flex flex-col">
              <span className="text-[11px] font-semibold text-slate-200 leading-tight truncate max-w-[100px]">
                {currentUser.displayName || currentUser.email}
              </span>
              <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Cloud Synced
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1 hover:bg-slate-700 text-slate-400 hover:text-rose-300 rounded transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Connecting...' : 'Google SSO'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
              <span>Google SSO & Multi-Device Realtime Sync</span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
                Firestore
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Synchronize tasks, activities, cards, and journals seamlessly across Windows Desktop (.exe), Android (.apk), and Web.
            </p>
          </div>
        </div>
      </div>

      {isUnauthorizedDomainError ? (
        <div className="p-4 bg-amber-950/50 border border-amber-700/60 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between text-amber-300 font-bold text-sm">
            <span>⚠️ Action Required: Add Authorized Domain to Firebase Console</span>
            <span className="text-[10px] bg-amber-900/80 border border-amber-600 px-2 py-0.5 rounded font-mono">
              auth/unauthorized-domain
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed">
            Firebase Security requires domain authorization for Google SSO popups. Your domain <code className="text-amber-300 font-mono bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">{unauthorizedDomain || 'paios-4-1.vercel.app'}</code> needs to be added to Authorized Domains in Firebase.
          </p>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200">Quick 3-Step Setup:</div>
            <ol className="list-decimal list-inside text-slate-300 space-y-1 font-mono text-[11px]">
              <li>Open <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">Firebase Console</a> & select project <span className="text-amber-300">consummate-particle-rxctm</span></li>
              <li>Navigate to <span className="text-indigo-300">Authentication</span> &rarr; <span className="text-indigo-300">Settings</span> &rarr; <span className="text-indigo-300">Authorized domains</span></li>
              <li>Click <span className="text-emerald-400 font-bold">Add domain</span> and paste your domain(s):</li>
            </ol>
            
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-mono text-emerald-300 bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[11px]">
                {unauthorizedDomain || window.location.hostname}
              </span>
              <button
                onClick={() => copyToClipboard(unauthorizedDomain || window.location.hostname)}
                className="px-2.5 py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-100 rounded text-[11px] font-mono transition-colors"
              >
                {copiedDomain ? 'Copied Domain!' : 'Copy Domain'}
              </button>
              
              <span className="font-mono text-emerald-300 bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[11px]">
                paios-4-1.vercel.app
              </span>
              <button
                onClick={() => copyToClipboard('paios-4-1.vercel.app')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-mono transition-colors"
              >
                Copy Vercel Domain
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSignIn}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-colors"
            >
              Retry Google SSO
            </button>
          </div>
        </div>
      ) : errorMsg ? (
        <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
          {errorMsg}
        </div>
      ) : null}

      {currentUser ? (
        <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-emerald-500/80 shadow" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-base">
                  {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{currentUser.displayName || 'Google User'}</span>
                  <span className="text-[10px] font-mono bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Synced
                  </span>
                </div>
                <span className="text-xs text-slate-400">{currentUser.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleManualForceSync}
                disabled={isSyncing}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold rounded-lg border border-rose-800/80 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-2 border-t border-emerald-900/40">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Your PAIOS data is protected by Google Auth and Firestore security rules. Any change made in Desktop or Mobile immediately mirrors here!
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Sign in with your Google Account to pair your Windows Desktop app (<code className="text-indigo-300 font-mono">PAIOS Desktop.exe</code>) and Android app (<code className="text-green-300 font-mono">PAIOS Mobile.apk</code>).
          </p>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Connecting Google SSO...' : 'Sign in with Google SSO'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
