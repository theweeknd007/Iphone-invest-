import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';
import { formatCurrency } from '../data/plans';

export const AccountDetailsView: React.FC = () => {
  const { profile } = useSession();

  const details = [
    { label: 'ID de utilizador', value: profile?.id ?? '—' },
    { label: 'Telefone', value: profile?.phone ?? '—' },
    { label: 'Saldo Total', value: formatCurrency((profile?.balance ?? 0) + (profile?.bonusBalance ?? 0)) },
    { label: 'Saldo Levantável', value: formatCurrency(profile?.balance ?? 0) },
    { label: 'Saldo de Bónus/Indicações', value: formatCurrency(profile?.bonusBalance ?? 0) },
    { label: 'Total recarregado', value: formatCurrency(profile?.totalRecharged ?? 0) },
    { label: 'Total levantado', value: formatCurrency(profile?.totalWithdrawn ?? 0) },
    { label: 'Rendimento acumulado', value: formatCurrency(profile?.accumulatedYield ?? 0) },
  ];

  return (
    <AppLayout title="Detalhes da conta" backTo="/conta" hideNav>
      <dl className="surface-card fade-up overflow-hidden rounded-2xl border border-border/70">
        {details.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3.5 text-base last:border-0"
          >
            <dt className="min-w-0 truncate text-muted-foreground">{item.label}</dt>
            <dd className="shrink-0 font-medium text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Os movimentos detalhados são atualizados em tempo real conforme as operações efetuadas.
      </p>
    </AppLayout>
  );
};
