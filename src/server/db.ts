import fs from 'fs';
import path from 'path';
import { DatabaseSchema, StoredUser } from './types';
import { PLANS } from '../data/plans';
import { PlatformSettings } from '../types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'app-db.json');

const defaultSettings: PlatformSettings = {
  platformName: 'APPLE INVEST',
  minWithdrawal: 100,
  minRecharge: 100,
  withdrawalFeePercent: 20,
  checkInBonus: 5,
  level1Commission: 29,
  level2Commission: 2,
  level3Commission: 1,
  supportWhatsapp: '+258 84 000 0000',
  whatsappGroupUrl: 'https://chat.whatsapp.com/CqtV80fMgy8Eqx7iWFjaYW?s=cl&p=a&mlu=4&ilr=4',
  supportTelegram: '@appleinvest_oficial',
  officialAnnouncement: '📢 Comunicado Oficial: Rendimentos fixos de 5% ao dia. Levantamentos processados via M-Pesa e e-Mola com taxa de 20%. Participe no grupo VIP de WhatsApp!',
  broadcastAlert: {
    active: true,
    message: 'Sistema atualizado! Rendimentos de 5% ao dia garantidos. Apoio oficial 24h via WhatsApp.',
    type: 'info',
    title: 'Aviso da Administração',
  },
  mpesaOfficialNumber: '84 900 1234',
  mpesaOfficialName: 'APPLE INVEST MOZ',
  emolaOfficialNumber: '86 900 1234',
  emolaOfficialName: 'APPLE INVEST MOZ',
  withdrawalsEnabled: true,
  rechargesEnabled: true,
};

function getInitialDatabase(): DatabaseSchema {
  return {
    users: [],
    purchases: [],
    transactions: [],
    plans: PLANS,
    vouchers: [
      {
        id: 'voucher-apple2026',
        code: 'APPLE2026',
        amount: 50,
        maxUses: 100,
        usedCount: 0,
        createdAt: new Date().toISOString(),
        status: 'ativo',
      },
    ],
    adjustmentLogs: [],
    securityLogs: [],
    settings: defaultSettings,
    sessions: [],
    messages: [],
    conversations: [
      {
        id: 'conv-community',
        userId: 'community',
        userName: '👥 Comunidade Apple Invest',
        userPhone: 'Global',
        lastMessage: 'Bem-vindo à Comunidade Oficial Apple Invest! Partilhe dicas, ganhos e experiências.',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        userUnreadCount: 0,
        status: 'open',
      },
    ],
    passwordResets: [],
  };
}

// In-memory cache of the database
let dbCache: DatabaseSchema | null = null;

// Async mutex per resource key to prevent race conditions & double-spend
const lockQueues = new Map<string, Promise<void>>();

export async function withLock<T>(key: string, operation: () => Promise<T> | T): Promise<T> {
  while (lockQueues.has(key)) {
    try {
      await lockQueues.get(key);
    } catch {
      // Continue even if previous queue threw
    }
  }

  let resolveLock!: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    resolveLock = resolve;
  });
  lockQueues.set(key, lockPromise);

  try {
    return await operation();
  } finally {
    lockQueues.delete(key);
    resolveLock();
  }
}

export function initDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(data);
      // Ensure all arrays exist
      if (!dbCache!.users) dbCache!.users = [];
      if (!dbCache!.purchases) dbCache!.purchases = [];
      if (!dbCache!.transactions) dbCache!.transactions = [];
      if (!dbCache!.plans || dbCache!.plans.length === 0) dbCache!.plans = PLANS;
      if (!dbCache!.vouchers) dbCache!.vouchers = [];
      if (!dbCache!.adjustmentLogs) dbCache!.adjustmentLogs = [];
      if (!dbCache!.securityLogs) dbCache!.securityLogs = [];
      if (!dbCache!.settings) dbCache!.settings = defaultSettings;
      if (!dbCache!.sessions) dbCache!.sessions = [];
      if (!dbCache!.messages) dbCache!.messages = [];
      if (!dbCache!.conversations) dbCache!.conversations = [];
      if (!dbCache!.conversations.some((c) => c.id === 'conv-community')) {
        dbCache!.conversations.unshift({
          id: 'conv-community',
          userId: 'community',
          userName: '👥 Comunidade Apple Invest',
          userPhone: 'Global',
          lastMessage: 'Bem-vindo à Comunidade Oficial Apple Invest! Partilhe dicas, ganhos e experiências.',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          userUnreadCount: 0,
          status: 'open',
        });
      }
      if (!('passwordResets' in dbCache!)) (dbCache as any).passwordResets = [];
      return dbCache!;
    } catch (err) {
      console.error('[DB] Failed to read database, initializing new:', err);
    }
  }

  dbCache = getInitialDatabase();
  saveDatabase(dbCache);
  return dbCache;
}

export function getDatabase(): DatabaseSchema {
  if (!dbCache) {
    return initDatabase();
  }
  return dbCache;
}

/**
 * Atomic file persist using temporary file and atomic rename.
 * Prevents corrupted JSON files if process terminates during write.
 */
export function saveDatabase(data?: DatabaseSchema): void {
  const current = data || dbCache;
  if (!current) return;
  dbCache = current;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const tmpFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;
  fs.writeFileSync(tmpFile, JSON.stringify(current, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}
