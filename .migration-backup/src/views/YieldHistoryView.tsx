import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { TransactionList } from '../components/TransactionList';
import { useSession } from '../context/SessionContext';
import { Coins, Sparkles } from 'lucide-react';
import { formatCurrency } from '../data/plans';

export const YieldHistoryView: React.FC = () => {
  const { transactions, profile } = useSession();
  const yields = transactions.filter((t) => t.type === 'rendimento');
  const totalYields = yields.reduce((acc, t) => acc + t.amount, 0);

  return (
    <AppLayout title="Histórico de rendimentos (24h)" backTo="/conta" hideNav>
      <div className="space-y-3">
        {/* Metric summary banner */}
        <div className="surface-card rounded-2xl p-4 border border-primary/40 bg-gradient-to-br from-primary/15 via-background to-secondary/30">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-primary/20 text-primary">
              <Coins className="size-6" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Total Acumulado de Ciclos 24h</p>
              <p className="font-display text-xl font-bold text-foreground">
                {formatCurrency(totalYields || profile?.accumulatedYield || 0)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground border-t border-border/40 pt-2.5">
            <Sparkles className="size-3.5 text-primary shrink-0" />
            <span>Crédito automático a cada 24 horas até ao término do ciclo contratado.</span>
          </div>
        </div>

        {/* List */}
        <TransactionList items={yields} emptyLabel="Sem rendimentos diários creditados ainda" />
      </div>
    </AppLayout>
  );
};
