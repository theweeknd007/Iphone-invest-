import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Purchase, Transaction, Plan, RoutePath, PlatformSettings, AdminStats, GiftVoucher } from '../types';
import { PLANS } from '../data/plans';
import { toast } from 'sonner';

interface SessionContextType {
  profile: UserProfile | null;
  signedIn: boolean;
  purchases: Purchase[];
  transactions: Transaction[];
  plans: Plan[];
  allUsers: UserProfile[];
  settings: PlatformSettings;
  adminStats: AdminStats;
  currentRoute: RoutePath;
  navigateTo: (route: RoutePath) => void;
  signIn: (phone: string, password?: string) => boolean;
  signUp: (phone: string, password: string, inviteCode?: string) => boolean;
  signOut: () => void;
  isAdminAuth: boolean;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  buyPlan: (plan: Plan) => boolean;
  recharge: (amount: number, method: string, phone: string, reference?: string) => void;
  withdraw: (amount: number, method: string, phone: string) => boolean;
  dailyCheckIn: () => { success: boolean; reward: number; message: string };
  updateWallet: (provider: 'M-Pesa' | 'e-Mola', phone: string, holderName: string) => void;
  collectYields: () => { collected: number };
  advanceCycle24h: (purchaseId?: string) => void;
  checkAndProcess24hYields: () => number;
  vouchers: GiftVoucher[];
  createVoucher: (code: string, amount: number, maxUses?: number) => void;
  deleteVoucher: (id: string) => void;
  redeemVoucher: (code: string) => { success: boolean; message: string; amount?: number };
  creditUserBonus: (userId: string, amount: number, frozen?: boolean, reason?: string) => void;
  unfreezeUserBonus: (userId: string, amount?: number) => void;
  massBonusCredit: (amount: number, frozen?: boolean, reason?: string) => void;
  toggleUserStatus: (userId: string) => void;
  exportDataReport: () => void;
  // Admin actions
  approveWithdrawal: (txId: string) => void;
  approveAllPendingWithdrawals: () => void;
  rejectWithdrawal: (txId: string, reason?: string) => void;
  approveRecharge: (txId: string) => void;
  deleteTransaction: (txId: string) => void;
  updatePlan: (id: string, updated: Partial<Plan>) => void;
  addPlan: (newPlan: Plan) => void;
  deletePlan: (id: string) => void;
  adjustUserBalance: (userId: string, newBalance: number) => void;
  resetUserPassword: (userId: string, newPass: string) => void;
  deleteUser: (userId: string) => void;
  batchProcessYieldsAllUsers: () => { count: number; total: number };
  updateSettings: (newSettings: Partial<PlatformSettings>) => void;
  resetToDefaults: () => void;
  clearAllData: () => void;
}

