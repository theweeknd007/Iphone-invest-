import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { UserProfile, Purchase, Transaction, Plan, PlatformSettings, GiftVoucher } from '../types';

export async function getFirestoreUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function upsertFirestoreUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.id}`;
  try {
    const docRef = doc(db, 'users', profile.id);
    await setDoc(docRef, profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getFirestoreSettings(): Promise<PlatformSettings | null> {
  const path = 'settings/global';
  try {
    const docRef = doc(db, 'settings', 'global');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as PlatformSettings;
  } catch (error) {
    // Return null silently if settings doc not yet seeded
    return null;
  }
}

export async function saveFirestoreSettings(settings: PlatformSettings): Promise<void> {
  const path = 'settings/global';
  try {
    const docRef = doc(db, 'settings', 'global');
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createFirestoreTransaction(tx: Transaction): Promise<void> {
  const path = `transactions/${tx.id}`;
  try {
    const docRef = doc(db, 'transactions', tx.id);
    await setDoc(docRef, tx);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUserFirestoreTransactions(userId: string): Promise<Transaction[]> {
  const path = 'transactions';
  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Transaction);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createFirestorePurchase(purchase: Purchase): Promise<void> {
  const path = `purchases/${purchase.id}`;
  try {
    const docRef = doc(db, 'purchases', purchase.id);
    await setDoc(docRef, purchase);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUserFirestorePurchases(userId: string): Promise<Purchase[]> {
  const path = 'purchases';
  try {
    const q = query(
      collection(db, 'purchases'),
      where('userId', '==', userId),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Purchase);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function setupAdminDoc(uid: string, email: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    const docRef = doc(db, 'admins', uid);
    await setDoc(docRef, {
      email,
      role: 'admin',
      createdAt: new Date().toISOString(),
    }, { merge: true });
  } catch {
    // If permission denied or already configured, pass
  }
}
