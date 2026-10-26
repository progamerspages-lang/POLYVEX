import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App (reuse existing instance if already initialized)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the custom database ID if specified in configuration
const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db: Firestore = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const firestore: Firestore = db;

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// Check if Firebase configuration is present and valid
export const isFirebaseConfigured = Boolean(
  firebaseConfig &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.startsWith('TODO')
);

import { doc, getDocFromServer, setLogLevel } from 'firebase/firestore';

// Configure Firestore SDK log level to prevent internal backend retry logs from polluting console
try {
  setLogLevel('silent');
} catch {}

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
  operationType: OperationType | string;
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

/**
 * Standard Firestore error handling helper conforming to the Firebase integration skill.
 * Properly catches permission errors and formats context JSON while gracefully handling offline/transient states.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType | string,
  path: string | null
): FirestoreErrorInfo {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errorInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };

  const isPermissionError =
    (error as any)?.code === 'permission-denied' ||
    errMessage.toLowerCase().includes('missing or insufficient permissions') ||
    errMessage.toLowerCase().includes('permission-denied');

  if (isPermissionError) {
    console.error('Firestore Error: ', JSON.stringify(errorInfo));
    throw new Error(JSON.stringify(errorInfo));
  }

  console.warn(`Firestore [${operationType} on ${path || 'unknown'}]:`, errMessage);
  return errorInfo;
}

// Validate connection to Firestore on initial boot as required by Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('token-service-api'))) {
      console.warn('Firebase client operating in offline/local cache mode until connection resolves.');
    }
  }
}

if (isFirebaseConfigured && typeof window !== 'undefined') {
  testConnection();
}

export { firebaseConfig };
export default app;
