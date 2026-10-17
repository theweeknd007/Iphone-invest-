export interface Plan {
  id: string;
  name: string;
  model: string;
  price: number;
  dailyYield: number;
  days: number;
  tone: string;
  image?: string;
  badge?: string;
  specs?: string;
  chip?: string;
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
  balance: number;
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
  | '/admin';

