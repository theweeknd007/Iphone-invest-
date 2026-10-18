export interface Plan {
  id: string;
  name: string;
  model: string;
  price: number;
  dailyYield: number;
  days: number;
  tone: string;
  image?: string;
  video?: string;
  mediaType?: 'image' | 'video';
  badge?: string;
  specs?: string;
  chip?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin' | 'system';
  recipientId: string;
  content: string;
  timestamp: string;
  read: boolean;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'file';
}

export interface ChatConversation {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: number;
  userUnreadCount: number;
  status: 'open' | 'closed';
}

export interface Purchase {
  id: string;
  userId?: string;
  planId: string;
  planName: string;
  model: string;
  price: number;
  dailyYield: number;
  days: number;
  daysCompleted: number;
  totalEarned: number;
  purchasedAt: string;
  lastPayoutAt?: string;
  nextPayoutAt?: string;
  status: 'ativo' | 'concluido';
}

export interface MobileWallet {
  provider: 'M-Pesa' | 'e-Mola';
  phone: string;
  holderName: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  password?: string;
  role?: 'user' | 'admin';
  authProvider?: 'phone' | 'google' | 'email';
  // total balance (including non-withdrawable principal). Keep for compatibility with existing code,
  // but only `profitBalance` is withdrawable per product rule.
  balance: number;
  // FLOAT/NUMBER representing funds that come from profit (withdrawable)
  profitBalance: number;
  // funds that are non-profit (e.g., principal/recharge). These must remain frozen / not withdrawable
  // unless an explicit admin action unfreezes them. Use `balance - profitBalance` to calculate non-profit portion.
  bonusBalance?: number;
  inviteCode: string;
  referredBy?: string;
  totalRecharged: number;
  totalWithdrawn: number;
  accumulatedYield: number;
  wallet?: MobileWallet;
  status?: 'ativo' | 'suspenso';
  lastCheckInDate?: string;
  lastYieldCollectedAt?: string;
  checkInDays: number[];
  createdAt?: string;
  lastLoginAt?: string;
}

export interface BalanceAdjustmentLog {
  id: string;
  targetUserId: string;
  targetUserPhone: string;
  previousBalance: number;
  newBalance: number;
  amount: number;
  type: 'credito' | 'debito' | 'ajuste' | 'bonus' | 'congelado' | 'aprovacao_recarga';
  reason: string;
  adminId: string;
  adminName: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId?: string;
  userPhone?: string;
  type: 'recarga' | 'levantamento' | 'rendimento' | 'bonus' | 'ajuste';
  amount: number;
  method: string;
  reference?: string;
  note?: string;
  status: 'pendente' | 'concluido' | 'falhado';
  // source indicates whether the transaction used profit funds or non-profit (principal) funds.
  source?: 'profit' | 'principal';
  createdAt: string;
}

export interface GiftVoucher {
  id: string;
  code: string;
  amount: number;
  maxUses: number;
  usedCount: number;
  createdAt: string;
  status: 'ativo' | 'expirado';
}

export interface TeamLevel {
  level: number;
  rate: number;
  members: number;
  earnings: number;
}

export interface BroadcastAlert {
  active: boolean;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  title?: string;
}

export interface PlatformSettings {
  platformName: string;
  minWithdrawal: number;
  minRecharge: number;
  withdrawalFeePercent: number;
  checkInBonus: number;
  level1Commission: number;
  level2Commission: number;
  level3Commission: number;
  supportWhatsapp: string;
  whatsappGroupUrl?: string;
  supportTelegram: string;
  officialAnnouncement: string;
  broadcastAlert?: BroadcastAlert;
  mpesaOfficialNumber: string;
  mpesaOfficialName: string;
  emolaOfficialNumber: string;
  emolaOfficialName: string;
  withdrawalsEnabled: boolean;
  rechargesEnabled: boolean;
}

export interface AdminStats {
  totalDeposited: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  pendingWithdrawalsAmount: number;
  totalUsers: number;
  activeEquipments: number;
  platformBalance: number;
  collectedFeesTotal: number;
}

export type RoutePath =
  | '/'
  | '/meus-produtos'
  | '/equipa'
  | '/conta'
  | '/conta/checkin'
  | '/conta/detalhes'
  | '/conta/recargas'
  | '/conta/levantamentos'
  | '/conta/rendimentos'
  | '/conta/carteira'
  | '/recarregar'
  | '/levantar'
  | '/suporte'
  | '/sobre'
  | '/regras'
  | '/entrar'
  | '/registo'
  | '/admin'
  | '/chat';

// --- New types for withdrawals ---

export type WithdrawalStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userPhone?: string;
  amount: number;
  status: WithdrawalStatus;
  method: string; // e.g., 'M-Pesa', 'e-Mola'
  destination?: string; // phone/account where to send
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
  source: 'profit'; // by rule: only profit withdrawals are allowed
}
