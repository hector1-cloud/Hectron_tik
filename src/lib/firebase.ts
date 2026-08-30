import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  orderBy,
  limit,
  getDocFromServer,
  enableIndexedDbPersistence,
  terminate
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Singleton initialization pattern
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Use default database if firestoreDatabaseId is missing or default
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)" 
  ? firebaseConfig.firestoreDatabaseId 
  : undefined
);

export { db };
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot with detailed error handling
export async function testFirestoreConnection() {
  try {
    // Attempt to fetch a non-existent doc to verify connectivity
    await getDocFromServer(doc(db, '_internal_', 'ping'));
    console.log('[Firebase] Connection to Firestore verified.');
  } catch (error: any) {
    if (error?.message?.includes('offline') || error?.code === 'unavailable') {
      console.warn('[Firebase] Firestore is currently unreachable (Client is offline or service unavailable).');
    } else if (error?.code === 'permission-denied') {
      console.log('[Firebase] Connection verified (Firestore security rules active).');
    } else {
      console.error('[Firebase] Firestore Connection Error:', error);
    }
  }
}

// Firestore Helper Functions for HECTRON Universe
export async function saveChatLogToFirestore(data: { username: string; message: string; platform?: string }) {
  const path = 'chat_logs';
  try {
    await addDoc(collection(db, path), {
      ...data,
      platform: data.platform || 'TikTok LIVE',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function savePsycheStateToFirestore(state: {
  machiavellianism: number;
  stoicism: number;
  creativeDrive: number;
  empathy: number;
  currentEmotion: string;
}) {
  const path = 'psyche_state';
  try {
    await addDoc(collection(db, path), {
      ...state,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAutonomousDecisionToFirestore(decision: {
  decisionType: string;
  scene?: string;
  emotion?: string;
  speechText?: string;
  confidence?: number;
}) {
  const path = 'autonomous_decisions';
  try {
    await addDoc(collection(db, path), {
      ...decision,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveMetricToFirestore(metricName: string, value: number) {
  const path = 'user_metrics';
  try {
    await addDoc(collection(db, path), {
      metricName,
      value,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Game Save and Load Cloud Firestore Operations
export async function saveGameToFirestore(slotId: string, payload: any) {
  const path = `save_games`;
  try {
    const docRef = doc(db, path, slotId);
    await setDoc(docRef, {
      ...payload,
      updatedAt: new Date().toISOString(),
    });
    console.log(`[Firebase] Game state saved to Cloud Firestore in slot: ${slotId}`);
    return true;
  } catch (err) {
    console.warn(`[Firebase] Cloud save failed for slot ${slotId}, continuing with local cache.`, err);
    return false;
  }
}

export async function loadGameFromFirestore(slotId: string) {
  const path = `save_games`;
  try {
    const docRef = doc(db, path, slotId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn(`[Firebase] Cloud load failed for slot ${slotId}`, err);
    return null;
  }
}

export async function listSavedGamesFromFirestore() {
  const path = `save_games`;
  try {
    const snap = await getDocs(collection(db, path));
    const saves: any[] = [];
    snap.forEach((d) => {
      saves.push({ id: d.id, ...d.data() });
    });
    return saves;
  } catch (err) {
    console.warn(`[Firebase] Failed listing cloud saves:`, err);
    return [];
  }
}

