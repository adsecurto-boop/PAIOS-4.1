import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  disableNetwork,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth & Firestore
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Google SSO Sign In with Popup & Redirect Fallback
export async function signInWithGoogle(): Promise<User> {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('auth/unauthorized-domain')) {
      throw new Error(
        `UNAUTHORIZED_DOMAIN|${hostname}`
      );
    }
    console.warn('Popup sign in failed or blocked, attempting redirect sign in:', error);
    try {
      await signInWithRedirect(auth, googleProvider);
      throw new Error('Redirecting to Google Sign-In...');
    } catch (redirectErr: any) {
      if (redirectErr?.code === 'auth/unauthorized-domain' || redirectErr?.message?.includes('auth/unauthorized-domain')) {
        throw new Error(
          `UNAUTHORIZED_DOMAIN|${hostname}`
        );
      }
      console.error('Google SSO Sign In error:', redirectErr);
      throw redirectErr;
    }
  }
}

// Anonymous / Instant Guest Cloud Sync Sign In (Optional fallback when enabled)
export async function signInWithGuestSync(): Promise<User | null> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (err: any) {
    // If anonymous auth is not enabled in Firebase console, gracefully return null
    // (Vault sync works independently without requiring an auth session)
    return null;
  }
}

// Email & Password Sign Up
export async function signUpWithEmail(email: string, pass: string, name?: string): Promise<User> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name && cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
    return cred.user;
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      throw new Error('This email address is already registered. Please sign in instead.');
    }
    if (err?.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters long.');
    }
    if (err?.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    if (err?.code === 'auth/operation-not-allowed') {
      throw new Error('EMAIL_AUTH_DISABLED');
    }
    console.error('Email Sign Up Error:', err);
    throw new Error(err?.message || 'Email Sign Up failed.');
  }
}

// Email & Password Sign In
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    }
    if (err?.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    if (err?.code === 'auth/operation-not-allowed') {
      throw new Error('EMAIL_AUTH_DISABLED');
    }
    console.error('Email Sign In Error:', err);
    throw new Error(err?.message || 'Email Sign In failed.');
  }
}

// Password Reset Email
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    }
    console.error('Password Reset Error:', err);
    throw new Error(err?.message || 'Failed to send password reset email.');
  }
}

// Sign Out
export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Auth State Observer
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Storage keys to sync
const STORAGE_KEYS = {
  TASKS: 'paios_tasks_v1',
  ACTIVITIES: 'paios_activities_v1',
  ACTIVE_ACTIVITY: 'paios_active_activity_v1',
  TIMELINE: 'paios_timeline_v1',
  CAPTURES: 'paios_captures_v1',
  CHECKIN: 'paios_checkin_v1',
  REVIEW: 'paios_review_v1',
  JOURNAL: 'paios_journal_v1',
  STUDY_CARDS: 'paios_study_cards_v1',
  AI_MESSAGES: 'paios_ai_messages_v1',
  SETTINGS: 'paios_settings_v1',
};

