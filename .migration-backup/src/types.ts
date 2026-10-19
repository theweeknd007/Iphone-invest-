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
  createdAt: string;
  idempotencyKey?: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  role: 'user' | 'admin';
  balance: number;
  bonusBalance?: number;
  frozenBalance?: number;
  accumulatedYield?: number;
  totalRecharged?: number;
  totalWithdrawn?: number;
  totalEarnings?: number;
  vipLevel?: number;
  inviteCode?: string;
  referredBy?: string;
  createdAt: string;
  lastLoginAt?: string;
  walletProvider?: 'M-Pesa' | 'e-Mola';
  walletNumber?: string;
  walletName?: string;
  wallet?: {
    provider?: string;
    number?: string;
    name?: string;
    phone?: string;
    holderName?: string;
  };
  lastCheckInDate?: string;
  lastYieldCollectedAt?: string;
  checkInDays?: any;
  status?: 'ativo' | 'bloqueado' | 'suspenso';
  password?: string;
  authProvider?: string;
}

export interface StoredUser extends UserProfile {
  passwordHash?: string;
  passwordSalt?: string;
  loginAttempts?: number;
  lockoutUntil?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  price: number;
  dailyYield: number;
  days: number;
  daysRemaining?: number;
  daysCompleted?: number;
  totalEarned: number;
  createdAt?: string;
  purchasedAt?: string;
  lastYieldCollectedAt?: string;
  lastPayoutAt?: string;
  status: 'ativo' | 'concluido';
  model?: string;
}

export interface Plan {
  id: string;
  name: string;
  model: string;
  price: number;
  dailyYield: number;
  days: number;
  tone: string;
  image: string;
  badge: string;
  chip: string;
  specs: string;
  video?: string;
  mediaType?: string;
}

export interface TeamLevel {
  level: number;
  name: string;
  commissionPercent: number;
  rate?: number;
  membersCount?: number;
  members?: number;
  earnings?: number;
  commissionEarned?: number;
}

export type RoutePath =
  | 'home'
  | 'invest'
  | 'team'
  | 'chat'
  | 'account'
  | 'admin'
  | 'my-products'
  | '/'
  | '/admin'
  | '/conta'
  | '/entrar'
  | '/registo'
  | '/recarregar'
  | '/levantar'
  | '/meus-produtos'
  | '/equipa'
  | '/conta/checkin'
  | '/conta/detalhes'
  | '/conta/recargas'
  | '/conta/levantamentos'
  | '/conta/rendimentos'
  | '/conta/carteira'
  | '/suporte'
  | '/sobre'
  | '/regras'
  | '/chat';

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
  whatsappGroupUrl: string;
  supportTelegram: string;
  officialAnnouncement: string;
  broadcastAlert: {
    active: boolean;
    message: string;
    type: 'info' | 'warning' | 'success' | 'urgent';
    title: string;
  };
  mpesaOfficialNumber: string;
  mpesaOfficialName: string;
  emolaOfficialNumber: string;
  emolaOfficialName: string;
  withdrawalsEnabled: boolean;
  rechargesEnabled: boolean;
}

export interface AdminStats {
  totalUsers?: number;
  activeUsers?: number;
  totalRecharges?: number;
  totalWithdrawals?: number;
  totalWithdrawn?: number;
  totalDeposited?: number;
  totalInvested?: number;
  pendingWithdrawalsCount?: number;
  pendingWithdrawals?: number;
  pendingWithdrawalsAmount?: number;
  pendingRechargesCount?: number;
  activeEquipments?: number;
  platformBalance?: number;
  collectedFeesTotal?: number;
}

export interface GiftVoucher {
  id: string;
  code: string;
  amount: number;
  maxUses: number;
  usedCount: number;
  createdAt: string;
  status: 'ativo' | 'expirado' | 'desativado';
}

export interface PlatformNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface BalanceAdjustmentLog {
  id: string;
  adminId?: string;
  userId?: string;
  targetUserId?: string;
  userPhone?: string;
  targetUserPhone?: string;
  amount: number;
  previousBalance?: number;
  newBalance?: number;
  adminName?: string;
  type:
    | 'credit'
    | 'debit'
    | 'bonus'
    | 'freeze'
    | 'unfreeze'
    | 'aprovacao_recarga'
    | 'credito'
    | 'debito';
  reason: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId?: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  text?: string;
  content?: string;
  attachmentType?: string;
  attachmentUrl?: string;
  createdAt?: string;
  timestamp?: string;
  isRead?: boolean;
  read?: boolean;
}

export interface ChatConversation {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  userUnreadCount?: number;
  status: 'open' | 'closed';
}
