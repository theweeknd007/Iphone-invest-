import React from 'react';
import { Smartphone, ShieldAlert } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { AppleLogo } from './AppleLogo';

export const ModeSwitcherBar: React.FC = () => {
  const { currentRoute, navigateTo, transactions } = useSession();

  const isAdmin = currentRoute === '/admin';

  const pendingWithdrawalsCount = transactions.filter(
    (t) => t.type === 'levantamento' && t.status === 'pendente'
  ).length;

  return (
    <div className="w-full bg-white border-b border-border text-foreground sticky top-0 z-50 shadow-sm">
      <div className="max-w-md md:max-w-4xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
        {/* Brand label */}
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-foreground flex items-center justify-center text-background font-bold text-sm shadow-xs">
            <AppleLogo className="size-3.5" />
          </div>
          <span className="font-display text-sm font-bold tracking-tight text-foreground hidden sm:inline">
            APPLE INVEST
          </span>
        </div>

        {/* Segmented Control: Interface do Usuário vs Interface do Admin */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-border shadow-inner">
          <button
            type="button"
            onClick={() => {
              if (isAdmin) navigateTo('/');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              !isAdmin
                ? 'bg-white text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Smartphone className="size-3.5" />
            <span>Interface do Usuário</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isAdmin) navigateTo('/admin');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer relative ${
              isAdmin
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldAlert className="size-3.5" />
            <span>Interface do Admin</span>
            {pendingWithdrawalsCount > 0 && (
              <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
