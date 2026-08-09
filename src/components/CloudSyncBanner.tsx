import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Cloud, LogOut, RefreshCw, Sparkles, ShieldCheck, Mail, Key, UserCheck, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import {
  auth,
  signInWithGoogle,
  signInWithGuestSync,
  signUpWithEmail,
  signInWithEmail,
  resetPassword,
  logOut,
  onAuthChange,
  listenToCloudData,
  syncLocalToCloud,
  listenToVaultData,
  syncLocalToVault,
  getSavedVaultCode,
  setSavedVaultCode,
} from '../firebase';

interface CloudSyncBannerProps {
  onSyncComplete?: () => void;
  compact?: boolean;
}

export const CloudSyncBanner: React.FC<CloudSyncBannerProps> = ({ onSyncComplete, compact }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync Method State
  const [authMethod, setAuthMethod] = useState<'vault' | 'email' | 'google'>('vault');
  const [emailMode, setEmailMode] = useState<'signup' | 'signin' | 'reset'>('signup');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Vault Sync State
  const [vaultCodeInput, setVaultCodeInput] = useState(getSavedVaultCode() || '');
  const [activeVaultCode, setActiveVaultCode] = useState<string | null>(getSavedVaultCode());

  useEffect(() => {
    const unsubAuth = onAuthChange((user) => {
      setCurrentUser(user);
      if (user && !activeVaultCode) {
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
  }, [activeVaultCode]);

  // Vault Sync Listener
  useEffect(() => {
    let unsubVault: (() => void) | null = null;
    if (activeVaultCode) {
      setIsSyncing(true);
      if (!auth.currentUser) {
        signInWithGuestSync().catch(console.error);
      }
      unsubVault = listenToVaultData(activeVaultCode, () => {
        setIsSyncing(false);
        if (onSyncComplete) onSyncComplete();
      });
    }
    return () => {
      if (unsubVault) unsubVault();
    };
  }, [activeVaultCode]);

  const handleConnectVault = async (codeToConnect?: string) => {
    const targetCode = (codeToConnect || vaultCodeInput).trim().toUpperCase();
    if (!targetCode) {
      setErrorMsg('Please enter a Sync Passcode (e.g. PAIOS-8821)');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (!auth.currentUser) {
        try {
          await signInWithGuestSync();
        } catch (authErr) {
          console.warn('Guest sign-in notice (proceeding with public vault sync):', authErr);
        }
      }
      await syncLocalToVault(targetCode);
      setSavedVaultCode(targetCode);
      setActiveVaultCode(targetCode);
      setSuccessMsg(`🎉 Connected to Sync Vault [${targetCode}]! Live realtime sync is now active across Desktop, Web & Mobile.`);
    } catch (err: any) {
      console.error('Vault connection error:', err);
      setErrorMsg(`Failed to connect to Sync Vault (${err?.message || 'Check network connection'}). Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRandomVault = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'PAIOS-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setVaultCodeInput(code);
    handleConnectVault(code);
  };

  const handleDisconnectVault = () => {
    setSavedVaultCode(null);
    setActiveVaultCode(null);
    setSuccessMsg('Disconnected from Sync Vault.');
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (emailMode === 'signup') {
        if (!passwordInput || passwordInput.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        const user = await signUpWithEmail(emailInput.trim(), passwordInput, nameInput.trim());
        setCurrentUser(user);
      } else if (emailMode === 'signin') {
        if (!passwordInput) {
          throw new Error('Please enter your password.');
        }
        const user = await signInWithEmail(emailInput.trim(), passwordInput);
        setCurrentUser(user);
      } else if (emailMode === 'reset') {
        await resetPassword(emailInput.trim());
        setSuccessMsg('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleGuestSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGuestSync();
      setCurrentUser(user);
    } catch (err: any) {
      if (err.message !== 'ANONYMOUS_DISABLED') {
        console.warn('Instant guest sync notice:', err);
      }
      setErrorMsg(err.message || 'Guest Sync failed.');
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

  const isAnonymousDisabledError = errorMsg === 'ANONYMOUS_DISABLED';
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

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg === 'EMAIL_AUTH_DISABLED' ? (
        <div className="p-4 bg-amber-950/50 border border-amber-700/60 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between text-amber-300 font-bold text-sm">
            <span>⚠️ Action Required: Enable Email/Password Provider in Firebase</span>
            <span className="text-[10px] bg-amber-900/80 border border-amber-600 px-2 py-0.5 rounded font-mono">
              auth/operation-not-allowed
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed">
            Firebase Security requires the Email/Password sign-in provider to be enabled in Firebase Console before user accounts can be created with email.
          </p>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200">How to Enable Email Auth (2 Steps):</div>
            <ol className="list-decimal list-inside text-slate-300 space-y-1 font-mono text-[11px]">
              <li>Open <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">Firebase Console</a> & select project <span className="text-amber-300">consummate-particle-rxctm</span></li>
              <li>Go to <span className="text-indigo-300">Authentication</span> &rarr; <span className="text-indigo-300">Sign-in method</span> &rarr; click <span className="text-amber-300 font-bold">Email/Password</span> &rarr; toggle <span className="text-emerald-400 font-bold">Enable</span> and Save.</li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-900/40">
            <button
              onClick={handleGuestSignIn}
              disabled={loading}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Use Instant Cloud Sync Instead</span>
            </button>

            <button
              onClick={handleSignIn}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Try Google SSO
            </button>
          </div>
        </div>
      ) : isAnonymousDisabledError ? (
        <div className="p-4 bg-amber-950/50 border border-amber-700/60 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between text-amber-300 font-bold text-sm">
            <span>⚠️ Firebase Authentication Setup Needed</span>
            <span className="text-[10px] bg-amber-900/80 border border-amber-600 px-2 py-0.5 rounded font-mono">
              auth/admin-restricted-operation
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed">
            Instant Anonymous Cloud Sync requires Anonymous Auth enabled in your Firebase Console, OR your domain added under Authorized Domains for Google SSO.
          </p>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200">How to enable Cloud Sync in Firebase Console:</div>
            
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1 text-[11px]">
              <div className="font-bold text-emerald-400">Option A: Enable Google SSO Authorized Domain (Recommended)</div>
              <p className="text-slate-300 text-[10.5px]">
                In Firebase Console &rarr; <strong>Authentication</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Authorized domains</strong>, click <strong>Add domain</strong> and paste your domain:
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="font-mono text-emerald-300 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
                  {window.location.hostname}
                </span>
                <button
                  onClick={() => copyToClipboard(window.location.hostname)}
                  className="px-2 py-0.5 bg-amber-800/80 hover:bg-amber-700 text-amber-100 rounded text-[10px] font-mono transition-colors"
                >
                  {copiedDomain ? 'Copied!' : 'Copy Domain'}
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1 text-[11px]">
              <div className="font-bold text-indigo-400">Option B: Enable Anonymous Auth</div>
              <p className="text-slate-300 text-[10.5px]">
                In Firebase Console &rarr; <strong>Authentication</strong> &rarr; <strong>Sign-in method</strong> &rarr; click <strong>Anonymous</strong> &rarr; enable and save.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-1 gap-2">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Retry Google SSO
            </button>
          </div>
        </div>
      ) : isUnauthorizedDomainError ? (
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
            <div className="font-bold text-slate-200">How to Authorize Your Domain:</div>
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

            <div className="p-2.5 bg-indigo-950/60 border border-indigo-800/60 rounded-lg text-[11px] text-indigo-200 mt-2 space-y-1">
              <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Seeing "Ask a project owner for necessary permission"?</span>
              </div>
              <p className="text-slate-300 text-[10.5px]">
                If your account is not an Owner/Editor of this Firebase GCP project, ask the project owner to add <code className="text-amber-300 font-mono">{unauthorizedDomain || 'paios-4-1.vercel.app'}</code> once under Authorized Domains. In the meantime, click <strong>Instant Sync</strong> below to sync without Google SSO!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-900/40">
            <button
              onClick={handleGuestSignIn}
              disabled={loading}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Cloud Sync (No Owner Permission Needed)</span>
            </button>

            <button
              onClick={handleSignIn}
              disabled={loading}
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
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
      {/* Method Selection Tabs */}
      <div className="flex border-b border-slate-800 pb-2 gap-2 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setAuthMethod('vault')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
            authMethod === 'vault'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          <span>Sync Passcode Vault (Universal)</span>
        </button>

        <button
          type="button"
          onClick={() => setAuthMethod('email')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
            authMethod === 'email'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setAuthMethod('google')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
            authMethod === 'google'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Google SSO</span>
        </button>
      </div>

      {authMethod === 'vault' ? (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>100% Free Live Cross-Device Sync</span>
              </span>
              <span className="text-[10px] font-mono bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded">
                Zero Configuration
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Sync your Desktop app (<code className="text-emerald-300 font-mono">PAIOS Desktop.exe</code>), Mobile app (<code className="text-emerald-300 font-mono">PAIOS Mobile.apk</code>), and Web app (<code className="text-emerald-300 font-mono">paios-4-1.vercel.app</code>) using a shared <strong>Sync Passcode</strong>. No domain authorization, OAuth popup blocks, or email setup required!
            </p>
          </div>

          {activeVaultCode ? (
            <div className="p-3 bg-slate-900 border border-emerald-600/60 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Sync Passcode</div>
                  <div className="text-lg font-mono font-bold text-emerald-400 tracking-wider flex items-center gap-2">
                    <span>{activeVaultCode}</span>
                    <span className="text-[10px] font-sans bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-normal flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Realtime Active
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeVaultCode);
                      setSuccessMsg(`Copied Passcode '${activeVaultCode}' to clipboard! Paste it into your Desktop or Mobile app.`);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    Copy Passcode
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnectVault}
                    className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold rounded-lg border border-rose-800/80 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-2 border-t border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>To pair another device: open PAIOS on Desktop/Mobile, go to Cloud Sync, choose Sync Passcode, and enter <strong className="text-emerald-300 font-mono">{activeVaultCode}</strong>.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">Option A: Enter Existing Passcode</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. PAIOS-8821"
                      value={vaultCodeInput}
                      onChange={(e) => setVaultCodeInput(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => handleConnectVault()}
                      disabled={loading}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shrink-0 disabled:opacity-50"
                    >
                      Connect
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">Option B: Start New Vault</span>
                  <button
                    type="button"
                    onClick={handleGenerateRandomVault}
                    disabled={loading}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate New Passcode & Sync</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : authMethod === 'email' ? (
            <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
              <div className="p-2.5 bg-indigo-950/40 border border-indigo-800/50 rounded-lg text-indigo-200 text-[11px] flex items-center justify-between">
                <span>💡 <strong>Recommended for Desktop & Mobile Apps</strong>: Email Auth works everywhere without Google browser popup restrictions.</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200">
                  {emailMode === 'signup'
                    ? 'Create Your Cloud Sync Account'
                    : emailMode === 'signin'
                    ? 'Sign In to Your Account'
                    : 'Reset Account Password'}
                </span>

                <div className="flex items-center gap-2 text-[11px]">
                  {emailMode !== 'signup' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmailMode('signup');
                        setErrorMsg(null);
                      }}
                      className="text-indigo-400 hover:underline font-semibold"
                    >
                      Need an account? Sign Up
                    </button>
                  )}
                  {emailMode !== 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmailMode('signin');
                        setErrorMsg(null);
                      }}
                      className="text-indigo-400 hover:underline font-semibold"
                    >
                      Already registered? Sign In
                    </button>
                  )}
                </div>
              </div>

              {emailMode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Display Name / Alias</label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. Alex"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {emailMode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-slate-400">Password</label>
                    {emailMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmailMode('reset');
                          setErrorMsg(null);
                        }}
                        className="text-[10px] text-slate-500 hover:text-indigo-400"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <span>
                    {loading
                      ? 'Processing...'
                      : emailMode === 'signup'
                      ? 'Create Account & Sync'
                      : emailMode === 'signin'
                      ? 'Sign In & Sync'
                      : 'Send Password Reset Link'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  disabled={loading}
                  className="px-3 py-1.5 text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-mono transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Guest Sync</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Sign in with your Google Account for browser synchronization.
              </p>

              <div className="p-2.5 bg-amber-950/40 border border-amber-800/50 rounded-lg text-amber-200 text-[11px] leading-relaxed">
                ⚠️ <strong>Desktop & Mobile App Notice</strong>: Google intentionally blocks Google OAuth sign-in inside embedded WebViews (<code className="text-amber-100 font-mono">PAIOS Desktop.exe</code> & <code className="text-amber-100 font-mono">PAIOS Mobile.apk</code>) to prevent security risks. Please use the <strong>Email & Password</strong> tab above for seamless sign-in across Desktop, Mobile, and Web!
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5"
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

                <button
                  onClick={handleGuestSignIn}
                  disabled={loading}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Instant Cloud Sync</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
