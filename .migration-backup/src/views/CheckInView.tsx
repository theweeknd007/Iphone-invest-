import React, { useState } from 'react';
import { CalendarCheck, Loader2, Check } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';
import { formatCurrency } from '../data/plans';

export const CheckInView: React.FC = () => {
  const { dailyCheckIn, profile } = useSession();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleCheckIn = () => {
    setStatus('loading');
    setTimeout(() => {
      const res = dailyCheckIn();
      if (res.success) {
        setStatus('success');
        setMessage(res.message);
      } else {
        setStatus('error');
        setMessage(res.message);
      }
    }, 400);
  };

  const checkedDays = profile?.checkInDays || [];

  return (
    <AppLayout title="Check-in diário" backTo="/conta" hideNav>
      <div className="surface-card fade-up flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-secondary text-primary shadow-inner">
          <CalendarCheck className="size-7" strokeWidth={1.6} />
        </div>

        <p className="font-display text-lg font-semibold text-foreground">
          Bónus diário de {formatCurrency(5)}
        </p>

        <p className="text-base text-muted-foreground max-w-xs">
          Um check-in por dia. O bónus entra directamente no saldo da conta.
        </p>

        <button
          type="button"
          onClick={handleCheckIn}
          disabled={status === 'loading'}
          className="mt-2 w-full rounded-full bg-primary text-primary-foreground py-2.5 px-4 text-sm font-semibold shadow hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          {status === 'loading' && <Loader2 className="size-4 animate-spin" />}
          {status === 'success' ? 'Check-in Realizado' : 'Fazer check-in'}
        </button>

        {status === 'error' && (
          <p className="rounded-xl bg-destructive/15 px-3 py-2 text-sm text-destructive w-full">
            {message}
          </p>
        )}

        {status === 'success' && (
          <p className="rounded-xl bg-success/15 px-3 py-2 text-sm text-success w-full">
            {message}
          </p>
        )}
      </div>

      <div className="fade-up mt-4 grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, i) => {
          const dayNumber = i + 1;
          const isDone = checkedDays.includes(dayNumber);
          return (
            <div
              key={i}
              className={`surface-card grid aspect-square place-items-center rounded-xl text-sm transition-all ${
                isDone
                  ? 'border-primary/60 bg-primary/20 text-primary font-bold shadow-xs'
                  : 'text-muted-foreground'
              }`}
            >
              {isDone ? (
                <div className="flex flex-col items-center gap-0.5">
                  <Check className="size-3 text-primary" strokeWidth={3} />
                  <span className="text-[10px]">D{dayNumber}</span>
                </div>
              ) : (
                <span>D{dayNumber}</span>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};
