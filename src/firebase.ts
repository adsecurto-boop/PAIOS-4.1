import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInAnonymously,
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

// Anonymous / Instant Guest Cloud Sync Sign In (Works even without domain authorization)
export async function signInWithGuestSync(): Promise<User> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (err: any) {
    console.error('Guest Sync Sign In error:', err);
    throw err;
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

// Save current local snapshot to Firestore
export async function syncLocalToCloud(userId: string): Promise<void> {
  if (isApplyingRemoteUpdate) return;
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
  } catch (err) {
    console.error('Failed to sync local data to Firestore:', err);
  }
}

// Subscribe to Firestore changes and update local storage & state
export function listenToCloudData(
  userId: string,
  onSyncComplete?: () => void
): () => void {
  const userDocRef = doc(db, 'users', userId);

  const unsubscribe = onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        isApplyingRemoteUpdate = true;

        Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
          if (cloudData[key] !== undefined && cloudData[key] !== null) {
            try {
              localStorage.setItem(storageKey, JSON.stringify(cloudData[key]));
            } catch (e) {
              console.error(`Error applying cloud update for ${storageKey}:`, e);
            }
          }
        });

        isApplyingRemoteUpdate = false;
        // Notify components of storage change
        window.dispatchEvent(new Event('paios_storage_change'));
        if (onSyncComplete) onSyncComplete();
      } else {
        // First time user document: seed cloud with current local snapshot
        syncLocalToCloud(userId);
      }
    },
    (error) => {
      console.error('Firestore listener error:', error);
      isApplyingRemoteUpdate = false;
    }
  );

  return unsubscribe;
}