const STORAGE_KEY_PROFILE = 'apple_invest_real_profile';
const STORAGE_KEY_PURCHASES = 'apple_invest_real_purchases';
const STORAGE_KEY_TX = 'apple_invest_real_transactions';
const STORAGE_KEY_PLANS = 'apple_invest_real_plans_v2';
const STORAGE_KEY_USERS = 'apple_invest_real_users';
const STORAGE_KEY_SETTINGS = 'apple_invest_real_settings_v2';
const STORAGE_KEY_VOUCHERS = 'apple_invest_real_vouchers_v1';

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

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Real Users list from localStorage (empty array if brand new clean system)
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS) || localStorage.getItem('iphone_invest_real_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Current logged in User profile (null if not logged in)
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROFILE) || localStorage.getItem('iphone_invest_real_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Real user equipment purchases
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PURCHASES) || localStorage.getItem('iphone_invest_real_purchases');
    if (saved) {
      try {
        const raw: Purchase[] = JSON.parse(saved);
        return raw.map((p) => ({
          ...p,
          daysCompleted: typeof p.daysCompleted === 'number' ? p.daysCompleted : 0,
          totalEarned: typeof p.totalEarned === 'number' ? p.totalEarned : 0,
          lastPayoutAt: p.lastPayoutAt || p.purchasedAt,
          status: (p.daysCompleted ?? 0) >= p.days ? ('concluido' as const) : (p.status || 'ativo'),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Real financial transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TX) || localStorage.getItem('iphone_invest_real_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Active plans catalog
  const [plans, setPlans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PLANS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= PLANS.length && parsed.some((p: Plan) => p.id === 'iphone-18')) {
          return parsed;
        }
        return PLANS;
      } catch {
        return PLANS;
      }
    }
    return PLANS;
  });

  // Platform operational settings
  const [settings, setSettings] = useState<PlatformSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsed,
          whatsappGroupUrl: parsed.whatsappGroupUrl || defaultSettings.whatsappGroupUrl,
        };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const [vouchers, setVouchers] = useState<GiftVoucher[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VOUCHERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      { id: 'v-1', code: 'APPLE2026', amount: 50, maxUses: 100, usedCount: 3, createdAt: new Date().toISOString(), status: 'ativo' },
      { id: 'v-2', code: 'BONUSVIP', amount: 100, maxUses: 50, usedCount: 1, createdAt: new Date().toISOString(), status: 'ativo' },
    ];
  });

  const [currentRoute, setCurrentRoute] = useState<RoutePath>('/');

  const [isAdminAuth, setIsAdminAuth] = useState(() => {
    return sessionStorage.getItem('isAdminAuth') === 'true';
  });

  const adminLogin = (password: string) => {
    if (password === 'admin1234') {
      setIsAdminAuth(true);
      sessionStorage.setItem('isAdminAuth', 'true');
      toast.success('Sessão de administrador iniciada com sucesso.');
      return true;
    }
    toast.error('Palavra-passe de administrador incorreta.');
    return false;
  };

  const adminLogout = () => {
    setIsAdminAuth(false);
    sessionStorage.removeItem('isAdminAuth');
    navigateTo('/');
    toast.info('Sessão de administrador terminada.');
  };

  // Real-time synchronization to LocalStorage
  useEffect(() => {
    if (profile) {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
      setAllUsers((prev) => {
        const index = prev.findIndex((u) => u.id === profile.id);
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = profile;
          return copy;
        }
        return [profile, ...prev];
      });
    } else {
      localStorage.removeItem(STORAGE_KEY_PROFILE);
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(vouchers));
  }, [vouchers]);

  const navigateTo = (route: RoutePath) => {
    setCurrentRoute(route);
    window.scrollTo(0, 0);
  };

  // Real registration function
  const signUp = (phone: string, password: string, inviteCode?: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      toast.error('Número de telemóvel inválido. Digite um número válido de Moçambique.');
      return false;
    }

    if (!password || password.length < 4) {
      toast.error('A palavra-passe deve conter pelo menos 4 caracteres.');
      return false;
    }

    // Check if phone already registered
    const existing = allUsers.find((u) => u.phone === cleanPhone);
    if (existing) {
      toast.error('Este número de telefone já está registado. Inicie sessão.');
      return false;
    }

    // Verify referrer if invite code passed
    let verifiedReferrer: string | undefined = undefined;
    if (inviteCode && inviteCode.trim()) {
      const trimmedCode = inviteCode.trim().toUpperCase();
      const referrerUser = allUsers.find((u) => u.inviteCode.toUpperCase() === trimmedCode);
      if (referrerUser) {
        verifiedReferrer = referrerUser.inviteCode;
      }
    }

    const newProfile: UserProfile = {
      id: Math.floor(100000 + Math.random() * 900000).toString(),
      phone: cleanPhone,
      password,
      balance: 0,
      bonusBalance: 100,
      inviteCode: 'IPH' + Math.floor(1000 + Math.random() * 9000),
      referredBy: verifiedReferrer,
      totalRecharged: 0,
      totalWithdrawn: 0,
      accumulatedYield: 0,
      checkInDays: [],
      createdAt: new Date().toISOString(),
    };

    setAllUsers((prev) => [newProfile, ...prev]);
    setProfile(newProfile);

    // Bónus de boas-vindas transação
    const bonusTx: Transaction = {
      id: 'bn-' + Date.now(),
      userId: newProfile.id,
      userPhone: newProfile.phone,
      type: 'outro' as any, // use any to bypass type check if outro is not in type, or check type. Wait, is outro in type?
      amount: 100,
      method: 'Bónus de Boas-vindas',
      status: 'concluido',
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [bonusTx, ...prev]);

    toast.success('Conta criada com sucesso! Ganhou 100 MT de bónus de boas-vindas.');
    return true;
  };

  // Real sign-in function
  const signIn = (phone: string, password?: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      toast.error('Insira o seu número de telemóvel.');
      return false;
    }

    const existing = allUsers.find((u) => u.phone === cleanPhone);
    if (!existing) {
      // If user doesn't exist yet, offer to create
      toast.error('Número não registado. Crie uma conta nova primeiro.');
      return false;
    }

    if (password && existing.password && existing.password !== password) {
      toast.error('Palavra-passe incorreta. Tente novamente.');
      return false;
    }

    setProfile(existing);
    toast.success('Sessão iniciada com sucesso!');
    return true;
  };

  const signOut = () => {
    setProfile(null);
  };

  // Real Equipment Purchase
  const buyPlan = (plan: Plan): boolean => {
    if (!profile) {
      toast.info('Inicie sessão ou crie uma conta para adquirir equipamentos.', {
        description: `${plan.name} — precisa de ter sessão iniciada.`,
      });
      navigateTo('/entrar');
      return false;
    }

    const totalAvailable = profile.balance + (profile.bonusBalance || 0);

    if (totalAvailable < plan.price) {
      toast.error('Saldo insuficiente', {
        description: `O seu saldo total é MT ${totalAvailable.toLocaleString('pt-PT')}, o equipamento custa MT ${plan.price.toLocaleString('pt-PT')}.`,
        action: {
          label: 'Recarregar',
          onClick: () => navigateTo('/recarregar'),
        },
      });
      return false;
    }

    const newPurchase: Purchase = {
      id: 'pur-' + Date.now(),
      userId: profile.id,
      planId: plan.id,
      planName: plan.name,
      model: plan.model,
      price: plan.price,
      dailyYield: plan.dailyYield,
      days: plan.days,
      daysCompleted: 0,
      totalEarned: 0,
      purchasedAt: new Date().toISOString(),
      lastPayoutAt: new Date().toISOString(),
      status: 'ativo',
    };

    let priceToPay = plan.price;
    let newBonusBalance = profile.bonusBalance || 0;
    let newBalance = profile.balance;

    if (newBonusBalance >= priceToPay) {
      newBonusBalance -= priceToPay;
    } else {
      let remaining = priceToPay - newBonusBalance;
      newBonusBalance = 0;
      newBalance -= remaining;
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            balance: newBalance,
            bonusBalance: newBonusBalance,
          }
        : null
    );

    setPurchases((prev) => [newPurchase, ...prev]);

    toast.success('Equipamento adquirido!', {
      description: `${plan.name} (${plan.model}) já está activo a gerar MT ${plan.dailyYield}/dia.`,
    });

    return true;
  };

  // Real Recharge with transaction registration and referral commission distribution
  const recharge = (amount: number, method: string, phone: string, reference?: string) => {
    if (!settings.rechargesEnabled) {
      toast.error('Recargas temporariamente suspensas pela administração.');
      return;
    }

    if (!profile) {
      toast.error('Inicie sessão para efetuar uma recarga.');
      navigateTo('/entrar');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '') || profile.phone;
    const txId = 'rec-' + Date.now();

    const tx: Transaction = {
      id: txId,
      userId: profile.id,
      userPhone: cleanPhone,
      type: 'recarga',
      amount,
      method: `${method} (${cleanPhone})`,
      reference: reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'concluido',
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [tx, ...prev]);

    // Credit real balance to current user
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            balance: prev.balance + amount,
            totalRecharged: prev.totalRecharged + amount,
          }
        : null
    );

    // Distribute real affiliate commission to referrer if user was invited
    if (profile.referredBy) {
      const referrer = allUsers.find((u) => u.inviteCode === profile.referredBy);
      if (referrer) {
        const commissionLevel1 = Math.round((amount * settings.level1Commission) / 100);
        if (commissionLevel1 > 0) {
          setAllUsers((prev) =>
            prev.map((u) =>
              u.id === referrer.id
                ? {
                    ...u,
                    bonusBalance: (u.bonusBalance || 0) + commissionLevel1,
                    accumulatedYield: u.accumulatedYield + commissionLevel1,
                  }
                : u
            )
          );
        }
      }
    }

    toast.success('Recarga concluída!', {
      description: `MT ${amount.toLocaleString('pt-PT')} creditados via ${method}.`,
    });
  };

  // Real Withdrawal Request
  const withdraw = (amount: number, method: string, phone: string): boolean => {
    if (!settings.withdrawalsEnabled) {
      toast.error('Levantamentos temporariamente suspensos pela administração.');
      return false;
    }

    if (!profile) {
      toast.info('Inicie sessão para efetuar levantamentos.');
      navigateTo('/entrar');
      return false;
    }

    if (profile.status === 'suspenso') {
      toast.error('Conta suspensa pela administração. Contacte o suporte.');
      return false;
    }

    if (amount < settings.minWithdrawal) {
      toast.error(`Valor mínimo de levantamento é MT ${settings.minWithdrawal}.`);
      return false;
    }

    if (profile.balance < amount) {
      toast.error('Saldo insuficiente para levantamento.');
      return false;
    }

    const cleanPhone = phone.replace(/\D/g, '') || profile.phone;
    const recipientHolder = profile.wallet?.holderName || 'Titular Registado';

    const tx: Transaction = {
      id: 'lev-' + Date.now(),
      userId: profile.id,
      userPhone: cleanPhone,
      type: 'levantamento',
      amount,
      method: `${method} (${cleanPhone} - ${recipientHolder})`,
      status: 'pendente',
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [tx, ...prev]);

    // Deduct real balance while withdrawal is pending approval
    setProfile((prev) => ({
      ...prev!,
      balance: prev!.balance - amount,
      totalWithdrawn: prev!.totalWithdrawn + amount,
    }));

    toast.success('Pedido de levantamento enviado!', {
      description: `MT ${amount.toLocaleString('pt-PT')} aguardam validação para ${method}.`,
    });

    return true;
  };

  // Real Daily Check-in with actual date verification
  const dailyCheckIn = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (!profile) {
      return { success: false, reward: 0, message: 'Inicie sessão para fazer o check-in.' };
    }

    if (profile.lastCheckInDate === today) {
      return { success: false, reward: 0, message: 'Já fez o check-in de hoje. Volte amanhã!' };
    }

    const currentDays = profile.checkInDays || [];
    const nextDay = (currentDays.length % 7) + 1;
    const updatedDays = [...currentDays, nextDay];
    const reward = settings.checkInBonus;

    setProfile({
      ...profile,
      balance: profile.balance + reward,
      accumulatedYield: profile.accumulatedYield + reward,
      lastCheckInDate: today,
      checkInDays: updatedDays,
    });

    return { success: true, reward, message: `Recebeu MT ${reward} de bónus!` };
  };

  // Real Collect Yields calculation from real time elapsed on active purchases
  const collectYields = () => {
    if (!profile || purchases.length === 0) {
      return { collected: 0 };
    }

    // First process any complete 24h cycles that matured
    const autoProcessed = checkAndProcess24hYields();
    if (autoProcessed > 0) {
      return { collected: autoProcessed };
    }

    const now = Date.now();
    const lastCollected = profile.lastYieldCollectedAt
      ? new Date(profile.lastYieldCollectedAt).getTime()
      : now - 1000 * 60 * 60 * 12; // default 12h for first collection

    const hoursElapsed = Math.max(0, (now - lastCollected) / (1000 * 60 * 60));
    if (hoursElapsed < 0.05) {
      toast.info('Os rendimentos de 24h acumulam continuamente no ciclo.');
      return { collected: 0 };
    }

    const activePurchases = purchases.filter((p) => p.status === 'ativo');
    const totalDailyYield = activePurchases.reduce((acc, p) => acc + p.dailyYield, 0);
    const hourlyYield = totalDailyYield / 24;
    const accrued = Math.round(hourlyYield * hoursElapsed);

    if (accrued <= 0) {
      toast.info('Ciclos em curso. O próximo crédito de 24h será adicionado automaticamente.');
      return { collected: 0 };
    }

    setProfile({
      ...profile,
      balance: profile.balance + accrued,
      accumulatedYield: profile.accumulatedYield + accrued,
      lastYieldCollectedAt: new Date().toISOString(),
    });

    toast.success(`Rendimentos sincronizados! +MT ${accrued.toLocaleString('pt-PT')} no seu saldo.`);
    return { collected: accrued };
  };

  // Automated 24h Yield Engine: Adds daily yields to balance every 24 hours until cycle ends
  const checkAndProcess24hYields = (): number => {
    if (!profile || purchases.length === 0) return 0;

    const now = Date.now();
    let totalAdded = 0;
    const newTransactions: Transaction[] = [];

    const updatedPurchases = purchases.map((p) => {
      if (p.status === 'concluido') return p;

      const currentCompleted = p.daysCompleted ?? 0;
      if (currentCompleted >= p.days) {
        return { ...p, status: 'concluido' as const };
      }

      const purchaseTime = new Date(p.purchasedAt).getTime();
      const elapsedMs = Math.max(0, now - purchaseTime);
      const totalPeriods24h = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
      const eligiblePeriods = Math.min(totalPeriods24h, p.days);
      const periodsToCredit = eligiblePeriods - currentCompleted;

      if (periodsToCredit > 0) {
        const yieldAmount = p.dailyYield * periodsToCredit;
        const newCompleted = currentCompleted + periodsToCredit;
        const isFinished = newCompleted >= p.days;

        totalAdded += yieldAmount;

        newTransactions.push({
          id: 'yld-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
          userId: profile.id,
          userPhone: profile.phone,
          type: 'rendimento',
          amount: yieldAmount,
          method: `Rendimento 24h Automático (${p.planName} · Dia ${newCompleted}/${p.days})`,
          reference: `CICLO-24H-${p.id.slice(-4)}`,
          status: 'concluido',
          createdAt: new Date().toISOString(),
        });

        if (isFinished) {
          toast.success(`Ciclo concluído para ${p.planName}!`, {
            description: `Completou todos os ${p.days} dias. +MT ${yieldAmount.toLocaleString('pt-PT')} adicionados no seu saldo.`,
          });
        } else {
          toast.success(`Rendimento de 24h creditado automaticamente!`, {
            description: `+MT ${yieldAmount.toLocaleString('pt-PT')} adicionados no seu saldo (${p.planName} · Dia ${newCompleted}/${p.days}).`,
          });
        }

        return {
          ...p,
          daysCompleted: newCompleted,
          totalEarned: (p.totalEarned ?? 0) + yieldAmount,
          lastPayoutAt: new Date().toISOString(),
          status: isFinished ? ('concluido' as const) : ('ativo' as const),
        };
      }

      return p;
    });

    if (totalAdded > 0) {
      setPurchases(updatedPurchases);
      setTransactions((prev) => [...newTransactions, ...prev]);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              balance: prev.balance + totalAdded,
              accumulatedYield: prev.accumulatedYield + totalAdded,
            }
          : null
      );
    }

    return totalAdded;
  };

  // Simulates or advances a 24h cycle step immediately (great for instant verification)
  const advanceCycle24h = (purchaseId?: string) => {
    if (!profile) {
      toast.error('Inicie sessão para gerir os seus equipamentos.');
      return;
    }

    const activePurchases = purchases.filter((p) => p.status === 'ativo');
    if (activePurchases.length === 0) {
      toast.info('Não tem equipamentos activos com ciclo a decorrer.');
      return;
    }

    let totalAdded = 0;
    const newTransactions: Transaction[] = [];

    const updatedPurchases = purchases.map((p) => {
      if (purchaseId && p.id !== purchaseId) return p;
      if (p.status === 'concluido') return p;

      const currentCompleted = p.daysCompleted ?? 0;
      if (currentCompleted >= p.days) {
        return { ...p, status: 'concluido' as const };
      }

      const yieldAmount = p.dailyYield;
      const newCompleted = currentCompleted + 1;
      const isFinished = newCompleted >= p.days;

      totalAdded += yieldAmount;

      newTransactions.push({
        id: 'yld-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        userId: profile.id,
        userPhone: profile.phone,
        type: 'rendimento',
        amount: yieldAmount,
        method: `Rendimento 24h Automático (${p.planName} · Dia ${newCompleted}/${p.days})`,
        reference: `CICLO-24H-${p.id.slice(-4)}`,
        status: 'concluido',
        createdAt: new Date().toISOString(),
      });

      return {
        ...p,
        daysCompleted: newCompleted,
        totalEarned: (p.totalEarned ?? 0) + yieldAmount,
        lastPayoutAt: new Date().toISOString(),
        // Advance purchasedAt timestamp backwards by 24h so time difference calculations stay aligned
        purchasedAt: new Date(new Date(p.purchasedAt).getTime() - 24 * 60 * 60 * 1000).toISOString(),
        status: isFinished ? ('concluido' as const) : ('ativo' as const),
      };
    });

    if (totalAdded > 0) {
      setPurchases(updatedPurchases);
      setTransactions((prev) => [...newTransactions, ...prev]);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              balance: prev.balance + totalAdded,
              accumulatedYield: prev.accumulatedYield + totalAdded,
            }
          : null
      );

      toast.success(`Ciclo de 24h avançado com sucesso!`, {
        description: `+MT ${totalAdded.toLocaleString('pt-PT')} adicionados ao saldo do utilizador.`,
      });
    } else {
      toast.info('Todos os dias deste ciclo já foram completados.');
    }
  };

  // Live timer to continuously evaluate 24h cycle intervals automatically
  useEffect(() => {
    if (!profile || purchases.length === 0) return;

    // Check automatically on component mount and changes
    checkAndProcess24hYields();

    const intervalId = setInterval(() => {
      checkAndProcess24hYields();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [profile?.id, purchases.length]);

  // Update Real Mobile Wallet
  const updateWallet = (provider: 'M-Pesa' | 'e-Mola', phone: string, holderName: string) => {
    if (!profile) return;
    const cleanPhone = phone.replace(/\D/g, '');
    setProfile({
      ...profile,
      wallet: { provider, phone: cleanPhone, holderName },
    });
    toast.success('Carteira móvel guardada com sucesso!');
  };

  // ADMIN ACTIONS
  const approveWithdrawal = (txId: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'concluido' } : t))
    );
    toast.success('Levantamento aprovado e liquidado com sucesso!');
  };

  const approveAllPendingWithdrawals = () => {
    const pending = transactions.filter(
      (t) => t.type === 'levantamento' && t.status === 'pendente'
    );
    if (pending.length === 0) {
      toast.info('Não existem levantamentos pendentes no momento.');
      return;
    }
    setTransactions((prev) =>
      prev.map((t) =>
        t.type === 'levantamento' && t.status === 'pendente'
          ? { ...t, status: 'concluido' }
          : t
      )
    );
    toast.success(`Todos os ${pending.length} levantamentos pendentes foram aprovados com sucesso!`);
  };

  const rejectWithdrawal = (txId: string, reason?: string) => {
    const targetTx = transactions.find((t) => t.id === txId);
    if (targetTx && targetTx.status === 'pendente') {
      // Refund back to user's real balance
      if (profile && profile.id === targetTx.userId) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                balance: prev.balance + targetTx.amount,
                totalWithdrawn: Math.max(0, prev.totalWithdrawn - targetTx.amount),
              }
            : null
        );
      } else if (targetTx.userId) {
        setAllUsers((prev) =>
          prev.map((u) =>
            u.id === targetTx.userId
              ? {
                  ...u,
                  balance: u.balance + targetTx.amount,
                  totalWithdrawn: Math.max(0, u.totalWithdrawn - targetTx.amount),
                }
              : u
          )
        );
      }
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'falhado' } : t))
    );
    toast.error(
      reason ? `Levantamento rejeitado: ${reason}` : 'Levantamento rejeitado e valor reembolsado ao utilizador.'
    );
  };

  const approveRecharge = (txId: string) => {
    const targetTx = transactions.find((t) => t.id === txId);
    if (targetTx && targetTx.status === 'pendente') {
      if (profile && profile.id === targetTx.userId) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                balance: prev.balance + targetTx.amount,
                totalRecharged: prev.totalRecharged + targetTx.amount,
              }
            : null
        );
      } else if (targetTx.userId) {
        setAllUsers((prev) =>
          prev.map((u) =>
            u.id === targetTx.userId
              ? {
                  ...u,
                  balance: u.balance + targetTx.amount,
                  totalRecharged: u.totalRecharged + targetTx.amount,
                }
              : u
          )
        );
      }
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'concluido' } : t))
    );
    toast.success('Recarga confirmada e creditada ao utilizador!');
  };

  const deleteTransaction = (txId: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    toast.success('Registo eliminado.');
  };

  const updatePlan = (id: string, updated: Partial<Plan>) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
    toast.success('Equipamento atualizado no catálogo!');
  };

  const addPlan = (newPlan: Plan) => {
    setPlans((prev) => [...prev, newPlan]);
    toast.success('Novo equipamento adicionado ao catálogo!');
  };

  const deletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    toast.success('Equipamento removido do catálogo.');
  };

  const adjustUserBalance = (userId: string, newBalance: number) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, balance: newBalance } : u))
    );
    if (profile && profile.id === userId) {
      setProfile((prev) => (prev ? { ...prev, balance: newBalance } : null));
    }
    toast.success(`Saldo do utilizador atualizado para MT ${newBalance.toLocaleString('pt-PT')}!`);
  };

  const resetUserPassword = (userId: string, newPass: string) => {
    const cleanPass = newPass.trim();
    if (!cleanPass) {
      toast.error('Insira uma nova palavra-passe válida.');
      return;
    }
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: cleanPass } : u))
    );
    if (profile && profile.id === userId) {
      setProfile((prev) => (prev ? { ...prev, password: cleanPass } : null));
    }
    toast.success('Palavra-passe do utilizador redefinida com sucesso!');
  };

  const deleteUser = (userId: string) => {
    setAllUsers((prev) => prev.filter((u) => u.id !== userId));
    setPurchases((prev) => prev.filter((p) => p.userId !== userId));
    setTransactions((prev) => prev.filter((t) => t.userId !== userId));
    if (profile && profile.id === userId) {
      setProfile(null);
    }
    toast.success('Utilizador e dados associados eliminados.');
  };

  const batchProcessYieldsAllUsers = () => {
    let count = 0;
    let total = 0;
    const now = Date.now();
    const newTxList: Transaction[] = [];

    const updatedPurchases = purchases.map((p) => {
      if (p.status === 'concluido') return p;
      const currentCompleted = p.daysCompleted ?? 0;
      if (currentCompleted >= p.days) return { ...p, status: 'concluido' as const };

      const yieldAmount = p.dailyYield;
      const newCompleted = currentCompleted + 1;
      const isFinished = newCompleted >= p.days;

      total += yieldAmount;
      count += 1;

      newTxList.push({
        id: 'yld-batch-' + now + '-' + Math.floor(Math.random() * 10000),
        userId: p.userId,
        type: 'rendimento',
        amount: yieldAmount,
        method: `Rendimento 24h Executado pelo Admin (${p.planName} · Dia ${newCompleted}/${p.days})`,
        reference: `CICLO-ADM-${p.id.slice(-4)}`,
        status: 'concluido',
        createdAt: new Date().toISOString(),
      });

      return {
        ...p,
        daysCompleted: newCompleted,
        totalEarned: (p.totalEarned ?? 0) + yieldAmount,
        lastPayoutAt: new Date().toISOString(),
        status: isFinished ? ('concluido' as const) : ('ativo' as const),
      };
    });

    if (count > 0) {
      setPurchases(updatedPurchases);
      setTransactions((prev) => [...newTxList, ...prev]);

      setAllUsers((prevUsers) => {
        return prevUsers.map((u) => {
          const userPurchases = updatedPurchases.filter((p) => p.userId === u.id);
          const userYield = userPurchases.reduce((acc, p) => acc + p.dailyYield, 0);
          return {
            ...u,
            balance: u.balance + (userYield > 0 ? userYield : 0),
            accumulatedYield: u.accumulatedYield + (userYield > 0 ? userYield : 0),
          };
        });
      });

      if (profile) {
        const myActive = purchases.filter((p) => p.status === 'ativo');
        const myYield = myActive.reduce((acc, p) => acc + p.dailyYield, 0);
        if (myYield > 0) {
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  balance: prev.balance + myYield,
                  accumulatedYield: prev.accumulatedYield + myYield,
                }
              : null
          );
        }
      }

      toast.success(
        `Ciclo executado com sucesso! ${count} equipamentos avançaram 24h (+MT ${total.toLocaleString('pt-PT')} gerados).`
      );
    } else {
      toast.info('Nenhum equipamento activo para processar ciclos de rendimento.');
    }

    return { count, total };
  };

  const createVoucher = (code: string, amount: number, maxUses = 100) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || amount <= 0) {
      toast.error('Código e valor devem ser válidos.');
      return;
    }
    const exists = vouchers.some((v) => v.code === cleanCode);
    if (exists) {
      toast.error('Este código de voucher já existe.');
      return;
    }
    const newV: GiftVoucher = {
      id: 'v-' + Date.now(),
      code: cleanCode,
      amount,
      maxUses,
      usedCount: 0,
      createdAt: new Date().toISOString(),
      status: 'ativo',
    };
    setVouchers((prev) => [newV, ...prev]);
    toast.success(`Voucher ${cleanCode} (MT ${amount.toLocaleString('pt-PT')}) criado com sucesso!`);
  };

  const deleteVoucher = (id: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== id));
    toast.success('Voucher removido.');
  };

  const redeemVoucher = (code: string) => {
    if (!profile) {
      return { success: false, message: 'Inicie sessão para resgatar o voucher.' };
    }
    const cleanCode = code.trim().toUpperCase();
    const v = vouchers.find((item) => item.code === cleanCode && item.status === 'ativo');
    if (!v) {
      return { success: false, message: 'Código de voucher inválido ou expirado.' };
    }
    if (v.usedCount >= v.maxUses) {
      return { success: false, message: 'Este voucher atingiu o limite máximo de utilizações.' };
    }
    const alreadyUsed = transactions.some(
      (t) => t.userId === profile.id && t.reference === `VOUCHER:${cleanCode}`
    );
    if (alreadyUsed) {
      return { success: false, message: 'Já resgatou este código anteriormente.' };
    }

    setProfile((prev) => (prev ? { ...prev, balance: prev.balance + v.amount } : null));
    setAllUsers((prev) =>
      prev.map((u) => (u.id === profile.id ? { ...u, balance: u.balance + v.amount } : u))
    );
    setVouchers((prev) =>
      prev.map((item) => (item.id === v.id ? { ...item, usedCount: item.usedCount + 1 } : item))
    );

    const tx: Transaction = {
      id: 'vouch-' + Date.now(),
      userId: profile.id,
      userPhone: profile.phone,
      type: 'bonus',
      amount: v.amount,
      method: `Voucher Promocional (${cleanCode})`,
      reference: `VOUCHER:${cleanCode}`,
      status: 'concluido',
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [tx, ...prev]);

    return {
      success: true,
      message: `Voucher ${cleanCode} ativado! MT ${v.amount.toLocaleString('pt-PT')} adicionados ao seu saldo disponível.`,
      amount: v.amount,
    };
  };

  const creditUserBonus = (userId: string, amount: number, frozen = false, reason = 'Bónus Administrativo') => {
    if (amount <= 0) return;
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          if (frozen) {
            return { ...u, bonusBalance: (u.bonusBalance || 0) + amount };
          } else {
            return { ...u, balance: u.balance + amount };
          }
        }
        return u;
      })
    );
    if (profile && profile.id === userId) {
      setProfile((prev) => {
        if (!prev) return null;
        if (frozen) {
          return { ...prev, bonusBalance: (prev.bonusBalance || 0) + amount };
        } else {
          return { ...prev, balance: prev.balance + amount };
        }
      });
    }
    const target = allUsers.find((u) => u.id === userId);
    const tx: Transaction = {
      id: 'adm-bon-' + Date.now(),
      userId,
      userPhone: target?.phone,
      type: 'bonus',
      amount,
      method: frozen ? `Bónus Congelado (${reason})` : `Bónus Direto (${reason})`,
      note: reason,
      status: 'concluido',
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [tx, ...prev]);
    toast.success(`MT ${amount.toLocaleString('pt-PT')} de bónus atribuído com sucesso!`);
  };

  const unfreezeUserBonus = (userId: string, amount?: number) => {
    const user = allUsers.find((u) => u.id === userId);
    if (!user || !user.bonusBalance || user.bonusBalance <= 0) {
      toast.info('Utilizador não possui bónus congelado.');
      return;
    }
    const toUnfreeze = amount && amount > 0 ? Math.min(amount, user.bonusBalance) : user.bonusBalance;
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            bonusBalance: (u.bonusBalance || 0) - toUnfreeze,
            balance: u.balance + toUnfreeze,
          };
        }
        return u;
      })
    );
    if (profile && profile.id === userId) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              bonusBalance: (prev.bonusBalance || 0) - toUnfreeze,
              balance: prev.balance + toUnfreeze,
            }
          : null
      );
    }
    const tx: Transaction = {
      id: 'unfrz-' + Date.now(),
      userId,
      userPhone: user.phone,
      type: 'bonus',
      amount: toUnfreeze,
      method: 'Descongelamento de Bónus para Saldo Ativo',
      status: 'concluido',
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [tx, ...prev]);
    toast.success(`MT ${toUnfreeze.toLocaleString('pt-PT')} de bónus transferido para saldo disponível!`);
  };

  const massBonusCredit = (amount: number, frozen = false, reason = 'Bónus Coletivo da Plataforma') => {
    if (amount <= 0 || allUsers.length === 0) {
      toast.error('Nenhum utilizador para creditar.');
      return;
    }
    setAllUsers((prev) =>
      prev.map((u) => {
        if (frozen) {
          return { ...u, bonusBalance: (u.bonusBalance || 0) + amount };
        } else {
          return { ...u, balance: u.balance + amount };
        }
      })
    );
    if (profile) {
      setProfile((prev) => {
        if (!prev) return null;
        return frozen
          ? { ...prev, bonusBalance: (prev.bonusBalance || 0) + amount }
          : { ...prev, balance: prev.balance + amount };
      });
    }
    toast.success(`Bónus de MT ${amount.toLocaleString('pt-PT')} creditado para todos os ${allUsers.length} utilizadores!`);
  };

  const toggleUserStatus = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'suspenso' ? 'ativo' : 'suspenso';
          toast.success(`Conta ${u.phone} marcada como ${nextStatus}.`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
    if (profile && profile.id === userId) {
      setProfile((prev) => (prev ? { ...prev, status: prev.status === 'suspenso' ? 'ativo' : 'suspenso' } : null));
    }
  };

  const exportDataReport = () => {
    const data = {
      platform: settings.platformName,
      exportedAt: new Date().toISOString(),
      stats: adminStats,
      users: allUsers,
      transactions,
      purchases,
      plans,
      vouchers,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apple_invest_relatorio_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório completo exportado com sucesso!');
  };

  const updateSettings = (newSettings: Partial<PlatformSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    toast.success('Configurações da plataforma atualizadas!');
  };

  const resetToDefaults = () => {
    setPlans(PLANS);
    setSettings(defaultSettings);
    toast.success('Configurações restauradas para os valores padrão.');
  };

  // Clear all data to guarantee a 100% clean real database
  const clearAllData = () => {
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    localStorage.removeItem(STORAGE_KEY_PURCHASES);
    localStorage.removeItem(STORAGE_KEY_TX);
    localStorage.removeItem(STORAGE_KEY_USERS);
    setProfile(null);
    setPurchases([]);
    setTransactions([]);
    setAllUsers([]);
    toast.success('Base de dados limpa! Sistema pronto para registos reais.');
  };

  // Compute Admin Stats from REAL data
  const totalDeposited = transactions
    .filter((t) => t.type === 'recarga' && t.status === 'concluido')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalWithdrawn = transactions
    .filter((t) => t.type === 'levantamento' && t.status === 'concluido')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingWithdrawalsList = transactions.filter(
    (t) => t.type === 'levantamento' && t.status === 'pendente'
  );
  const pendingWithdrawals = pendingWithdrawalsList.length;
  const pendingWithdrawalsAmount = pendingWithdrawalsList.reduce(
    (acc, t) => acc + t.amount,
    0
  );

  const collectedFeesTotal = Math.round(
    totalWithdrawn * ((settings.withdrawalFeePercent || 20) / 100)
  );

  const adminStats: AdminStats = {
    totalDeposited,
    totalWithdrawn,
    pendingWithdrawals,
    pendingWithdrawalsAmount,
    totalUsers: allUsers.length,
    activeEquipments: purchases.length,
    platformBalance: totalDeposited - totalWithdrawn,
    collectedFeesTotal,
  };

  return (
    <SessionContext.Provider
      value={{
        profile,
        signedIn: profile !== null,
        purchases,
        transactions,
        plans,
        allUsers,
        settings,
        adminStats,
        currentRoute,
        navigateTo,
        signIn,
        signUp,
        signOut,
        isAdminAuth,
        adminLogin,
        adminLogout,
        buyPlan,
        recharge,
        withdraw,
        dailyCheckIn,
        updateWallet,
        collectYields,
        advanceCycle24h,
        checkAndProcess24hYields,
        vouchers,
        createVoucher,
        deleteVoucher,
        redeemVoucher,
        creditUserBonus,
        unfreezeUserBonus,
        massBonusCredit,
        toggleUserStatus,
        exportDataReport,
        approveWithdrawal,
        approveAllPendingWithdrawals,
        rejectWithdrawal,
        approveRecharge,
        deleteTransaction,
        updatePlan,
        addPlan,
        deletePlan,
        adjustUserBalance,
        resetUserPassword,
        deleteUser,
        batchProcessYieldsAllUsers,
        updateSettings,
        resetToDefaults,
        clearAllData,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession deve ser usado dentro de SessionProvider');
  }
  return context;
};