// Helper to gather all local data for sync
export function getLocalSnapshot(): Record<string, any> {
  const data: Record<string, any> = {};
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    try {
      const item = localStorage.getItem(storageKey);
      data[key] = item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Error reading ${storageKey} for cloud sync:`, e);
    }
  });
  return data;
}

// Flag to prevent recursive loop during Firestore -> Local updates
let isApplyingRemoteUpdate = false;
let quotaExceeded = typeof window !== 'undefined' && sessionStorage.getItem('paios_quota_exceeded') === 'true';
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

if (quotaExceeded) {
  try {
    disableNetwork(db).catch(() => {});
  } catch (e) {}
}

function markQuotaExceeded() {
  if (!quotaExceeded) {
    quotaExceeded = true;
    try {
      disableNetwork(db).catch(() => {});
    } catch (e) {}
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('paios_quota_exceeded', 'true');
        window.dispatchEvent(new Event('paios_quota_exceeded'));
      }
    } catch (e) {}
  }
}

export function isQuotaExceeded(): boolean {
  return quotaExceeded;
}

// Helper to get and set active vault code
export function getSavedVaultCode(): string | null {
  try {
    return localStorage.getItem('paios_vault_code');
  } catch (e) {
    return null;
  }
}

export function setSavedVaultCode(code: string | null): void {
  try {
    if (code) {
      localStorage.setItem('paios_vault_code', code.trim().toUpperCase());
    } else {
      localStorage.removeItem('paios_vault_code');
    }
  } catch (e) {
    console.error('Failed to set saved vault code:', e);
  }
}

// Auto-sync listener for local storage changes with DEBOUNCE and QUOTA GUARD
if (typeof window !== 'undefined') {
  window.addEventListener('paios_storage_change', () => {
    if (isApplyingRemoteUpdate || quotaExceeded) return;
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
      const vaultCode = getSavedVaultCode();
      if (vaultCode) {
        syncLocalToVault(vaultCode);
      } else if (auth.currentUser) {
        syncLocalToCloud(auth.currentUser.uid);
      }
    }, 1500);
  });
}

// Save current local snapshot to Firestore (User or Vault)
export async function syncLocalToCloud(userId: string): Promise<void> {
  if (isApplyingRemoteUpdate || quotaExceeded || !userId) return;
  try {
    const localData = getLocalSnapshot();
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        userId,
        email: auth.currentUser?.email || '',
        displayName: auth.currentUser?.displayName || '',
        photoURL: auth.currentUser?.photoURL || '',
        lastSyncedAt: Date.now(),
        ...localData,
      },
      { merge: true }
    );
  } catch (err: any) {
    if (
      err?.code === 'resource-exhausted' ||
      err?.message?.includes('Quota limit exceeded') ||
      err?.message?.includes('resource-exhausted')
    ) {
      markQuotaExceeded();
      console.warn('Firestore write quota limit exceeded. Switching to local-only storage until quota resets.');
    } else {
      console.error('Failed to sync local data to Firestore:', err);
    }
  }
}

// Sync local data to a Shared Vault Code (e.g. SYNC-1234)
export async function syncLocalToVault(vaultCode: string): Promise<void> {
  if (isApplyingRemoteUpdate || quotaExceeded || !vaultCode) return;
  try {
    const localData = getLocalSnapshot();
    const vaultRef = doc(db, 'sync_vaults', vaultCode.trim().toUpperCase());
    await setDoc(
      vaultRef,
      {
        vaultCode: vaultCode.trim().toUpperCase(),
        updatedBy: auth.currentUser?.uid || 'guest',
        lastSyncedAt: Date.now(),
        ...localData,
      },
      { merge: true }
    );
  } catch (err: any) {
    if (
      err?.code === 'resource-exhausted' ||
      err?.message?.includes('Quota limit exceeded') ||
      err?.message?.includes('resource-exhausted')
    ) {
      markQuotaExceeded();
      console.warn('Firestore write quota limit exceeded. Switching to local-only storage until quota resets.');
    } else {
      console.error('Failed to sync local data to Vault:', err);
    }
  }
}

// Subscribe to Firestore changes on a Shared Vault Code
export function listenToVaultData(
  vaultCode: string,
  onSyncComplete?: () => void
): () => void {
  if (!vaultCode || quotaExceeded) return () => {};
  const vaultRef = doc(db, 'sync_vaults', vaultCode.trim().toUpperCase());

  const unsubscribe = onSnapshot(
    vaultRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        isApplyingRemoteUpdate = true;

        Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
          if (cloudData[key] !== undefined) {
            try {
              if (cloudData[key] === null) {
                localStorage.removeItem(storageKey);
              } else {
                localStorage.setItem(storageKey, JSON.stringify(cloudData[key]));
              }
            } catch (e) {
              console.error(`Error applying vault update for ${storageKey}:`, e);
            }
          }
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('paios_storage_change'));
        }
        isApplyingRemoteUpdate = false;
        if (onSyncComplete) onSyncComplete();
      } else {
        // Seed new vault with current local snapshot if within quota
        if (!quotaExceeded) {
          syncLocalToVault(vaultCode);
        }
      }
    },
    (error) => {
      if (
        error?.code === 'resource-exhausted' ||
        error?.message?.includes('Quota limit exceeded') ||
        error?.message?.includes('resource-exhausted')
      ) {
        markQuotaExceeded();
      } else {
        console.error('Vault listener error:', error);
      }
      isApplyingRemoteUpdate = false;
    }
  );

  return unsubscribe;
}

// Subscribe to Firestore changes and update local storage & state
export function listenToCloudData(
  userId: string,
  onSyncComplete?: () => void
): () => void {
  if (!userId || quotaExceeded) return () => {};
  const userDocRef = doc(db, 'users', userId);

  const unsubscribe = onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        isApplyingRemoteUpdate = true;

        Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
          if (cloudData[key] !== undefined) {
            try {
              if (cloudData[key] === null) {
                localStorage.removeItem(storageKey);
              } else {
                localStorage.setItem(storageKey, JSON.stringify(cloudData[key]));
              }
            } catch (e) {
              console.error(`Error applying cloud update for ${storageKey}:`, e);
            }
          }
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('paios_storage_change'));
        }
        isApplyingRemoteUpdate = false;
        if (onSyncComplete) onSyncComplete();
      } else {
        // First time user document: seed cloud with current local snapshot if within quota
        if (!quotaExceeded) {
          syncLocalToCloud(userId);
        }
      }
    },
    (error) => {
      if (
        error?.code === 'resource-exhausted' ||
        error?.message?.includes('Quota limit exceeded') ||
        error?.message?.includes('resource-exhausted')
      ) {
        markQuotaExceeded();
      } else if (error?.code === 'permission-denied') {
        console.warn('Firestore listener permission notice:', error.message);
      } else {
        console.error('Firestore listener error:', error);
      }
      isApplyingRemoteUpdate = false;
    }
  );

  return unsubscribe;
}
