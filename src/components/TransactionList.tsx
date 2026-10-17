import React from 'react';
import { Receipt, ArrowDownLeft, ArrowUpRight, Coins, Gift, Sliders } from 'lucide-react';
import { Transaction } from '../types';
import { EmptyState } from './EmptyState';
import { formatCurrency, formatDate } from '../data/plans';
import { useSession } from '../context/SessionContext';

interface TransactionListProps {
  items: Transaction[];
  emptyLabel: string;
}

const statusClasses: Record<string, { badge: string; text: string }> = {
  pendente: {
    badge: 'bg-amber-100 text-amber-800 border border-amber-300',
    text: 'Pendente',
  },
  concluido: {
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    text: 'Concluído',
  },
  falhado: {
    badge: 'bg-rose-100 text-rose-800 border border-rose-300',
    text: 'Rejeitado',
  },
};

export const TransactionList: React.FC<TransactionListProps> = ({ items, emptyLabel }) => {
  const { settings } = useSession();
  const feePercent = settings.withdrawalFeePercent ?? 20;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={emptyLabel}
        description="Ainda não existem transações registadas nesta secção da sua conta."
      />
    );
  }

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'recarga':
        return <ArrowDownLeft className="size-4 text-emerald-600" />;
      case 'levantamento':
        return <ArrowUpRight className="size-4 text-slate-700" />;
      case 'rendimento':
        return <Coins className="size-4 text-primary" />;
      case 'bonus':
        return <Gift className="size-4 text-amber-600" />;
      case 'ajuste':
        return <Sliders className="size-4 text-purple-600" />;
      default:
        return <Receipt className="size-4 text-muted-foreground" />;
    }
  };

  return (
    <ul className="fade-up space-y-3">
      {items.map((item) => {
        const isPositive =
          item.type === 'recarga' || item.type === 'rendimento' || item.type === 'bonus';
        const statusMeta = statusClasses[item.status] || {
          badge: 'bg-slate-100 text-slate-700 border border-slate-200',
          text: item.status,
        };

        return (
          <li
            key={item.id}
            className="surface-card rounded-3xl p-4 border border-border/80 shadow-xs hover:border-primary/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-slate-100 border border-border/60 mt-0.5">
                  {getTypeIcon(item.type)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-display text-base font-extrabold ${isPositive ? 'text-emerald-600' : 'text-foreground'}`}>
                      {isPositive ? '+' : '-'}{formatCurrency(item.amount)}
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {item.type}
                    </span>
                  </div>

                  {item.type === 'levantamento' && (
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      Líquido ({feePercent}% taxa): <strong className="text-emerald-700">{formatCurrency(item.amount * (1 - feePercent / 100))}</strong>
                    </p>
                  )}

                  <p className="text-xs text-foreground font-semibold truncate mt-0.5">
                    {item.method}
                  </p>

                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDate(item.createdAt)} {item.reference && `• Ref: ${item.reference}`}
                  </p>

                  {item.note && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                      Nota: {item.note}
                    </p>
                  )}
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusMeta.badge}`}
              >
                {statusMeta.text}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
