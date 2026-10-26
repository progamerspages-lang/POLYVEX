import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, isFirebaseConfigured } from './firebase.ts';
import { StudentProfile } from '../types/index.ts';

export interface UserAuthProfile {
  uid: string;
  email: string;
  displayName: string;
  onboardingCompleted: boolean;
  institution?: string;
  faculty?: string;
  department?: string;
  level?: string;
  semester?: string;
  academicSession?: string;
  preferredTheme?: 'light' | 'dark' | 'system';
  weekStartPreference?: 'Monday' | 'Sunday';
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

/**
 * Maps Firebase Auth error codes into human-friendly, concise error messages.
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected authentication error occurred.';
  const code = error.code || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please provide a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account was found with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials and try again.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completion. Please try again.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many consecutive attempts. Please wait a moment before trying again.';
    case 'auth/requires-recent-login':
      return 'This action requires recent authentication. Please sign in again.';
    default:
      if (code.includes('token') || (error.message && error.message.includes('token-service-api'))) {
        return 'Authentication token service is initializing. Please wait a moment and try again.';
      }
      return error.message || 'Authentication failed. Please try again.';
  }
}

/**
 * Signs up a new student account using Firebase Authentication.
 * Sets the display name on the auth profile and initializes their Firestore document at users/{uid}.
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<{ user: User; profile: UserAuthProfile }> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = credential.user;

  if (displayName.trim()) {
    try {
      await updateProfile(user, { displayName: displayName.trim() });
    } catch (err) {
      console.warn('Failed to update auth displayName:', err);
    }
  }

  const now = new Date().toISOString();
  const initialProfile: UserAuthProfile = {
    uid: user.uid,
    email: user.email || email.trim(),
    displayName: displayName.trim() || user.email?.split('@')[0] || 'Scholar',
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };

  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, initialProfile, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'create', `users/${user.uid}`);
  }

  return { user, profile: initialProfile };
}

/**
 * Signs in an existing student account using Email and Password.
 * Updates last login timestamp and fetches their Firestore user profile document.
 */
export async function signInWithEmail(
  email: string,
  pass: string
): Promise<{ user: User; profile: UserAuthProfile | null }> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const user = credential.user;

  let profile = await fetchUserProfile(user.uid);

  // If document doesn't exist yet, initialize it
  if (!profile) {
    const now = new Date().toISOString();
    profile = {
      uid: user.uid,
      email: user.email || email.trim(),
      displayName: user.displayName || email.split('@')[0] || 'Scholar',
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };
    try {
      await setDoc(doc(db, 'users', user.uid), profile, { merge: true });
    } catch (err) {
      handleFirestoreError(err, 'create', `users/${user.uid}`);
    }
  } else {
    // Record login time
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: new Date().toISOString(),
      });
    } catch (err) {
      // Non-critical update failure
      console.warn('Could not update lastLoginAt:', err);
    }
  }

  return { user, profile };
}

/**
 * Signs in or registers via Google OAuth popup using Firebase Auth.
 */
export async function signInWithGoogle(): Promise<{ user: User; profile: UserAuthProfile }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;

  let profile = await fetchUserProfile(user.uid);
  const now = new Date().toISOString();

  if (!profile) {
    profile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Scholar',
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };
    try {
      await setDoc(doc(db, 'users', user.uid), profile, { merge: true });
    } catch (err) {
      handleFirestoreError(err, 'create', `users/${user.uid}`);
    }
  } else {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: now,
      });
    } catch (err) {
      console.warn('Could not update lastLoginAt:', err);
    }
  }

  return { user, profile };
}

/**
 * Sends a real password recovery email via Firebase Auth.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Dispatches an email verification link to the current authenticated user.
 */
export async function dispatchEmailVerification(): Promise<void> {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

/**
 * Signs out the current Firebase user.
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Retrieves the user profile document from Firestore at users/{uid}.
 */
export async function fetchUserProfile(uid: string): Promise<UserAuthProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserAuthProfile;
    }
    return null;
  } catch (err: any) {
    const isOffline =
      err?.code === 'unavailable' ||
      err?.message?.includes('client is offline') ||
      err?.message?.includes('token-service-api');
    if (isOffline) {
      console.warn(`Firestore read on users/${uid} deferred (offline or token service initializing).`);
      return null;
    }
    handleFirestoreError(err, 'get', `users/${uid}`);
    return null;
  }
}

/**
 * Updates the user's onboarding completion status and profile details in Firestore at users/{uid}.
 */
export async function syncOnboardingCompletion(
  uid: string,
  profile: Partial<StudentProfile>
): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  const updates: Partial<UserAuthProfile> = {
    onboardingCompleted: true,
    displayName: profile.name || auth.currentUser?.displayName || 'Scholar',
    institution: profile.institution || '',
    faculty: profile.faculty || '',
    department: profile.department || '',
    level: profile.level || '',
    semester: profile.semester || '',
    academicSession: profile.academicSession || '',
    preferredTheme: profile.preferredTheme || 'dark',
    weekStartPreference: profile.weekStartPreference || 'Monday',
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(userDocRef, updates, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'update', `users/${uid}`);
    throw err;
  }
}

/**
 * Subscribes to Firebase Auth state changes.
 */
export function subscribeToAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export { auth, isFirebaseConfigured };
