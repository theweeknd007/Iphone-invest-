import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import {
  UserProfile,
  Purchase,
  Transaction,
  Plan,
  PlatformSettings,
  GiftVoucher,
  ChatMessage,
  ChatConversation,
  BalanceAdjustmentLog,
} from '../types';

// ==========================================
// 1. User Profiles & Balances
// ==========================================

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

export function subscribeFirestoreUserProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe {
  const docRef = doc(db, 'users', userId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserProfile);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn('[Firestore] Profile subscription warning:', err);
    }
  );
}

export async function getAllFirestoreUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeAllFirestoreUsers(callback: (users: UserProfile[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      const users = snap.docs.map((d) => d.data() as UserProfile);
      callback(users);
    },
    (err) => {
      console.warn('[Firestore] Users list subscription warning:', err);
    }
  );
}

// ==========================================
// 2. Platform Settings
// ==========================================

export async function getFirestoreSettings(): Promise<PlatformSettings | null> {
  const path = 'settings/global';
  try {
    const docRef = doc(db, 'settings', 'global');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as PlatformSettings;
  } catch {
    return null;
  }
}

export async function saveFirestoreSettings(settings: PlatformSettings): Promise<void> {
  const path = 'settings/global';
  try {
    const docRef = doc(db, 'settings', 'global');
    await setDoc(docRef, settings, { merge: true });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      console.warn('[Firestore] Escrita em settings/global requer privilégios de administrador.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeFirestoreSettings(
  callback: (settings: PlatformSettings) => void
): Unsubscribe {
  const docRef = doc(db, 'settings', 'global');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as PlatformSettings);
      }
    },
    (err) => {
      console.warn('[Firestore] Settings subscription warning:', err);
    }
  );
}

// ==========================================
// 3. Transactions (Financial Ledger)
// ==========================================

