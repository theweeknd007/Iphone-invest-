import React from 'react';
import {
  User,
  Smartphone,
  Mail,
  ShieldCheck,
  Wallet,
  Coins,
  History,
  CreditCard,
  Lock,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';
import { formatCurrency, formatDate } from '../data/plans';

export const AccountDetailsView: React.FC = () => {
  const { profile, adjustmentLogs } = useSession();

  const details = [
    { label: 'ID de Utilizador', value: profile ? `ID ${profile.id}` : '—', icon: User },
    { label: 'Número de Telemóvel', value: profile?.phone ? `+258 ${profile.phone}` : '—', icon: Smartphone },
    { label: 'Email Vinculado', value: profile?.email || 'Não associado', icon: Mail },
    { label: 'Tipo de Conta', value: profile?.role === 'admin' ? 'Administrador Oficial' : 'Investidor Padrão', icon: ShieldCheck },
    { label: 'Saldo Disponível (Líquido)', value: formatCurrency(profile?.balance ?? 0), icon: Wallet, highlight: true },
    { label: 'Bónus Congelado / Fidelidade', value: formatCurrency(profile?.bonusBalance ?? 0), icon: Lock },
    { label: 'Total Recarregado e Aprovado', value: formatCurrency(profile?.totalRecharged ?? 0), icon: Coins },
    { label: 'Total Levantado com Sucesso', value: formatCurrency(profile?.totalWithdrawn ?? 0), icon: History },
    { label: 'Rendimentos Acumulados', value: formatCurrency(profile?.accumulatedYield ?? 0), icon: Sparkles },
    {
      label: 'Carteira Móvel Configurada',
      value: profile?.wallet ? `${profile.wallet.provider} (${profile.wallet.phone})` : 'Não configurada',
      icon: CreditCard,
    },
    { label: 'Titular Registado na Carteira', value: profile?.wallet?.holderName || '—', icon: User },
    { label: 'Meu Código de Convite', value: profile?.inviteCode || '—', icon: Sparkles },
    { label: 'Convidado por', value: profile?.referredBy || 'Registo Direto', icon: User },
    { label: 'Data de Abertura da Conta', value: profile?.createdAt ? formatDate(profile.createdAt) : '—', icon: Calendar },
  ];

  const myLogs = adjustmentLogs.filter((log) => log.targetUserId === profile?.id);

  return (
    <AppLayout title="Detalhes da Conta" backTo="/conta" hideNav>
      <div className="space-y-4 fade-up max-w-lg mx-auto">
        <dl className="surface-card overflow-hidden rounded-3xl border border-border/80 shadow-xs">
          {details.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center justify-between gap-3 px-5 py-3.5 text-sm ${
                  idx !== details.length - 1 ? 'border-b border-border/60' : ''
                } ${item.highlight ? 'bg-primary/5' : ''}`}
              >
                <dt className="flex items-center gap-2 text-muted-foreground font-semibold">
                  <Icon className="size-4 text-primary shrink-0" />
                  <span>{item.label}</span>
                </dt>
                <dd className={`shrink-0 font-bold ${item.highlight ? 'text-primary font-black text-base' : 'text-foreground'}`}>
                  {item.value}
                </dd>
              </div>
            );
          })}
        </dl>

        {/* Audit Log for this user */}
        {myLogs.length > 0 && (
          <div className="surface-card rounded-3xl p-5 border border-border/80 shadow-xs space-y-3">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <span>Registo Oficial de Ajustes & Bónus Administrativos</span>
            </h3>

            <div className="space-y-2">
              {myLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl bg-slate-50 border border-border/70 p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="capitalize text-foreground">{log.type.replace('_', ' ')}</span>
                    <span className={log.newBalance >= log.previousBalance ? 'text-emerald-600' : 'text-rose-600'}>
                      {log.newBalance >= log.previousBalance ? '+' : '-'}{formatCurrency(log.amount)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Saldo: {formatCurrency(log.previousBalance)} → <strong className="text-foreground">{formatCurrency(log.newBalance)}</strong>
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Motivo: <span className="text-foreground font-medium">{log.reason}</span> • {formatDate(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pt-1">
          Todos os saldos e transações são verificados de forma criptográfica e auditados pela administração.
        </p>
      </div>
    </AppLayout>
  );
};
