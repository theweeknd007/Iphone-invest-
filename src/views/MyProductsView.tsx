import React, { useState, useEffect } from 'react';
import {
  PackageOpen,
  Coins,
  Clock,
  CheckCircle2,
  FastForward,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { EmptyState } from '../components/EmptyState';
import { useSession } from '../context/SessionContext';
import { formatCurrency, formatDate } from '../data/plans';
import { Purchase } from '../types';

export const MyProductsView: React.FC = () => {
  const { purchases, navigateTo, checkAndProcess24hYields, profile } = useSession();
  const [now, setNow] = useState(Date.now());

  // Real-time second counter for countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activePurchases = purchases.filter((p) => p.status === 'ativo');
  const completedPurchases = purchases.filter((p) => p.status === 'concluido');

  const totalDailyYield = activePurchases.reduce((acc, p) => acc + p.dailyYield, 0);
  const totalEarnedSoFar = purchases.reduce(
    (acc, p) => acc + (p.totalEarned ?? (p.daysCompleted || 0) * p.dailyYield),
    0
  );

  // Helper to calculate time left for next 24h cycle
  const getTimeRemaining = (purchase: Purchase) => {
    if (purchase.status === 'concluido') {
      return null;
    }
    const daysCompleted = purchase.daysCompleted ?? 0;
    const purchaseTime = new Date(purchase.purchasedAt).getTime();
    // Next payout happens at: purchaseTime + (daysCompleted + 1) * 24h
    const nextPayoutTarget = purchaseTime + (daysCompleted + 1) * 24 * 60 * 60 * 1000;
    const diff = nextPayoutTarget - now;

    if (diff <= 0) {
      return 'A processar crédito...';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}h ${minutes
      .toString()
      .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  return (
    <AppLayout title="Meus equipamentos">
      {/* 3 Metric Summary Boxes */}
      <div className="grid grid-cols-3 gap-2">
        <div className="surface-card flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center border border-border/60">
          <span className="font-display text-base font-bold text-primary">
            {formatCurrency(totalDailyYield)}
          </span>
          <span className="text-[11px] leading-tight text-muted-foreground">
            Rendimento / 24h
          </span>
        </div>

        <div className="surface-card flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center border border-border/60">
          <span className="font-display text-base font-bold text-foreground">
            {activePurchases.length}
            <span className="text-sm font-normal text-muted-foreground"> / {purchases.length}</span>
          </span>
          <span className="text-[11px] leading-tight text-muted-foreground">
            Ciclos Activos
          </span>
        </div>

        <div className="surface-card flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center border border-border/60">
          <span className="font-display text-base font-bold text-emerald-600">
            {formatCurrency(totalEarnedSoFar)}
          </span>
          <span className="text-[11px] leading-tight text-muted-foreground">
            Total Já Pago
          </span>
        </div>
      </div>

      {/* 24-Hour Automated System Explainer Banner */}
      <div className="surface-card fade-up mt-3 rounded-2xl p-4 border border-emerald-200 bg-emerald-50/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            <span>Crédito Automático de 24 em 24 Horas</span>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('/conta/rendimentos')}
            className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium hover:underline cursor-pointer"
          >
            <span>Ver histórico</span>
            <ArrowRight className="size-3" />
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          O rendimento de cada equipamento é depositado <strong className="text-foreground">automaticamente</strong> no seu saldo a cada 24 horas até que o ciclo de dias termine. Não precisa de solicitar manualmente.
        </p>

        <div className="pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const res = checkAndProcess24hYields();
              if (res === 0) {
                // Toast info
              }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-secondary/80 border border-border/70 py-2 px-3 text-[11px] font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3.5 text-primary" />
            <span>Sincronizar Ciclos</span>
          </button>
        </div>
      </div>

      {/* Empty State or Active Products List */}
      {purchases.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="Ainda não comprou nenhum equipamento"
          description="Escolha um equipamento no catálogo para começar a gerar rendimento diário de 24 em 24 horas."
          action={
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="inline-flex items-center justify-center whitespace-nowrap font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 text-sm mt-2 rounded-full"
            >
              Ver catálogo de equipamentos
            </button>
          }
        />
      ) : (
        <div className="mt-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base md:text-lg font-bold text-foreground">
              Os Seus Equipamentos ({purchases.length})
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              {completedPurchases.length > 0
                ? `${completedPurchases.length} concluído(s)`
                : 'Todos em ciclo ativo'}
            </span>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchases.map((purchase) => {
              const daysCompleted = purchase.daysCompleted ?? 0;
              const totalDays = purchase.days;
              const percentage = Math.min(100, Math.round((daysCompleted / totalDays) * 100));
              const isCompleted = purchase.status === 'concluido' || daysCompleted >= totalDays;
              const countdown = getTimeRemaining(purchase);
              const earnedSoFar = purchase.totalEarned ?? daysCompleted * purchase.dailyYield;
              const totalExpected = purchase.dailyYield * purchase.days;

              return (
                <li
                  key={purchase.id}
                  className={`surface-card rounded-2xl p-4 border transition-all ${
                    isCompleted
                      ? 'border-border/60 bg-secondary/15 opacity-85'
                      : 'border-emerald-500/40 bg-card shadow-sm'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold text-foreground">
                        {purchase.planName}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{purchase.model}</p>
                    </div>

                    {isCompleted ? (
                      <span className="shrink-0 flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        <CheckCircle2 className="size-3 text-emerald-400" />
                        <span>Ciclo Concluído</span>
                      </span>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Activo (24h)</span>
                      </span>
                    )}
                  </div>

                  {/* Cycle Progress Bar */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">
                        Progresso do Ciclo: <strong className="text-foreground">Dia {daysCompleted}</strong> de {totalDays} dias
                      </span>
                      <span className="font-semibold text-primary">{percentage}%</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-secondary/80 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-emerald-500 to-primary'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* 24h Countdown Box */}
                  {!isCompleted && countdown && (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 text-sm border border-border/50">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Clock className="size-3.5 text-emerald-400" />
                        <span>Próximo crédito de 24h em:</span>
                      </span>
                      <span className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
                        {countdown}
                      </span>
                    </div>
                  )}

                  {/* Grid Metrics */}
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="rounded-xl bg-secondary/30 p-2 border border-border/40">
                      <dt className="text-muted-foreground">Rendimento / 24h</dt>
                      <dd className="font-semibold text-emerald-400 mt-0.5">
                        +{formatCurrency(purchase.dailyYield)}
                      </dd>
                    </div>

                    <div className="rounded-xl bg-secondary/30 p-2 border border-border/40">
                      <dt className="text-muted-foreground">Já Creditado</dt>
                      <dd className="font-semibold text-foreground mt-0.5">
                        {formatCurrency(earnedSoFar)}
                      </dd>
                    </div>

                    <div className="rounded-xl bg-secondary/30 p-2 border border-border/40">
                      <dt className="text-muted-foreground">Retorno do Ciclo</dt>
                      <dd className="font-semibold text-foreground mt-0.5">
                        {formatCurrency(totalExpected)}
                      </dd>
                    </div>
                  </dl>

                  {/* Card Actions */}
                  <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      Iniciado em: {formatDate(purchase.purchasedAt)}
                    </span>

                    {isCompleted && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" />
                        <span>Ciclo Terminado</span>
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </AppLayout>
  );
};
