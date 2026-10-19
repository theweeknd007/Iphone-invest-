import crypto from 'crypto';
import { getDatabase, saveDatabase } from './db';
import { SecurityAuditLog, StoredUser, UserSession } from './types';

const ADMIN_MASTER_PASSWORD = process.env.ADMIN_MASTER_PASSWORD || 'AppleInvestMaster2026!';
const SESSION_DURATION_HOURS = 24 * 7; // 7 days

// Brute-force rate limiting in memory
interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): { allowed: boolean; remainingAttempts: number; retryAfterSec?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    rateLimitMap.set(key, { attempts: 1, firstAttemptAt: now });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  // Check if currently blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSec = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec };
  }

  // Reset window if expired
  if (now - record.firstAttemptAt > windowMs) {
    rateLimitMap.set(key, { attempts: 1, firstAttemptAt: now });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  // Increment attempts
  record.attempts += 1;
  if (record.attempts > maxAttempts) {
    record.blockedUntil = now + windowMs;
    const retryAfterSec = Math.ceil(windowMs / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec };
  }

  return { allowed: true, remainingAttempts: maxAttempts - record.attempts };
}

export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

/**
 * Strong password hashing using PBKDF2 (100,000 iterations, SHA-512)
 */
export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

/**
 * Timing-safe comparison for Admin master password to prevent timing attacks
 */
export function verifyAdminPassword(candidate: string): boolean {
  try {
    const validPasswords = Array.from(new Set([ADMIN_MASTER_PASSWORD]));
    for (const valid of validPasswords) {
      const expectedBuf = Buffer.from(valid);
      const candidateBuf = Buffer.from(candidate);
      if (expectedBuf.length === candidateBuf.length && crypto.timingSafeEqual(expectedBuf, candidateBuf)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Issue a cryptographically secure session token
 */
export function createSession(user: StoredUser): UserSession {
  const db = getDatabase();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000).toISOString();

  const session: UserSession = {
    token,
    userId: user.id,
    phone: user.phone,
    role: user.role || 'user',
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  // Remove old sessions for this user to limit concurrent sessions
  db.sessions = db.sessions.filter((s) => s.userId !== user.id && new Date(s.expiresAt).getTime() > Date.now());
  db.sessions.push(session);
  saveDatabase(db);

  return session;
}

export function validateSession(token?: string): UserSession | null {
  if (!token) return null;
  const db = getDatabase();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    // Expired
    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveDatabase(db);
    return null;
  }

  return session;
}

export function revokeSession(token: string): void {
  const db = getDatabase();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDatabase(db);
}

/**
 * Append to security audit log
 */
export function logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): SecurityAuditLog {
  const db = getDatabase();
  const log: SecurityAuditLog = {
    id: `sec-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    timestamp: new Date().toISOString(),
    ...event,
  };

  db.securityLogs.push(log);
  // Keep last 2000 logs
  if (db.securityLogs.length > 2000) {
    db.securityLogs = db.securityLogs.slice(-2000);
  }
  saveDatabase(db);
  return log;
}
