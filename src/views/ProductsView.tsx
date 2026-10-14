import React, { useState, useEffect } from 'react';
import {
  Wallet,
  BadgeDollarSign,
  Headphones,
  Check,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Zap,
  Users,
  CalendarCheck,
  Lock,
  ChevronRight,
  TrendingUp,
  Volume2,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { PlanCard } from '../components/PlanCard';
import { formatCurrency } from '../data/plans';
import { useSession } from '../context/SessionContext';
import { Plan } from '../types';
import { AppleLogo } from '../components/AppleLogo';

type CategoryTab = 'all' | 'classic' | 'pro' | 'ultra';

interface LivePayout {
  id: string;
  phone: string;
  amount: number;
  timeAgo: string;
  type: 'saque' | 'investimento';
  model?: string;
}

export const ProductsView: React.FC = () => {
  const { navigateTo, buyPlan, profile, plans, settings } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Live Payouts & Activities Ticker (DellMZ / Icarda Fund proof of activity)
  const [liveActivities, setLiveActivities] = useState<LivePayout[]>([
    { id: '1', phone: '84***29', amount: 2500, timeAgo: 'há 1 min', type: 'saque' },
    { id: '2', phone: '86***81', amount: 5000, timeAgo: 'há 2 min', type: 'investimento', model: 'iPhone 13' },
    { id: '3', phone: '85***14', amount: 1800, timeAgo: 'há 4 min', type: 'saque' },
    { id: '4', phone: '84***93', amount: 10000, timeAgo: 'há 5 min', type: 'investimento', model: 'iPhone 14' },
    { id: '5', phone: '87***05', amount: 3200, timeAgo: 'há 7 min', type: 'saque' },
    { id: '6', phone: '84***62', amount: 25000, timeAgo: 'há 9 min', type: 'investimento', model: 'iPhone 15' },
  ]);

  const [currentLiveIndex, setCurrentLiveIndex] = useState(0);

  // Cycle through live activities
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLiveIndex((prev) => (prev + 1) % liveActivities.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [liveActivities.length]);

  // Carousel banners
  const banners = [
    {
      badge: 'OFICIAL APPLE INVEST',
      title: 'Rendimento Fixo de 5% ao Dia',
      description: 'Ative equipamentos Apple com retorno diário garantido em Meticais e levantamentos rápidos via M-Pesa e e-Mola.',
      highlight: '9 Modelos Disponíveis',
      gradient: 'from-blue-900 via-slate-900 to-black',
    },
    {
      badge: 'PAGAMENTOS DIÁRIOS',
      title: 'Levantamentos Seguros em 24h',
      description: 'Taxa fixa transparente de 20%. Solicite saques diretos para a sua carteira móvel sem complicações.',
      highlight: 'M-Pesa & e-Mola 24/7',
      gradient: 'from-slate-900 via-emerald-950 to-black',
    },
    {
      badge: 'PROGRAMA VIP DE AFILIADOS',
      title: 'Ganhe Comissões em 3 Níveis',
      description: 'Receba 29% no Nível 1, 2% no Nível 2 e 1% no Nível 3 por cada recarga confirmada de convidados.',
      highlight: 'Comissão Instantânea',
      gradient: 'from-indigo-950 via-slate-900 to-black',
    },
  ];

  // Auto-advance banner carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % banners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const whatsappGroup =
    settings.whatsappGroupUrl ||
    'https://chat.whatsapp.com/CqtV80fMgy8Eqx7iWFjaYW?s=cl&p=a&mlu=4&ilr=4';

  const handleBuyClick = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const confirmPurchase = () => {
    if (!selectedPlan) return;
    const success = buyPlan(selectedPlan);
    if (success) {
      setSelectedPlan(null);
    }
  };

  // Filter plans based on category tabs
  const filteredPlans = plans.filter((plan) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'classic') return ['iphone-x', 'iphone-11', 'iphone-12'].includes(plan.id);
    if (activeTab === 'pro') return ['iphone-13', 'iphone-14', 'iphone-15'].includes(plan.id);
    if (activeTab === 'ultra') return ['iphone-16', 'iphone-17', 'iphone-18'].includes(plan.id);
    return true;
  });

  const currentLive = liveActivities[currentLiveIndex];

  return (
    <AppLayout title="Início">
      {/* =========================================================================
          BROADCAST ALERT BANNER (If enabled by Admin)
          ========================================================================= */}
      {settings.broadcastAlert?.active && (
        <div
          className={`fade-up -mt-2 mb-3 flex items-start gap-3 rounded-2xl p-3.5 border shadow-xs ${
            settings.broadcastAlert.type === 'urgent'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : settings.broadcastAlert.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : settings.broadcastAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-blue-50 border-blue-300 text-blue-950'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {settings.broadcastAlert.type === 'urgent' ? (
              <AlertCircle className="size-5 text-rose-600" />
            ) : settings.broadcastAlert.type === 'warning' ? (
              <AlertCircle className="size-5 text-amber-600" />
            ) : settings.broadcastAlert.type === 'success' ? (
              <Check className="size-5 text-emerald-600" />
            ) : (
              <Sparkles className="size-5 text-blue-600" />
            )}
          </div>
          <div className="flex-1 text-sm">
            {settings.broadcastAlert.title && (
              <p className="font-extrabold text-sm mb-0.5">{settings.broadcastAlert.title}</p>
            )}
            <p className="leading-snug font-medium">{settings.broadcastAlert.message}</p>
          </div>
        </div>
      )}

      {/* =========================================================================
          1. OFFICIAL ANNOUNCEMENT MARQUEE (DellMZ / Icarda Fund Style)
          ========================================================================= */}
      <div className="fade-up -mt-1 mb-4 flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-950">
        <Volume2 className="size-5 shrink-0 text-amber-600 animate-pulse" />
        <div className="overflow-hidden whitespace-nowrap">
          <p className="inline-block animate-marquee font-bold text-sm sm:text-base">
            {settings.officialAnnouncement || '📢 Comunicado Oficial: Rendimentos fixos de 5% ao dia. Levantamentos processados via M-Pesa e e-Mola com taxa de 20%. Participe no grupo VIP de WhatsApp!'}
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. DYNAMIC CAROUSEL HERO (DellMZ / Icarda Fund Style)
          ========================================================================= */}
      <section className={`fade-up overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br ${banners[carouselIndex].gradient} p-5 sm:p-7 text-white relative shadow-xl transition-all duration-700 min-h-[175px] sm:min-h-[190px] flex flex-col justify-between`}>
        {/* Glow ambient background effect */}
        <div className="absolute -top-16 -right-16 size-56 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-56 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-slate-100 border border-white/15">
            <AppleLogo className="size-3.5" />
            <span>{banners[carouselIndex].badge}</span>
          </div>

          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-snug">
            {banners[carouselIndex].title}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-md line-clamp-2">
            {banners[carouselIndex].description}
          </p>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="relative z-10 pt-3 flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-400 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
            {banners[carouselIndex].highlight}
          </span>
          <div className="flex items-center gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCarouselIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  carouselIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/40'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. USER BALANCE SUMMARY & FROZEN BONUS CARD (DellMZ / Icarda Fund Style)
          ========================================================================= */}
      <section className="surface-card fade-up mt-3.5 rounded-2xl p-4.5 border border-border/70 shadow-sm bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/60">
          <div>
            <p className="text-sm text-muted-foreground font-semibold">Saldo Disponível (Levantável)</p>
            <p className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-0.5">
              {formatCurrency(profile?.balance ?? 0)}
            </p>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 px-3.5 py-2 text-sm">
            <Lock className="size-4.5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Bónus Congelado
              </p>
              <p className="font-display text-base font-black text-amber-950">
                {formatCurrency(profile?.bonusBalance ?? 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Deposit & Withdraw High-Priority Buttons */}
        <div className="pt-3.5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigateTo('/recarregar')}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary text-white py-3.5 px-4 text-base font-bold shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
          >
            <Wallet className="size-4.5" />
            <span>Depositar</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('/levantar')}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white py-3.5 px-4 text-base font-bold shadow-md hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          >
            <BadgeDollarSign className="size-4.5 text-emerald-400" />
            <span>Levantar ({settings.withdrawalFeePercent ?? 20}%)</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          4. HIGHLIGHTED QUICK ACTION GRID (DellMZ / Icarda Fund Style)
          ========================================================================= */}
      <nav className="fade-up mt-3.5 grid grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => navigateTo('/recarregar')}
          className="surface-card flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-all hover:shadow-md hover:border-primary/40 active:scale-95 cursor-pointer group"
        >
          <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-primary group-hover:scale-105 transition-transform">
            <Wallet className="size-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground">Depósito</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">M-Pesa / e-Mola</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('/levantar')}
          className="surface-card flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-all hover:shadow-md hover:border-primary/40 active:scale-95 cursor-pointer group"
        >
          <div className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
            <BadgeDollarSign className="size-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground">Saque</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">Taxa {settings.withdrawalFeePercent ?? 20}%</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('/equipa')}
          className="surface-card flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-all hover:shadow-md hover:border-primary/40 active:scale-95 cursor-pointer group"
        >
          <div className="grid size-11 place-items-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
            <Users className="size-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground">Equipa</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">Comissão 29%</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('/conta/checkin')}
          className="surface-card flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-all hover:shadow-md hover:border-primary/40 active:scale-95 cursor-pointer group"
        >
          <div className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
            <CalendarCheck className="size-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground">Check-in</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">+MT 5 grátis</span>
        </button>
      </nav>


      {/* =========================================================================
          5. LIVE RECENT ACTIVITIES TICKER (Proof of Payouts & Investments)
          ========================================================================= */}
      <div className="fade-up mt-3.5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs overflow-hidden">
          <div className="flex items-center gap-1 text-emerald-600 font-bold shrink-0">
            <Activity className="size-3.5 animate-pulse" />
            <span>Ao Vivo:</span>
          </div>
          <div className="truncate text-foreground font-medium">
            {currentLive.type === 'saque' ? (
              <span>
                Utilizador <strong className="text-foreground">{currentLive.phone}</strong> levantou{' '}
                <strong className="text-emerald-600">{formatCurrency(currentLive.amount)}</strong> via M-Pesa ({currentLive.timeAgo})
              </span>
            ) : (
              <span>
                Utilizador <strong className="text-foreground">{currentLive.phone}</strong> investiu no{' '}
                <strong className="text-primary">{currentLive.model}</strong> ({currentLive.timeAgo})
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigateTo('/regras')}
          className="shrink-0 text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
        >
          <span>Regras</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {/* =========================================================================
          6. WHATSAPP VIP COMMUNITY HIGHLIGHT
          ========================================================================= */}
      <a
        href={whatsappGroup}
        target="_blank"
        rel="noreferrer"
        className="fade-up mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-white p-4 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:scale-105 transition-transform shadow-xs">
            <MessageCircle className="size-6" />
          </div>
          <div>
            <p className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <span>Grupo Oficial WhatsApp • APPLE INVEST</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-800 font-extrabold uppercase tracking-wide">
                AO VIVO
              </span>
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              Comunidade exclusiva com provas diárias de saque e novidades.
            </p>
          </div>
        </div>
        <span className="shrink-0 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-xs group-hover:bg-emerald-500 transition-colors">
          <span>Aceder</span>
          <ExternalLink className="size-4" />
        </span>
      </a>

      {/* =========================================================================
          7. CATEGORY TABS & AVAILABLE IPHONE CATALOG GRID (DellMZ / Icarda Style)
          ========================================================================= */}
      <div className="mt-7 mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <AppleLogo className="size-4.5 text-foreground" />
              <span>Grelha de iPhones Disponíveis para Investir</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Todos os planos pagam exatamente <strong>5% de lucro ao dia</strong> a cada 24 horas.
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
            5% Lucro Diário
          </span>
        </div>

        {/* Filter Segmented Control Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos os iPhones ({plans.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('classic')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'classic'
                ? 'bg-white text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Série Clássica (X - 12)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pro')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pro'
                ? 'bg-white text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Série Pro (13 - 15)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ultra')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ultra'
                ? 'bg-white text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Série Ultra (16 - 18)
          </button>
        </div>
      </div>

      {/* =========================================================================
          RESPONSIVE PRODUCTS GRID (1 Col mobile, 2 Cols tablet, 3 Cols desktop)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredPlans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onBuy={handleBuyClick} />
        ))}
      </div>

      {/* =========================================================================
          INVESTMENT CONFIRMATION MODAL
          ========================================================================= */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="surface-card w-full max-w-md rounded-3xl p-6 border border-border/80 bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-slate-100 text-foreground">
                  <AppleLogo className="size-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground text-base">
                    Investir no {selectedPlan.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{selectedPlan.model}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-slate-100 hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Valor do Investimento</span>
                <span className="font-bold text-foreground">{formatCurrency(selectedPlan.price)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Rendimento Diário (5%)</span>
                <span className="font-bold text-emerald-600">+{formatCurrency(selectedPlan.dailyYield)} / dia</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Duração do Ciclo</span>
                <span className="font-semibold text-foreground">{selectedPlan.days} dias</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Retorno Total Estimado</span>
                <span className="font-extrabold text-primary">
                  {formatCurrency(selectedPlan.dailyYield * selectedPlan.days)}
                </span>
              </div>
              <div className="flex justify-between py-2 bg-slate-50 rounded-xl px-3">
                <span className="text-muted-foreground font-medium">O seu saldo disponível</span>
                <span
                  className={`font-bold ${
                    profile && profile.balance >= selectedPlan.price
                      ? 'text-foreground'
                      : 'text-destructive'
                  }`}
                >
                  {profile ? formatCurrency(profile.balance) : 'MT 0'}
                </span>
              </div>
            </div>

            {profile && profile.balance < selectedPlan.price ? (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>
                  Saldo insuficiente para investimento. Faltam{' '}
                  <strong>{formatCurrency(selectedPlan.price - profile.balance)}</strong>. Recarregue
                  via M-Pesa ou e-Mola para ativar este iPhone.
                </span>
              </div>
            ) : null}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-bold text-foreground hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Voltar
              </button>

              {profile && profile.balance < selectedPlan.price ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(null);
                    navigateTo('/recarregar');
                  }}
                  className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm sm:text-base font-bold hover:bg-primary/90 transition-colors cursor-pointer shadow-md shadow-primary/20"
                >
                  Depositar Saldo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={confirmPurchase}
                  className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm sm:text-base font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/25"
                >
                  <Check className="size-4.5" />
                  Confirmar Investimento
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
