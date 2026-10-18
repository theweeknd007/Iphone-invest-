import { UserProfile, Purchase, Transaction, Plan, PlatformSettings, GiftVoucher, BalanceAdjustmentLog, ChatMessage, ChatConversation } from '../types';

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  eventType: 
    | 'LOGIN_SUCCESS' 
    | 'LOGIN_FAILED' 
    | 'BRUTE_FORCE_BLOCKED' 
    | 'REGISTRATION' 
    | 'UNAUTHORIZED_ACCESS_ATTEMPT' 
    | 'BALANCE_ADJUSTED' 
    | 'RECHARGE_APPROVED' 
    | 'RECHARGE_REJECTED' 
    | 'WITHDRAWAL_APPROVED' 
    | 'WITHDRAWAL_REJECTED' 
    | 'SETTINGS_CHANGED' 
    | 'DATA_RESET' 
    | 'RECONCILIATION_RUN'
    | 'DISCREPANCY_DETECTED';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  userId?: string;
  userPhone?: string;
  ipAddress?: string;
  details: string;
  operatorId?: string;
}

export interface StoredUser extends UserProfile {
  passwordHash?: string;
  passwordSalt?: string;
  loginAttempts?: number;
  lockoutUntil?: string;
}

export interface UserSession {
  token: string;
  userId: string;
  phone: string;
  role: 'user' | 'admin';
  createdAt: string;
  expiresAt: string;
}

export interface PasswordReset {
  id: string;
  userId?: string;
  identifier: string; // phone or email used to request reset
  token: string;
  expiresAt: string;
  used?: boolean;
  createdAt: string;
}

export interface DatabaseSchema {
  users: StoredUser[];
  purchases: Purchase[];
  transactions: Transaction[];
  plans: Plan[];
  vouchers: GiftVoucher[];
  adjustmentLogs: BalanceAdjustmentLog[];
  securityLogs: SecurityAuditLog[];
  settings: PlatformSettings;
  sessions: UserSession[];
  messages: ChatMessage[];
  conversations: ChatConversation[];
  passwordResets: PasswordReset[];
}