export async function createFirestoreTransaction(tx: Transaction): Promise<void> {
  const path = `transactions/${tx.id}`;
  try {
    const docRef = doc(db, 'transactions', tx.id);
    await setDoc(docRef, tx);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateFirestoreTransaction(
  txId: string,
  updates: Partial<Transaction>
): Promise<void> {
  const path = `transactions/${txId}`;
  try {
    const docRef = doc(db, 'transactions', txId);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getUserFirestoreTransactions(userId: string): Promise<Transaction[]> {
  const path = 'transactions';
  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Transaction);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeUserFirestoreTransactions(
  userId: string,
  callback: (txs: Transaction[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    limit(100)
  );
  return onSnapshot(
    q,
    (snap) => {
      const txs = snap.docs.map((d) => d.data() as Transaction);
      callback(txs);
    },
    (err) => {
      console.warn('[Firestore] User transactions subscription error:', err);
    }
  );
}

export function subscribeAllFirestoreTransactions(
  callback: (txs: Transaction[]) => void
): Unsubscribe {
  const q = query(collection(db, 'transactions'), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const txs = snap.docs.map((d) => d.data() as Transaction);
      callback(txs);
    },
    (err) => {
      console.warn('[Firestore] Admin transactions subscription error:', err);
    }
  );
}

// ==========================================
// 4. Purchases (Equipment Investments)
// ==========================================

export async function createFirestorePurchase(purchase: Purchase): Promise<void> {
  const path = `purchases/${purchase.id}`;
  try {
    const docRef = doc(db, 'purchases', purchase.id);
    await setDoc(docRef, purchase);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateFirestorePurchase(
  purchaseId: string,
  updates: Partial<Purchase>
): Promise<void> {
  const path = `purchases/${purchaseId}`;
  try {
    const docRef = doc(db, 'purchases', purchaseId);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getUserFirestorePurchases(userId: string): Promise<Purchase[]> {
  const path = 'purchases';
  try {
    const q = query(
      collection(db, 'purchases'),
      where('userId', '==', userId),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Purchase);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeUserFirestorePurchases(
  userId: string,
  callback: (purchases: Purchase[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'purchases'),
    where('userId', '==', userId),
    limit(100)
  );
  return onSnapshot(
    q,
    (snap) => {
      const purchases = snap.docs.map((d) => d.data() as Purchase);
      callback(purchases);
    },
    (err) => {
      console.warn('[Firestore] Purchases subscription warning:', err);
    }
  );
}

export function subscribeAllFirestorePurchases(
  callback: (purchases: Purchase[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'purchases'),
    (snap) => {
      const purchases = snap.docs.map((d) => d.data() as Purchase);
      callback(purchases);
    },
    (err) => {
      console.warn('[Firestore] All purchases subscription warning:', err);
    }
  );
}

// ==========================================
// 5. Plans Catalog
// ==========================================

export async function getFirestorePlans(): Promise<Plan[]> {
  try {
    const snap = await getDocs(collection(db, 'plans'));
    return snap.docs.map((d) => d.data() as Plan);
  } catch {
    return [];
  }
}

export async function saveFirestorePlan(plan: Plan): Promise<void> {
  const path = `plans/${plan.id}`;
  try {
    const docRef = doc(db, 'plans', plan.id);
    await setDoc(docRef, plan, { merge: true });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      console.warn('[Firestore] Escrita de planos requer privilégios de administrador.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFirestorePlan(planId: string): Promise<void> {
  const path = `plans/${planId}`;
  try {
    await deleteDoc(doc(db, 'plans', planId));
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      console.warn('[Firestore] Eliminação de planos requer privilégios de administrador.');
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeFirestorePlans(callback: (plans: Plan[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'plans'),
    (snap) => {
      const plans = snap.docs.map((d) => d.data() as Plan);
      callback(plans);
    },
    (err) => {
      console.warn('[Firestore] Plans subscription warning:', err);
    }
  );
}

// ==========================================
// 6. Gift Vouchers
// ==========================================

export async function getFirestoreVouchers(): Promise<GiftVoucher[]> {
  try {
    const snap = await getDocs(collection(db, 'vouchers'));
    return snap.docs.map((d) => d.data() as GiftVoucher);
  } catch {
    return [];
  }
}

export async function saveFirestoreVoucher(voucher: GiftVoucher): Promise<void> {
  const path = `vouchers/${voucher.id}`;
  try {
    const docRef = doc(db, 'vouchers', voucher.id);
    await setDoc(docRef, voucher, { merge: true });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      console.warn('[Firestore] Escrita de vouchers requer privilégios de administrador.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFirestoreVoucher(voucherId: string): Promise<void> {
  const path = `vouchers/${voucherId}`;
  try {
    await deleteDoc(doc(db, 'vouchers', voucherId));
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      console.warn('[Firestore] Eliminação de vouchers requer privilégios de administrador.');
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeFirestoreVouchers(callback: (vouchers: GiftVoucher[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'vouchers'),
    (snap) => {
      const vouchers = snap.docs.map((d) => d.data() as GiftVoucher);
      callback(vouchers);
    },
    (err) => {
      console.warn('[Firestore] Vouchers subscription warning:', err);
    }
  );
}

// ==========================================
// 7. Chat Support & Messages (Real-Time)
// ==========================================

export async function sendFirestoreChatMessage(message: ChatMessage): Promise<void> {
  const path = `messages/${message.id}`;
  try {
    const docRef = doc(db, 'messages', message.id);
    await setDoc(docRef, message);

    // Also update parent conversation
    const convRef = doc(db, 'conversations', message.conversationId);
    await setDoc(
      convRef,
      {
        id: message.conversationId,
        userId: message.senderRole === 'user' ? message.senderId : message.recipientId,
        lastMessage: message.content || 'Ficheiro anexo',
        lastMessageAt: message.timestamp || new Date().toISOString(),
        status: 'open',
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeFirestoreChatMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    limit(100)
  );

  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map((d) => d.data() as ChatMessage);
      msgs.sort(
        (a, b) =>
          new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
      );
      callback(msgs);
    },
    (err) => {
      console.warn('[Firestore] Messages subscription warning:', err);
    }
  );
}

export function subscribeFirestoreConversations(
  userId: string,
  isAdmin: boolean,
  callback: (conversations: ChatConversation[]) => void
): Unsubscribe {
  let q;
  if (isAdmin) {
    q = query(collection(db, 'conversations'), limit(50));
  } else {
    q = query(
      collection(db, 'conversations'),
      where('userId', '==', userId),
      limit(20)
    );
  }

  return onSnapshot(
    q,
    (snap) => {
      const convs = snap.docs.map((d) => d.data() as ChatConversation);
      callback(convs);
    },
    (err) => {
      console.warn('[Firestore] Conversations subscription warning:', err);
    }
  );
}

// ==========================================
// 8. Admin Setup Helper
// ==========================================

export async function setupAdminDoc(uid: string, email: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    const docRef = doc(db, 'admins', uid);
    await setDoc(
      docRef,
      {
        email,
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // Graceful fallback
  }
}

// ==========================================
// 9. Safe, Non-Destructive Data Migration Helper
// ==========================================

export async function migrateLocalDbToFirestore(
  localDb: {
    users?: UserProfile[];
    plans?: Plan[];
    vouchers?: GiftVoucher[];
    settings?: PlatformSettings;
    transactions?: Transaction[];
    purchases?: Purchase[];
  },
  isAdmin: boolean = false
): Promise<{
  migratedUsers: number;
  migratedPlans: number;
  migratedVouchers: number;
  errors: string[];
}> {
  const results = {
    migratedUsers: 0,
    migratedPlans: 0,
    migratedVouchers: 0,
    errors: [] as string[],
  };

  // Only perform writes if authenticated as an administrator to prevent unauthenticated write errors
  if (!isAdmin) {
    return results;
  }

  try {
    // 1. Migrate settings if not present
    if (localDb.settings) {
      const existingSettings = await getFirestoreSettings();
      if (!existingSettings) {
        await saveFirestoreSettings(localDb.settings);
      }
    }

    // 2. Migrate Plans
    if (localDb.plans && localDb.plans.length > 0) {
      const existingPlans = await getFirestorePlans();
      const existingIds = new Set(existingPlans.map((p) => p.id));
      for (const plan of localDb.plans) {
        if (!existingIds.has(plan.id)) {
          await saveFirestorePlan(plan);
          results.migratedPlans++;
        }
      }
    }

    // 3. Migrate Vouchers
    if (localDb.vouchers && localDb.vouchers.length > 0) {
      const existingVouchers = await getFirestoreVouchers();
      const existingCodes = new Set(existingVouchers.map((v) => v.code));
      for (const voucher of localDb.vouchers) {
        if (!existingCodes.has(voucher.code)) {
          await saveFirestoreVoucher(voucher);
          results.migratedVouchers++;
        }
      }
    }

    // 4. Migrate Users safely (never overwrite existing balances)
    if (localDb.users && localDb.users.length > 0) {
      for (const u of localDb.users) {
        const existing = await getFirestoreUserProfile(u.id);
        if (!existing) {
          await upsertFirestoreUserProfile(u);
          results.migratedUsers++;
        }
      }
    }
  } catch (err: any) {
    results.errors.push(err?.message || String(err));
  }

  return results;
}
