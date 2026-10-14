import React from 'react';
import { Receipt } from 'lucide-react';
import { Transaction } from '../types';
import { EmptyState } from './EmptyState';
import { formatCurrency, formatDate } from '../data/plans';

interface TransactionListProps {
  items: Transaction[];
  emptyLabel: string;
}

const statusClasses: Record<string, string> = {
  pendente: 'bg-warning/15 text-warning',
  concluido: 'bg-success/15 text-success',
  falhado: 'bg-destructive/15 text-destructive',
};

export const TransactionList: React.FC<TransactionListProps> = ({ items, emptyLabel }) => {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={emptyLabel}
        description="Ainda não existem registos nesta secção."
      />
    );
  }

  return (
    <ul className="fade-up space-y-3">
      {items.map((item) => (
        <li key={item.id} className="surface-card rounded-2xl p-4 border border-border/70">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold text-foreground">
                {formatCurrency(item.amount)}
              </p>
              {item.type === 'levantamento' && (
                <p className="text-[10px] text-emerald-400 font-medium">
                  Valor final (10% taxa): {formatCurrency(item.amount * 0.9)}
                </p>
              )}
              <p className="truncate text-sm text-muted-foreground mt-0.5">
                {item.method} · {formatDate(item.createdAt)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${
                statusClasses[item.status] ?? 'bg-secondary text-muted-foreground'
              }`}
            >
              {item.status}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};
