import React, { useState, useRef } from 'react';
import {
  LayoutDashboard,
  BadgeDollarSign,
  Wallet,
  Smartphone,
  Users,
  Settings,
  ArrowLeft,
  Check,
  X,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Search,
  DollarSign,
  ShieldCheck,
  CreditCard,
  Save,
  Coins,
  FastForward,
  Gift,
  Download,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  TrendingUp,
  Clock,
  Sparkles,
  PieChart,
  Volume2,
  KeyRound,
  History,
  CheckCheck,
  FileSpreadsheet,
  MessageSquare,
  Video,
  Image as ImageIcon,
  Upload,
  Paperclip,
  Send,
  Headphones,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useChat } from '../context/ChatContext';
import { apiRequest, getStoredToken } from '../api/client';
import { formatCurrency, formatDate } from '../data/plans';
import { Plan, PlatformSettings, UserProfile, Transaction } from '../types';
import { toast } from 'sonner';

type AdminTab =
  | 'overview'
  | 'financial'
  | 'withdrawals'
  | 'recharges'
  | 'plans'
  | 'users'
  | 'bonus'
  | 'vouchers'
  | 'cycles'
  | 'broadcast'
  | 'audit'
  | 'settings'
  | 'chat';

export const AdminView: React.FC = () => {
  const {
    navigateTo,
    adminStats,
    transactions,
    purchases,
    plans,
    allUsers,
    settings,
    vouchers,
    createVoucher,
    deleteVoucher,
    creditUserBonus,
    unfreezeUserBonus,
    massBonusCredit,
    toggleUserStatus,
    exportDataReport,
    advanceCycle24h,
    approveWithdrawal,
    approveAllPendingWithdrawals,
    rejectWithdrawal,
    approveRecharge,
    rejectRecharge,
    adjustmentLogs,
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
    checkAndProcess24hYields,
    isAdminAuth,
    adminLogin,
    adminLogout,
  } = useSession();

  const { conversations, totalUnreadCount, startConversationWithUser } = useChat();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [adminPassword, setAdminPassword] = useState('');

  // Bonus Modal state
  const [bonusModalUser, setBonusModalUser] = useState<UserProfile | null>(null);
  const [bonusAmountInput, setBonusAmountInput] = useState<string>('100');
  const [bonusIsFrozen, setBonusIsFrozen] = useState<boolean>(false);
  const [bonusReasonInput, setBonusReasonInput] = useState<string>('Bónus de Boas-Vindas');

  // Mass Bonus Modal state
  const [isMassBonusOpen, setIsMassBonusOpen] = useState(false);
  const [massBonusAmount, setMassBonusAmount] = useState('50');
  const [massBonusFrozen, setMassBonusFrozen] = useState(false);
  const [massBonusReason, setMassBonusReason] = useState('Bónus Geral da Comunidade');

  // Voucher creation state
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherAmount, setNewVoucherAmount] = useState('100');
  const [newVoucherMaxUses, setNewVoucherMaxUses] = useState('50');

  // Plan Edit Modal state
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [planForm, setPlanForm] = useState<Partial<Plan>>({});

  // User Balance Modal state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');

  // Settings form state
  const [localSettings, setLocalSettings] = useState<PlatformSettings>(settings);

  // Search in users
  const [userSearch, setUserSearch] = useState('');

  // Filter for withdrawals
  const [withdrawFilter, setWithdrawFilter] = useState<'all' | 'pendente' | 'concluido' | 'falhado'>('all');

  // Filter for recharges
  const [rechargeFilter, setRechargeFilter] = useState<'all' | 'pendente' | 'concluido' | 'falhado'>('all');
  const [rejectRechargeTx, setRejectRechargeTx] = useState<Transaction | null>(null);
  const [rejectRechargeReason, setRejectRechargeReason] = useState<string>('Comprovativo ou referência não confirmados');

  // Rejection modal state for withdrawals
  const [rejectModalTx, setRejectModalTx] = useState<Transaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Dados M-Pesa/e-Mola não coincidem com o titular');

  // Adjustment reason state
  const [adjustmentReasonInput, setAdjustmentReasonInput] = useState<string>('Ajuste Manual pelo Administrador');

  // Password reset modal state
  const [passwordResetUser, setPasswordResetUser] = useState<UserProfile | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');

  // Audit tab filters and mode
  const [auditMode, setAuditMode] = useState<'transactions' | 'adjustments'>('transactions');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'all' | 'recarga' | 'levantamento' | 'rendimento' | 'bonus'>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // Broadcast alert local state
  const [broadcastActive, setBroadcastActive] = useState<boolean>(settings.broadcastAlert?.active ?? true);
  const [broadcastMessage, setBroadcastMessage] = useState<string>(settings.broadcastAlert?.message || 'Sistema atualizado! Rendimentos de 5% ao dia garantidos. Apoio oficial 24h via WhatsApp.');
  const [broadcastTitle, setBroadcastTitle] = useState<string>(settings.broadcastAlert?.title || 'Aviso da Administração');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'success' | 'urgent'>(settings.broadcastAlert?.type || 'info');

  const pendingWithdrawalsCount = transactions.filter(
    (t) => t.type === 'levantamento' && t.status === 'pendente'
  ).length;

  const pendingRechargesCount = transactions.filter(
    (t) => t.type === 'recarga' && t.status === 'pendente'
  ).length;

  const handleOpenEditPlan = (plan: Plan) => {
    setIsCreatingPlan(false);
    setEditingPlan(plan);
    setPlanForm({ ...plan });
  };

  const handleOpenCreatePlan = () => {
    setIsCreatingPlan(true);
    const nextLevel = plans.length + 1;
    setPlanForm({
      id: 'n' + Date.now(),
      name: `Nível ${nextLevel}`,
      model: 'Nova Série Pro',
      price: 15000,
      dailyYield: 750, // 5%
      days: 30,
      tone: 'from-amber-500/25 to-amber-500/5',
    });
    setEditingPlan(null);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name || !planForm.model || !planForm.price || !planForm.dailyYield || !planForm.days) {
      toast.error('Preencha todos os campos do equipamento.');
      return;
    }

    if (isCreatingPlan) {
      addPlan(planForm as Plan);
      setIsCreatingPlan(false);
    } else if (editingPlan) {
      updatePlan(editingPlan.id, planForm);
      setEditingPlan(null);
    }
  };

  const handleSaveUserBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const amount = Number(newBalanceInput);
    if (isNaN(amount) || amount < 0) {
      toast.error('Insira um valor válido de saldo.');
      return;
    }
    adjustUserBalance(selectedUser.id, amount, adjustmentReasonInput);
    setSelectedUser(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(localSettings);
  };

  const handleSaveBroadcastAlert = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      broadcastAlert: {
        active: broadcastActive,
        message: broadcastMessage,
        title: broadcastTitle,
        type: broadcastType,
      },
    });
    toast.success('Banner de comunicado atualizado para todos os utilizadores!');
  };

  const handleConfirmRejection = () => {
    if (!rejectModalTx) return;
    rejectWithdrawal(rejectModalTx.id, rejectionReason);
    setRejectModalTx(null);
  };

  const handleConfirmRechargeRejection = () => {
    if (!rejectRechargeTx) return;
    rejectRecharge(rejectRechargeTx.id, rejectRechargeReason);
    setRejectRechargeTx(null);
  };

  const handleConfirmPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;
    resetUserPassword(passwordResetUser.id, newPasswordInput);
    setPasswordResetUser(null);
    setNewPasswordInput('');
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.phone.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.includes(userSearch) ||
      u.wallet?.holderName?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredWithdrawals = transactions
    .filter((t) => t.type === 'levantamento')
    .filter((t) => (withdrawFilter === 'all' ? true : t.status === withdrawFilter));

  const allRecharges = transactions.filter((t) => t.type === 'recarga');
  const filteredRecharges = transactions
    .filter((t) => t.type === 'recarga')
    .filter((t) => (rechargeFilter === 'all' ? true : t.status === rechargeFilter));

  const filteredAuditTransactions = transactions
    .filter((t) => (auditTypeFilter === 'all' ? true : t.type === auditTypeFilter))
    .filter((t) => {
      if (!auditSearch.trim()) return true;
      const s = auditSearch.toLowerCase();
      return (
        (t.userPhone && t.userPhone.includes(s)) ||
        (t.reference && t.reference.toLowerCase().includes(s)) ||
        (t.method && t.method.toLowerCase().includes(s)) ||
        t.id.toLowerCase().includes(s)
      );
    });

  const totalFeesRetained =
    adminStats.collectedFeesTotal ||
    Math.round(adminStats.totalWithdrawn * ((settings.withdrawalFeePercent || 20) / 100));

  const totalDailyLiabilities = purchases
    .filter((p) => p.status === 'ativo')
    .reduce((acc, p) => acc + p.dailyYield, 0);

  if (!isAdminAuth) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background relative shadow-2xl p-6 justify-center items-center">
        <div className="w-full max-w-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-8" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">Acesso Restrito</h1>
            <p className="text-sm text-muted-foreground">
              Introduza a palavra-passe mestre para aceder ao painel de controlo administrativo.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              adminLogin(adminPassword);
            }}
            className="space-y-4"
          >
            <div>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Palavra-passe de administrador"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-primary text-primary-foreground py-3 text-base font-semibold shadow hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Autenticar
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="w-full text-sm text-muted-foreground hover:text-foreground cursor-pointer pt-2"
            >
              Voltar à plataforma
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md md:max-w-5xl lg:max-w-6xl flex-col bg-background relative shadow-2xl pb-16">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/95 backdrop-blur px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo('/conta')}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Voltar ao App</span>
            </button>
            <button
              type="button"
              onClick={adminLogout}
              className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-sm font-medium text-rose-500 hover:bg-rose-500/20 transition-colors border border-rose-500/20 ml-1 cursor-pointer"
            >
              Terminar Sessão
            </button>
          </div>
          <div className="flex items-center gap-1.5 pl-1">
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-display text-sm font-bold tracking-wider text-primary">
              ADMIN PAINEL
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Tem a certeza que deseja limpar todos os utilizadores e transações de teste para iniciar a base de dados 100% limpa?')) {
                  clearAllData();
                }
              }}
              className="flex items-center gap-1 rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1 text-[10px] text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3" />
              <span>Limpar Base</span>
            </button>
            <button
              type="button"
              onClick={exportDataReport}
              className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-xs text-primary font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
              title="Exportar Relatório JSON Completo"
            >
              <Download className="size-3" />
              <span className="hidden sm:inline">Exportar Dados</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Tem a certeza que deseja restaurar as configurações padrão?')) {
                  resetToDefaults();
                }
              }}
              className="flex items-center gap-1 rounded-lg border border-border/80 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span className="hidden sm:inline">Padrões</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation with Enhanced Legible Labels */}
        <nav className="mt-3 flex overflow-x-auto gap-2 pb-1.5 scrollbar-none text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="size-4" />
            <span>Visão Geral</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all cursor-pointer ${
              activeTab === 'financial'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            <PieChart className="size-4 text-emerald-500" />
            <span>Caixa & Lucros</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('withdrawals')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all cursor-pointer relative ${
              activeTab === 'withdrawals'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            <BadgeDollarSign className="size-4" />
            <span>Levantamentos</span>
            {pendingWithdrawalsCount > 0 && (
              <span className="ml-1 rounded-full bg-rose-500 text-white text-xs px-2.5 py-0.5 font-black">
                {pendingWithdrawalsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recharges')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all cursor-pointer relative ${
              activeTab === 'recharges'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wallet className="size-4" />
            <span>Recargas</span>
            {pendingRechargesCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 text-slate-900 text-xs px-2.5 py-0.5 font-black animate-pulse">
                {pendingRechargesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Smartphone className="size-4" />
            <span>Equipamentos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="size-4" />
            <span>Utilizadores ({allUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bonus')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all cursor-pointer ${
              activeTab === 'bonus'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="size-4 text-amber-500 fill-amber-500" />
            <span>Bónus & Saldos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vouchers')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all cursor-pointer ${
              activeTab === 'vouchers'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Gift className="size-4" />
            <span>Vouchers ({vouchers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cycles')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all cursor-pointer ${
              activeTab === 'cycles'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            <FastForward className="size-4" />
            <span>Ciclos 24h</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all cursor-pointer ${
              activeTab === 'broadcast'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Volume2 className="size-4 text-amber-500" />
            <span>Comunicados & Alertas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="size-4" />
            <span>Auditoria Geral</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="size-4" />
            <span>Configurações</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 space-y-4">
        {/* TAB 1: VISÃO GERAL */}
        {activeTab === 'overview' && (
          <div className="space-y-4 fade-up">
            {/* Alert banner if pending withdrawals */}
            {pendingWithdrawalsCount > 0 && (
              <div className="flex items-center justify-between rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3 text-sm text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-amber-400" />
                  <span>
                    Existem <strong>{pendingWithdrawalsCount} levantamento(s)</strong> a aguardar aprovação.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('withdrawals')}
                  className="rounded-lg bg-amber-500 text-black px-2.5 py-1 text-[11px] font-bold hover:bg-amber-400 transition-colors shrink-0"
                >
                  Resolver
                </button>
              </div>
            )}

            {/* Metric KPI Cards with Clear Typography */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="surface-card rounded-2xl p-4 border border-border/80 space-y-1 bg-card shadow-2xs">
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Saldo Caixa Geral</p>
                <p className="font-display text-lg sm:text-2xl font-black text-primary">
                  {formatCurrency(adminStats.platformBalance)}
                </p>
              </div>

              <div className="surface-card rounded-2xl p-4 border border-border/80 space-y-1 bg-card shadow-2xs">
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Lucro Taxas ({settings.withdrawalFeePercent || 20}%)</p>
                <p className="font-display text-lg sm:text-2xl font-black text-emerald-600">
                  +{formatCurrency(totalFeesRetained)}
                </p>
              </div>

              <div className="surface-card rounded-2xl p-4 border border-border/80 space-y-1 bg-card shadow-2xs">
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Total Depósitos</p>
                <p className="font-display text-lg sm:text-2xl font-black text-emerald-700">
                  {formatCurrency(adminStats.totalDeposited)}
                </p>
              </div>

              <div className="surface-card rounded-2xl p-4 border border-border/80 space-y-1 bg-card shadow-2xs">
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Pendente a Pagar</p>
                <p className="font-display text-lg sm:text-2xl font-black text-amber-500">
                  {formatCurrency(adminStats.pendingWithdrawalsAmount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="surface-card rounded-2xl p-4 border border-border/80 flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Membros Registados</p>
                  <p className="font-display text-2xl font-black text-foreground">{adminStats.totalUsers}</p>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                  <Users className="size-5" />
                </div>
              </div>

              <div className="surface-card rounded-2xl p-4 border border-border/80 flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Equipamentos Ativos</p>
                  <p className="font-display text-2xl font-black text-foreground">{purchases.filter(p => p.status === 'ativo').length}</p>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-secondary text-emerald-600">
                  <TrendingUp className="size-5" />
                </div>
              </div>

              <div className="surface-card rounded-2xl p-4 border border-border/80 flex items-center justify-between col-span-2 sm:col-span-1">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground">Passivo Diário (5%)</p>
                  <p className="font-display text-2xl font-black text-amber-600">{formatCurrency(totalDailyLiabilities)}/dia</p>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-secondary text-amber-500">
                  <Clock className="size-5" />
                </div>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="surface-card rounded-2xl p-4 border border-border/70 space-y-2.5">
              <h3 className="text-sm font-semibold text-foreground">Ações Rápidas de Gestão</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('plans');
                    handleOpenCreatePlan();
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary p-2.5 hover:bg-secondary/80 font-medium text-foreground transition-colors"
                >
                  <Plus className="size-4 text-primary" />
                  <span>Novo Equipamento</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary p-2.5 hover:bg-secondary/80 font-medium text-foreground transition-colors"
                >
                  <Settings className="size-4 text-primary" />
                  <span>Ajustar Taxas & Regras</span>
                </button>
              </div>
            </div>

            {/* Recent Transactions Snippet */}
            <div className="surface-card rounded-2xl p-4 border border-border/70 space-y-3">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h3 className="text-sm font-semibold text-foreground">Últimas Transações Registadas</h3>
                <span className="text-[11px] text-muted-foreground">{transactions.length} no total</span>
              </div>
              <div className="space-y-2">
                {transactions.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-1.5 text-sm border-b border-border/40 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground capitalize">
                        {t.type}: {formatCurrency(t.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {t.method} · {formatDate(t.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${
                        t.status === 'concluido'
                          ? 'bg-success/15 text-success'
                          : t.status === 'pendente'
                          ? 'bg-warning/15 text-warning'
                          : 'bg-destructive/15 text-destructive'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CAIXA FINANCEIRO & LUCROS (NOVA FUNÇÃO) */}
        {activeTab === 'financial' && (
          <div className="space-y-4 fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                  <PieChart className="size-5 text-emerald-600" />
                  <span>Demonstração de Caixa & Lucro da Plataforma</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Balanço consolidado, retenção de taxa de 20% e passivo diário projetado.
                </p>
              </div>

              <button
                type="button"
                onClick={exportDataReport}
                className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <FileSpreadsheet className="size-4" />
                <span>Exportar Relatório Financeiro</span>
              </button>
            </div>

            {/* Financial Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="surface-card rounded-2xl p-4.5 border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                <p className="text-xs sm:text-sm font-bold text-emerald-800 uppercase tracking-wide">
                  Lucro Retido em Taxas ({settings.withdrawalFeePercent || 20}%)
                </p>
                <p className="font-display text-2xl sm:text-3xl font-black text-emerald-700">
                  +{formatCurrency(totalFeesRetained)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Receita líquida retida pela casa sobre os levantamentos efetuados.
                </p>
              </div>

              <div className="surface-card rounded-2xl p-4.5 border border-primary/30 bg-primary/5 space-y-1">
                <p className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wide">
                  Saldo Líquido em Caixa
                </p>
                <p className="font-display text-2xl sm:text-3xl font-black text-foreground">
                  {formatCurrency(adminStats.platformBalance)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Depósitos ({formatCurrency(adminStats.totalDeposited)}) - Levantamentos ({formatCurrency(adminStats.totalWithdrawn)})
                </p>
              </div>

              <div className="surface-card rounded-2xl p-4.5 border border-amber-500/30 bg-amber-500/5 space-y-1">
                <p className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wide">
                  Passivo Diário (5% / dia)
                </p>
                <p className="font-display text-2xl sm:text-3xl font-black text-amber-600">
                  {formatCurrency(totalDailyLiabilities)} / dia
                </p>
                <p className="text-xs text-muted-foreground">
                  Soma dos rendimentos de 5% gerados pelos iPhones ativos a cada 24h.
                </p>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="surface-card rounded-2xl p-5 border border-border/80 space-y-4 bg-card">
              <h3 className="text-base font-bold text-foreground">Resumo Consolidado das Operações</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-border/60">
                  <span className="text-muted-foreground font-medium">Volume Total de Entradas (Recargas M-Pesa / e-Mola)</span>
                  <span className="font-bold text-emerald-600 text-base">+{formatCurrency(adminStats.totalDeposited)}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/60">
                  <span className="text-muted-foreground font-medium">Volume Total de Saídas (Levantamentos Liquidados)</span>
                  <span className="font-bold text-rose-600 text-base">-{formatCurrency(adminStats.totalWithdrawn)}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/60">
                  <span className="text-muted-foreground font-medium">Taxa de Levantamento Vigente</span>
                  <span className="font-extrabold text-foreground">{settings.withdrawalFeePercent || 20}%</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/60">
                  <span className="text-muted-foreground font-medium">Levantamentos Pendentes a Liquidar</span>
                  <span className="font-extrabold text-amber-600">{pendingWithdrawalsCount} solicitações ({formatCurrency(adminStats.pendingWithdrawalsAmount)})</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/60">
                  <span className="text-muted-foreground font-medium">Bónus Congelados em Circulação</span>
                  <span className="font-bold text-amber-800">
                    {formatCurrency(allUsers.reduce((acc, u) => acc + (u.bonusBalance || 0), 0))}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 bg-slate-50 p-3 rounded-xl border border-border/70">
                  <span className="font-bold text-foreground">Resultado Operacional em Cofre</span>
                  <span className="font-black text-primary text-lg">
                    {formatCurrency(adminStats.platformBalance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LEVANTAMENTOS */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4 fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                  Gestão de Levantamentos
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Processe levantamentos manuais ou em lote com dedução automática da taxa de {settings.withdrawalFeePercent || 20}%.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {pendingWithdrawalsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Aprovar todos os ${pendingWithdrawalsCount} levantamentos pendentes de uma vez?`)) {
                        approveAllPendingWithdrawals();
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
                  >
                    <CheckCheck className="size-4" />
                    <span>Aprovar Todos ({pendingWithdrawalsCount})</span>
                  </button>
                )}

                <div className="flex gap-1 bg-secondary rounded-xl p-1 text-xs">
                  {(['all', 'pendente', 'concluido', 'falhado'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setWithdrawFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-bold transition-colors cursor-pointer ${
                        withdrawFilter === filter
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {filter === 'all' ? 'Todos' : filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredWithdrawals.length === 0 ? (
              <div className="surface-card rounded-2xl p-8 text-center border border-border/70">
                <p className="text-sm font-medium text-muted-foreground">Nenhum levantamento com este filtro.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWithdrawals.map((t) => {
                  const feePercent = settings.withdrawalFeePercent ?? 20;
                  const netToTransfer = t.amount * (1 - feePercent / 100);
                  return (
                    <div
                      key={t.id}
                      className={`surface-card rounded-2xl p-4 border transition-all ${
                        t.status === 'pendente'
                          ? 'border-amber-500/60 bg-amber-500/5 shadow-sm'
                          : 'border-border/70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-display text-lg sm:text-xl font-black text-foreground">
                              {formatCurrency(t.amount)}
                            </span>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-bold ${
                                t.status === 'concluido'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : t.status === 'pendente'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                          <p className="text-sm text-foreground font-semibold mt-1">
                            Canal: <span className="text-primary">{t.method}</span>
                            {t.userPhone && <span className="text-muted-foreground"> • Utilizador: +258 {t.userPhone}</span>}
                          </p>
                          <p className="text-xs font-bold text-emerald-700 mt-0.5">
                            Valor Líquido a Transferir (c/ taxa {feePercent}%): <strong>{formatCurrency(netToTransfer)}</strong>
                          </p>
                          {t.note && (
                            <p className="text-xs text-rose-600 font-medium mt-0.5">
                              Motivo da Rejeição: {t.note}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Data: {formatDate(t.createdAt)} • Ref: {t.reference || t.id}
                          </p>
                        </div>

                        {t.status === 'pendente' && (
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => approveWithdrawal(t.id)}
                              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
                              title="Aprovar transferência"
                            >
                              <Check className="size-4" />
                              <span>Aprovar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectModalTx(t);
                                setRejectionReason('Dados M-Pesa/e-Mola não coincidem com o titular');
                              }}
                              className="flex items-center gap-1.5 rounded-xl bg-rose-600/15 border border-rose-500/30 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-600/25 transition-colors cursor-pointer"
                              title="Rejeitar e reembolsar saldo"
                            >
                              <X className="size-4" />
                              <span>Rejeitar</span>
                            </button>
                          </div>
                        )}

                        {t.status !== 'pendente' && (
                          <button
                            type="button"
                            onClick={() => deleteTransaction(t.id)}
                            className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer self-end sm:self-center"
                            title="Eliminar registo"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RECARGAS & DEPÓSITOS COM APROVAÇÃO */}
        {activeTab === 'recharges' && (
          <div className="space-y-4 fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                  Validação & Auditoria de Depósitos
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Aprove ou rejeite pedidos de recarga após verificar o SMS oficial da Vodacom / Movitel.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex gap-1.5 bg-secondary rounded-xl p-1 text-xs font-bold overflow-x-auto">
                {(['all', 'pendente', 'concluido', 'falhado'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setRechargeFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-colors cursor-pointer ${
                      rechargeFilter === filter
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {filter === 'all'
                      ? 'Todos'
                      : filter === 'pendente'
                      ? `Pendentes (${pendingRechargesCount})`
                      : filter === 'concluido'
                      ? 'Aprovados'
                      : 'Rejeitados'}
                  </button>
                ))}
              </div>
            </div>

            {/* Pending Recharges Banner */}
            {pendingRechargesCount > 0 && rechargeFilter !== 'falhado' && rechargeFilter !== 'concluido' && (
              <div className="flex items-center justify-between rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3 text-xs sm:text-sm text-amber-900 font-semibold">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                  <span>
                    Existem <strong>{pendingRechargesCount} depósito(s) pendente(s)</strong> a aguardar confirmação do SMS oficial.
                  </span>
                </div>
              </div>
            )}

            {filteredRecharges.length === 0 ? (
              <div className="surface-card rounded-2xl p-8 text-center border border-border/70">
                <p className="text-sm font-semibold text-muted-foreground">
                  Nenhum pedido de recarga encontrado nesta categoria.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecharges.map((t) => (
                  <div
                    key={t.id}
                    className={`surface-card rounded-2xl p-4 border transition-all ${
                      t.status === 'pendente'
                        ? 'border-amber-500/60 bg-amber-500/5 shadow-md'
                        : 'border-border/70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-display text-lg sm:text-xl font-black text-emerald-600">
                            +{formatCurrency(t.amount)}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-bold ${
                              t.status === 'concluido'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : t.status === 'pendente'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {t.status === 'concluido' ? 'Aprovado' : t.status === 'pendente' ? 'Pendente' : 'Rejeitado'}
                          </span>
                        </div>

                        <p className="text-sm text-foreground font-semibold mt-1">
                          Canal: <strong className="text-primary">{t.method}</strong>
                          {t.userPhone && (
                            <span className="text-muted-foreground"> • Telemóvel Pagador: +258 {t.userPhone}</span>
                          )}
                        </p>

                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          <span>Data: {formatDate(t.createdAt)}</span>
                          {t.reference && (
                            <span className="font-mono bg-white border border-border px-2 py-0.5 rounded-md text-foreground font-bold">
                              Ref SMS: {t.reference}
                            </span>
                          )}
                          {t.userId && <span>• ID Utilizador: {t.userId}</span>}
                        </div>

                        {t.note && (
                          <p className="text-xs text-rose-600 font-medium mt-1">
                            Motivo da Rejeição: {t.note}
                          </p>
                        )}
                      </div>

                      {t.status === 'pendente' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Confirma a validação e crédito de ${formatCurrency(t.amount)} para o utilizador (+258 ${t.userPhone})?`)) {
                                approveRecharge(t.id);
                              }
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
                            title="Validar SMS e creditar saldo ao utilizador"
                          >
                            <Check className="size-4" />
                            <span>Validar & Creditar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRejectRechargeTx(t);
                              setRejectRechargeReason('Comprovativo ou referência de SMS não confirmados na conta');
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-rose-600/15 border border-rose-500/30 px-3 py-2 text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-600/25 transition-colors cursor-pointer"
                            title="Rejeitar pedido de recarga"
                          >
                            <X className="size-4" />
                            <span>Rejeitar</span>
                          </button>
                        </div>
                      )}

                      {t.status !== 'pendente' && (
                        <button
                          type="button"
                          onClick={() => deleteTransaction(t.id)}
                          className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer self-end sm:self-center"
                          title="Eliminar registo"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EQUIPAMENTOS (CATÁLOGO) */}
        {activeTab === 'plans' && (
          <div className="space-y-4 fade-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-foreground">
                  Catálogo de Equipamentos
                </h2>
                <p className="text-sm text-muted-foreground">
                  Edite preços, rendimentos e ciclos em tempo real.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreatePlan}
                className="flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold shadow hover:bg-primary/90 transition-colors"
              >
                <Plus className="size-3.5" />
                <span>Novo Nível</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="surface-card rounded-2xl p-3.5 border border-border/70 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-semibold text-foreground">
                          {p.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{p.model}</p>
                      </div>
                      <span className="font-display text-base font-bold text-primary">
                        {formatCurrency(p.price)}
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-xl bg-secondary/50 p-2 text-center text-[10px]">
                      <div>
                        <p className="text-muted-foreground">Diário</p>
                        <p className="font-bold text-success">{formatCurrency(p.dailyYield)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ciclo</p>
                        <p className="font-bold text-foreground">{p.days} dias</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Retorno Total</p>
                        <p className="font-bold text-success">{formatCurrency(p.dailyYield * p.days)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-border/40">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPlan(p)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-secondary py-1.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      <Edit2 className="size-3" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (plans.length <= 1) {
                          toast.error('O catálogo deve manter pelo menos um equipamento ativo.');
                          return;
                        }
                        if (window.confirm(`Remover ${p.name} (${p.model}) do catálogo?`)) {
                          deletePlan(p.id);
                        }
                      }}
                      className="px-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: UTILIZADORES */}
        {activeTab === 'users' && (
          <div className="space-y-4 fade-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-foreground">
                  Gestão de Membros
                </h2>
                <p className="text-sm text-muted-foreground">
                  Consulte utilizadores e ajuste saldos manualmente.
                </p>
              </div>
              <span className="text-sm font-semibold text-primary">{allUsers.length} inscritos</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Pesquisar por telefone, ID ou nome..."
                className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="surface-card rounded-2xl p-4 border border-border/80 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-border/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base font-bold text-primary">ID {u.id}</span>
                        <span className="text-base font-bold text-foreground">+258 {u.phone}</span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            u.status === 'suspenso'
                              ? 'bg-rose-100 text-rose-700 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {u.status === 'suspenso' ? 'Suspenso' : 'Ativo'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Titular: <strong className="text-foreground">{u.wallet?.holderName || 'Não configurado'}</strong> ({u.wallet?.provider || '—'})
                        {u.referredBy && <span> • Convidado por: <strong>{u.referredBy}</strong></span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setBonusModalUser(u);
                          setBonusAmountInput('100');
                          setBonusIsFrozen(false);
                          setBonusReasonInput('Bónus de Fidelidade');
                        }}
                        className="flex items-center gap-1 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-500/25 transition-colors cursor-pointer"
                        title="Atribuir bónus"
                      >
                        <Sparkles className="size-3.5 text-amber-600 fill-amber-600" />
                        <span>Dar Bónus</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setNewBalanceInput(String(u.balance));
                        }}
                        className="flex items-center gap-1 rounded-xl bg-primary/15 border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/25 transition-colors cursor-pointer"
                        title="Editar saldo direto"
                      >
                        <DollarSign className="size-3.5" />
                        <span>Ajustar Saldo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPasswordResetUser(u);
                          setNewPasswordInput('');
                        }}
                        className="flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Redefinir Palavra-passe"
                      >
                        <KeyRound className="size-3.5 text-slate-700" />
                        <span>Senha</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleUserStatus(u.id)}
                        className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                          u.status === 'suspenso'
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/25'
                            : 'bg-rose-500/15 border-rose-500/30 text-rose-700 hover:bg-rose-500/25'
                        }`}
                        title={u.status === 'suspenso' ? 'Ativar conta' : 'Suspender conta'}
                      >
                        {u.status === 'suspenso' ? <UserCheck className="size-3.5" /> : <UserX className="size-3.5" />}
                        <span>{u.status === 'suspenso' ? 'Reativar' : 'Bloquear'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Tem a certeza que deseja eliminar o utilizador +258 ${u.phone} e todos os seus dados?`)) {
                            deleteUser(u.id);
                          }
                        }}
                        className="p-1.5 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Eliminar utilizador"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-xl bg-secondary/50 p-3 text-center text-xs">
                    <div>
                      <p className="text-muted-foreground font-semibold">Saldo Disponível</p>
                      <p className="font-extrabold text-primary text-sm sm:text-base mt-0.5">{formatCurrency(u.balance)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold">Bónus Congelado</p>
                      <p className="font-extrabold text-amber-700 text-sm sm:text-base mt-0.5">{formatCurrency(u.bonusBalance || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold">Recarregado</p>
                      <p className="font-bold text-foreground text-sm sm:text-base mt-0.5">{formatCurrency(u.totalRecharged)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold">Total Levantado</p>
                      <p className="font-bold text-foreground text-sm sm:text-base mt-0.5">{formatCurrency(u.totalWithdrawn)}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-muted-foreground font-semibold">iPhones Ativos</p>
                      <p className="font-extrabold text-emerald-600 text-sm sm:text-base mt-0.5">
                        {purchases.filter(p => p.userId === u.id && p.status === 'ativo').length} equipamentos
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: BÓNUS & SALDOS (NOVA FUNÇÃO) */}
        {activeTab === 'bonus' && (
          <div className="space-y-4 fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="size-5 text-amber-500 fill-amber-500" />
                  <span>Gestão de Bónus & Congelamentos</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Atribua bónus diretos ou congelados e gerencie o desbloqueio para os utilizadores.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMassBonusOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-md hover:bg-amber-500 transition-colors cursor-pointer shrink-0"
              >
                <Gift className="size-4" />
                <span>Distribuir Bónus Geral (Todos)</span>
              </button>
            </div>

            {/* Quick overview of frozen bonuses */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="surface-card rounded-2xl p-4 border border-border/70 space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Total Bónus Congelados</p>
                <p className="font-display text-xl font-bold text-amber-700">
                  {formatCurrency(allUsers.reduce((acc, u) => acc + (u.bonusBalance || 0), 0))}
                </p>
              </div>
              <div className="surface-card rounded-2xl p-4 border border-border/70 space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Utilizadores com Bónus</p>
                <p className="font-display text-xl font-bold text-foreground">
                  {allUsers.filter((u) => (u.bonusBalance || 0) > 0).length} membros
                </p>
              </div>
              <div className="surface-card rounded-2xl p-4 border border-border/70 space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Bónus de Check-in Atual</p>
                <p className="font-display text-xl font-bold text-emerald-600">
                  {formatCurrency(settings.checkInBonus)} / dia
                </p>
              </div>
            </div>

            {/* Users list with unfreeze quick action */}
            <div className="surface-card rounded-2xl p-4 border border-border/70 space-y-3">
              <h3 className="text-sm font-bold text-foreground">Descongelamento de Bónus por Utilizador</h3>
              <div className="space-y-2">
                {allUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-border/60 bg-secondary/30"
                  >
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        +258 {u.phone} <span className="text-xs text-muted-foreground">(ID {u.id})</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saldo Disponível: <strong className="text-primary">{formatCurrency(u.balance)}</strong> • Bónus Congelado: <strong className="text-amber-700">{formatCurrency(u.bonusBalance || 0)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!u.bonusBalance || u.bonusBalance <= 0}
                        onClick={() => unfreezeUserBonus(u.id)}
                        className="flex items-center gap-1 rounded-xl bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-emerald-500 disabled:opacity-40 transition-colors cursor-pointer"
                        title="Transferir bónus congelado para saldo disponível"
                      >
                        <Unlock className="size-3.5" />
                        <span>Descongelar Bónus</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBonusModalUser(u);
                          setBonusAmountInput('200');
                          setBonusIsFrozen(true);
                          setBonusReasonInput('Bónus Promocional');
                        }}
                        className="flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                      >
                        <Plus className="size-3.5 text-primary" />
                        <span>+ Bónus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: VOUCHERS / CUPÕES PROMOCIONAIS (NOVA FUNÇÃO) */}
        {activeTab === 'vouchers' && (
          <div className="space-y-4 fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Gift className="size-5 text-primary" />
                  <span>Códigos de Vouchers & Cupões</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gere códigos promocionais que os utilizadores podem resgatar no menu da conta.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewVoucherCode(`APPLE${Math.floor(100 + Math.random() * 900)}`);
                  setNewVoucherAmount('100');
                  setNewVoucherMaxUses('50');
                  setIsVoucherModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-primary text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-md hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="size-4" />
                <span>Criar Novo Voucher</span>
              </button>
            </div>

            {vouchers.length === 0 ? (
              <div className="surface-card rounded-2xl p-8 text-center border border-border/70 space-y-2">
                <Gift className="size-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">Nenhum voucher ativo no momento.</p>
                <p className="text-xs text-muted-foreground">Clique no botão acima para criar o primeiro código promocional.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vouchers.map((v) => (
                  <div
                    key={v.id}
                    className="surface-card rounded-2xl p-4 border border-border/70 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                            {v.code}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {formatCurrency(v.amount)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Criado em: {formatDate(v.createdAt)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Eliminar o voucher ${v.code}?`)) {
                            deleteVoucher(v.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Eliminar voucher"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                      <span className="text-muted-foreground">Utilizações:</span>
                      <span className="font-bold text-foreground">
                        {v.usedCount} / {v.maxUses} resgates
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: CICLOS 24H & SIMULADOR (NOVA FUNÇÃO) */}
        {activeTab === 'cycles' && (
          <div className="space-y-4 fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <FastForward className="size-5 text-primary" />
                  <span>Auditoria de Ciclos de Rendimentos (24 Horas)</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Monitore e force a liquidação automática de 24h para todos os equipamentos ativos.
                </p>
              </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Executar ciclo de 24h para TODOS os utilizadores com equipamentos ativos na plataforma?')) {
                        batchProcessYieldsAllUsers();
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-primary text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-md hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
                  >
                    <CheckCheck className="size-4" />
                    <span>Processar Todos os Membros (5%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const paid = checkAndProcess24hYields();
                      if (paid > 0) {
                        toast.success(`${paid} crédito(s) de 24h processado(s) com sucesso!`);
                      } else {
                        toast.info('Nenhum equipamento atingiu 24 horas pendentes de liquidação.');
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-md hover:bg-emerald-500 transition-colors cursor-pointer shrink-0"
                  >
                    <Clock className="size-4" />
                    <span>Sincronizar Meus Equipamentos</span>
                  </button>
                </div>
              </div>

            {purchases.length === 0 ? (
              <div className="surface-card rounded-2xl p-8 text-center border border-border/70">
                <p className="text-sm font-semibold text-muted-foreground">
                  Nenhum equipamento foi adquirido pelos utilizadores ainda.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.map((p) => (
                  <div
                    key={p.id}
                    className="surface-card rounded-2xl p-4 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-foreground text-sm sm:text-base">
                          {p.planName}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            p.status === 'ativo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Progresso: <strong>{p.daysCompleted} de {p.days} dias</strong> ({Math.round(((p.daysCompleted || 0) / p.days) * 100)}%) • Rendimento diário: <strong className="text-emerald-600">{formatCurrency(p.dailyYield)}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Adquirido em: {formatDate(p.purchasedAt)} • Já rendeu: <strong>{formatCurrency(p.totalEarned || 0)}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={p.status === 'concluido'}
                      onClick={() => advanceCycle24h(p.id)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border px-3.5 py-2 text-xs font-bold text-foreground transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                      title="Acelerar 1 ciclo de 24h"
                    >
                      <FastForward className="size-3.5 text-primary" />
                      <span>Acelerar +24h</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 10: COMUNICADOS & ALERTAS GLOBAIS (NOVA FUNÇÃO) */}
        {activeTab === 'broadcast' && (
          <form onSubmit={handleSaveBroadcastAlert} className="space-y-4 fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Volume2 className="size-5 text-amber-500" />
                  <span>Sistema de Comunicados & Alertas em Tempo Real</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Publique notificações urgentes e comunicados visíveis para todos os clientes no app.
                </p>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-bold shadow-md hover:bg-primary/90 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Save className="size-4" />
                <span>Salvar & Publicar</span>
              </button>
            </div>

            {/* Banner Toggle & Configuration */}
            <div className="surface-card rounded-2xl p-5 border border-border/80 space-y-4 bg-card">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div>
                  <h3 className="text-base font-bold text-foreground">Banner de Alerta no Topo do Ecrã</h3>
                  <p className="text-xs text-muted-foreground">Ativa ou desativa a faixa de notificação no início do app.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={broadcastActive}
                    onChange={(e) => setBroadcastActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Título do Alerta</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="Ex: Aviso da Administração, Promoção VIP, Manutenção"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Mensagem do Comunicado</label>
                  <textarea
                    rows={3}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Texto completo do aviso que os utilizadores lerão no app..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Estilo / Nível de Urgência</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { type: 'info', label: 'Informativo (Azul)', color: 'bg-blue-50 border-blue-300 text-blue-900' },
                      { type: 'success', label: 'Sucesso (Verde)', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
                      { type: 'warning', label: 'Aviso (Âmbar)', color: 'bg-amber-50 border-amber-300 text-amber-900' },
                      { type: 'urgent', label: 'Urgente (Vermelho)', color: 'bg-rose-50 border-rose-300 text-rose-900' },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setBroadcastType(item.type as any)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                          broadcastType === item.type
                            ? `${item.color} ring-2 ring-primary shadow-xs`
                            : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview of Broadcast Alert */}
            <div className="surface-card rounded-2xl p-5 border border-border/80 space-y-2 bg-slate-50">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Pré-visualização do Banner para os Utilizadores
              </h4>
              {broadcastActive ? (
                <div
                  className={`flex items-start gap-3 rounded-2xl p-4 border shadow-xs ${
                    broadcastType === 'urgent'
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : broadcastType === 'warning'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : broadcastType === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-blue-50 border-blue-300 text-blue-950'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {broadcastType === 'urgent' ? (
                      <AlertTriangle className="size-5 text-rose-600" />
                    ) : broadcastType === 'warning' ? (
                      <AlertTriangle className="size-5 text-amber-600" />
                    ) : broadcastType === 'success' ? (
                      <Check className="size-5 text-emerald-600" />
                    ) : (
                      <Sparkles className="size-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 text-sm">
                    {broadcastTitle && <p className="font-extrabold text-sm mb-0.5">{broadcastTitle}</p>}
                    <p className="leading-snug font-medium">{broadcastMessage || 'Insira a mensagem do aviso...'}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  Banner desativado no momento. Ative a chave acima para exibir aos utilizadores.
                </div>
              )}
            </div>
          </form>
        )}

        {/* TAB 11: AUDITORIA GERAL & TRANSAÇÕES (NOVA FUNÇÃO) */}
        {activeTab === 'audit' && (
          <div className="space-y-4 fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <History className="size-5 text-primary" />
                  <span>Auditoria Completa & Transparência</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Registo imutável de transações, saques, depósitos e ajustes manuais de saldo realizados pelo administrador.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={exportDataReport}
                  className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  <Download className="size-4" />
                  <span>Exportar Dados</span>
                </button>
              </div>
            </div>

            {/* Sub-mode Switcher */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuditMode('transactions')}
                className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                  auditMode === 'transactions'
                    ? 'bg-white text-foreground shadow-xs font-black'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Transações do Sistema ({transactions.length})
              </button>

              <button
                type="button"
                onClick={() => setAuditMode('adjustments')}
                className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                  auditMode === 'adjustments'
                    ? 'bg-white text-foreground shadow-xs font-black'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Ajustes de Saldo & Bónus ({adjustmentLogs.length})
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="surface-card rounded-2xl p-4 border border-border/80 space-y-3 bg-card">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder={
                      auditMode === 'transactions'
                        ? 'Pesquisar por telefone, método, ref ou ID...'
                        : 'Pesquisar ajustes por telefone, motivo ou utilizador...'
                    }
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {auditMode === 'transactions' && (
                  <div className="flex gap-1 bg-secondary rounded-xl p-1 overflow-x-auto text-xs font-bold">
                    {(['all', 'recarga', 'levantamento', 'rendimento', 'bonus'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAuditTypeFilter(type)}
                        className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-colors cursor-pointer ${
                          auditTypeFilter === type
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {type === 'all' ? 'Todas' : type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {auditMode === 'transactions' ? (
              filteredAuditTransactions.length === 0 ? (
                <div className="surface-card rounded-2xl p-8 text-center border border-border/70">
                  <p className="text-sm font-semibold text-muted-foreground">Nenhuma transação encontrada com estes filtros.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredAuditTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="surface-card rounded-2xl p-4 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card"
                    >
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`font-display text-base font-bold ${
                              t.type === 'recarga' || t.type === 'rendimento' || t.type === 'bonus'
                                ? 'text-emerald-600'
                                : 'text-foreground'
                            }`}
                          >
                            {t.type === 'recarga' || t.type === 'rendimento' || t.type === 'bonus' ? '+' : '-'}
                            {formatCurrency(t.amount)}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                            {t.type}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              t.status === 'concluido'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.status === 'pendente'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <p className="text-sm text-foreground font-semibold mt-1">
                          {t.method} {t.userPhone && <span className="text-muted-foreground">• Tel: +258 {t.userPhone}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Data: {formatDate(t.createdAt)} • Ref: {t.reference || t.id}
                          {t.note && <span className="text-rose-600"> • Nota: {t.note}</span>}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteTransaction(t.id)}
                        className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer self-end sm:self-center"
                        title="Eliminar transação"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              adjustmentLogs.filter((log) => {
                if (!auditSearch.trim()) return true;
                const s = auditSearch.toLowerCase();
                return (
                  log.targetUserPhone.toLowerCase().includes(s) ||
                  log.targetUserId.toLowerCase().includes(s) ||
                  log.reason.toLowerCase().includes(s) ||
                  log.type.toLowerCase().includes(s)
                );
              }).length === 0 ? (
                <div className="surface-card rounded-2xl p-8 text-center border border-border/70">
                  <p className="text-sm font-semibold text-muted-foreground">Nenhum registo de ajuste manual ou bónus encontrado.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adjustmentLogs.filter((log) => {
                    if (!auditSearch.trim()) return true;
                    const s = auditSearch.toLowerCase();
                    return (
                      log.targetUserPhone.toLowerCase().includes(s) ||
                      log.targetUserId.toLowerCase().includes(s) ||
                      log.reason.toLowerCase().includes(s) ||
                      log.type.toLowerCase().includes(s)
                    );
                  }).map((log) => (
                    <div
                      key={log.id}
                      className="surface-card rounded-2xl p-4 border border-border/80 shadow-xs space-y-2 bg-card"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-sm text-primary">ID {log.targetUserId}</span>
                          <span className="font-bold text-foreground text-sm">+258 {log.targetUserPhone}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                            {log.type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1">
                        <div>
                          <p className="text-muted-foreground">Saldo Anterior</p>
                          <p className="font-bold text-foreground text-sm mt-0.5">{formatCurrency(log.previousBalance)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Valor do Ajuste</p>
                          <p className={`font-black text-sm mt-0.5 ${log.newBalance >= log.previousBalance ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {log.newBalance >= log.previousBalance ? '+' : '-'}{formatCurrency(log.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Novo Saldo Final</p>
                          <p className="font-extrabold text-primary text-sm mt-0.5">{formatCurrency(log.newBalance)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Responsável</p>
                          <p className="font-semibold text-foreground text-xs mt-0.5">{log.adminName}</p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 border border-border/60 p-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Justificação:</span> {log.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* TAB 9: CONFIGURAÇÕES DA PLATAFORMA COM TAXA E CANAIS OFICIAIS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-4 fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                  Regras e Configurações Globais
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Defina valores mínimos, taxa de levantamento, canais oficiais e comunicados.
                </p>
              </div>

              <button
                type="button"
                onClick={exportDataReport}
                className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Download className="size-4" />
                <span>Exportar Relatório Geral (JSON)</span>
              </button>
            </div>

            {/* Financial Parameters */}
            <div className="surface-card rounded-2xl p-4.5 border border-border/70 space-y-3.5">
              <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                <span>Parâmetros Financeiros & Taxas</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">
                    Levantamento Mínimo (MT)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={localSettings.minWithdrawal}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, minWithdrawal: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">
                    Recarga Mínima (MT)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={localSettings.minRecharge}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, minRecharge: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">
                    Taxa sobre Levantamento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localSettings.withdrawalFeePercent ?? 20}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, withdrawalFeePercent: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">
                    Bónus de Check-in Diário (MT)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={localSettings.checkInBonus}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, checkInBonus: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Official Announcement Marquee */}
            <div className="surface-card rounded-2xl p-4.5 border border-border/70 space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500 fill-amber-500" />
                <span>Texto do Comunicado Oficial (Faixa Rotativa)</span>
              </h3>
              <textarea
                rows={2}
                value={localSettings.officialAnnouncement || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, officialAnnouncement: e.target.value })}
                placeholder="Texto do comunicado oficial exibido no topo da página inicial..."
                className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none leading-relaxed"
              />
            </div>

            {/* Official Mozambican Payment Channels */}
            <div className="surface-card rounded-2xl p-4.5 border border-border/70 space-y-3.5">
              <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <Wallet className="size-4 text-primary" />
                <span>Canais Oficiais de Pagamento (M-Pesa e e-Mola)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">
                    Número Oficial Vodacom M-Pesa
                  </label>
                  <input
                    type="text"
                    value={localSettings.mpesaOfficialNumber || '84 900 1234'}
                    onChange={(e) => setLocalSettings({ ...localSettings, mpesaOfficialNumber: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">
                    Nome do Titular M-Pesa
                  </label>
                  <input
                    type="text"
                    value={localSettings.mpesaOfficialName || 'APPLE INVEST MOZ'}
                    onChange={(e) => setLocalSettings({ ...localSettings, mpesaOfficialName: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">
                    Número Oficial Movitel e-Mola
                  </label>
                  <input
                    type="text"
                    value={localSettings.emolaOfficialNumber || '86 900 1234'}
                    onChange={(e) => setLocalSettings({ ...localSettings, emolaOfficialNumber: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">
                    Nome do Titular e-Mola
                  </label>
                  <input
                    type="text"
                    value={localSettings.emolaOfficialName || 'APPLE INVEST MOZ'}
                    onChange={(e) => setLocalSettings({ ...localSettings, emolaOfficialName: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Commission rates */}
            <div className="surface-card rounded-2xl p-4.5 border border-border/70 space-y-3.5">
              <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <span>Taxas de Comissão de Equipa (%)</span>
              </h3>

              <div className="grid grid-cols-3 gap-2.5 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">Nível 1 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localSettings.level1Commission}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, level1Commission: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">Nível 2 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localSettings.level2Commission}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, level2Commission: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">Nível 3 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localSettings.level3Commission}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, level3Commission: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Support channels */}
            <div className="surface-card rounded-2xl p-4.5 border border-border/70 space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <span>Contactos de Apoio Oficial</span>
              </h3>

              <div className="space-y-2.5 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">WhatsApp de Suporte (Directo)</label>
                  <input
                    type="text"
                    value={localSettings.supportWhatsapp}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, supportWhatsapp: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">Link do Grupo Oficial do WhatsApp</label>
                  <input
                    type="url"
                    value={localSettings.whatsappGroupUrl || ''}
                    placeholder="https://chat.whatsapp.com/..."
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, whatsappGroupUrl: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-semibold block mb-1">Telegram Oficial</label>
                  <input
                    type="text"
                    value={localSettings.supportTelegram}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, supportTelegram: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* System Status Toggles */}
            <div className="surface-card rounded-2xl p-4.5 border border-border/70 space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-foreground">Disponibilidade do Sistema</h3>
              <div className="space-y-2.5">
                <label className="flex items-center justify-between text-sm font-medium cursor-pointer">
                  <span>Permitir Levantamentos</span>
                  <input
                    type="checkbox"
                    checked={localSettings.withdrawalsEnabled}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, withdrawalsEnabled: e.target.checked })
                    }
                    className="size-4.5 accent-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-sm font-medium cursor-pointer">
                  <span>Permitir Recargas</span>
                  <input
                    type="checkbox"
                    checked={localSettings.rechargesEnabled}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, rechargesEnabled: e.target.checked })
                    }
                    className="size-4.5 accent-primary cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-primary text-primary-foreground py-3.5 text-base font-bold shadow hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="size-4.5" />
              <span>Salvar Todas as Configurações</span>
            </button>
          </form>
        )}
      </main>

      {/* Plan Edit / Create Modal */}
      {(editingPlan || isCreatingPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSavePlan}
            className="surface-card w-full max-w-sm rounded-3xl p-5 border border-border shadow-2xl space-y-3 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h3 className="font-display font-semibold text-base text-foreground">
                {isCreatingPlan ? 'Criar Novo Equipamento' : `Editar ${editingPlan?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingPlan(null);
                  setIsCreatingPlan(false);
                }}
                className="text-muted-foreground hover:text-foreground text-base p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <label className="text-muted-foreground block mb-0.5">Nome do Plano</label>
                <input
                  type="text"
                  required
                  value={planForm.name || ''}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="Ex: Nível 9"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-0.5">Modelo / Série</label>
                <input
                  type="text"
                  required
                  value={planForm.model || ''}
                  onChange={(e) => setPlanForm({ ...planForm, model: e.target.value })}
                  placeholder="Ex: Edição Especial Pro"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-muted-foreground block mb-0.5">Preço (MT)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={planForm.price || ''}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-0.5">Rendimento Diário (MT)</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={planForm.dailyYield || ''}
                    onChange={(e) => setPlanForm({ ...planForm, dailyYield: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted-foreground block mb-0.5">Ciclo (dias)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="365"
                  value={planForm.days || ''}
                  onChange={(e) => setPlanForm({ ...planForm, days: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingPlan(null);
                  setIsCreatingPlan(false);
                }}
                className="flex-1 rounded-full border border-border py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-primary text-primary-foreground py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Adjust User Balance Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveUserBalance}
            className="surface-card w-full max-w-sm rounded-3xl p-5 border border-border shadow-2xl space-y-3 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div>
                <h3 className="font-display font-semibold text-base text-foreground">
                  Ajustar Saldo de Utilizador
                </h3>
                <p className="text-sm text-muted-foreground">
                  ID {selectedUser.id} · +258 {selectedUser.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-muted-foreground hover:text-foreground text-base p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Saldo atual: <strong className="text-foreground">{formatCurrency(selectedUser.balance)}</strong>
              </p>

              <div>
                <label className="text-muted-foreground block mb-1">Novo Saldo (MT)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newBalanceInput}
                  onChange={(e) => setNewBalanceInput(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-base font-bold text-primary focus:border-primary focus:outline-none"
                />
              </div>

              {/* Quick Preset Balance Additions */}
              <div className="pt-1 flex gap-1.5 text-[11px]">
                {[500, 1000, 5000].map((bonus) => (
                  <button
                    key={bonus}
                    type="button"
                    onClick={() => setNewBalanceInput(String(selectedUser.balance + bonus))}
                    className="flex-1 rounded-lg bg-secondary py-1 font-semibold text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    +{bonus}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="flex-1 rounded-full border border-border py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-primary text-primary-foreground py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Confirmar Saldo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
