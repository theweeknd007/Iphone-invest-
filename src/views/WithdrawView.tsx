import React, { useState } from 'react';
import { BadgeDollarSign, Smartphone, ArrowRight, CheckCircle, Info } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';
import { formatCurrency } from '../data/plans';

export const WithdrawView: React.FC = () => {
  const { withdraw, profile, navigateTo, settings } = useSession();
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'M-Pesa' | 'e-Mola'>('M-Pesa');
  const [phone, setPhone] = useState<string>(profile?.wallet?.phone ?? profile?.phone ?? '');
  const [holderName, setHolderName] = useState<string>(profile?.wallet?.holderName ?? '');
  const [submitted, setSubmitted] = useState(false);

  const numAmount = Number(amount) || 0;

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount < 100) return;
    const ok = withdraw(numAmount, method, phone);
    if (ok) {
      setSubmitted(true);
    }
  };

  const handleAllBalance = () => {
    if (profile?.balance) {
      setAmount(String(profile.balance));
    }
  };

  return (
    <AppLayout title="Levantar" backTo="/conta" hideNav>
      {submitted ? (
        <div className="surface-card fade-up rounded-2xl p-6 text-center border border-border/70 space-y-4">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-success/20 text-success">
            <CheckCircle className="size-8" />
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Pedido de levantamento registado!
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O valor de <span className="font-semibold text-foreground">{formatCurrency(numAmount)}</span> foi submetido. Devido à taxa de {settings.withdrawalFeePercent ?? 20}%, receberá <span className="font-semibold text-foreground">{formatCurrency(numAmount * (1 - (settings.withdrawalFeePercent ?? 20) / 100))}</span> na sua carteira {method} ({phone}).
          </p>
          <div className="rounded-xl bg-secondary/70 p-3.5 text-xs text-muted-foreground text-left space-y-1">
            <p className="font-medium text-foreground">Informações de processamento:</p>
            <p>• Prazo estimado: 1 a 24 horas úteis</p>
            <p>• Taxa de serviço: {settings.withdrawalFeePercent ?? 20}% de comissão da plataforma APPLE INVEST</p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigateTo('/conta/levantamentos')}
              className="w-full rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-semibold shadow hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Ver histórico de levantamentos
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/conta')}
              className="w-full rounded-full border border-border py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Voltar à minha conta
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleWithdraw} className="space-y-4">
          {/* Balance card */}
          <div className="surface-card fade-up flex items-center justify-between rounded-2xl p-4 border border-border/70">
            <div>
              <p className="text-sm text-muted-foreground">Saldo disponível para levantamento</p>
              <p className="font-display text-lg font-bold text-primary">
                {formatCurrency(profile?.balance ?? 0)}
              </p>
            </div>
            <div className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
              <BadgeDollarSign className="size-5" />
            </div>
          </div>

          {/* Amount input */}
          <div className="surface-card fade-up rounded-2xl p-4 border border-border/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Montante a levantar</label>
              <button
                type="button"
                onClick={handleAllBalance}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Levantar tudo
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-base font-bold text-muted-foreground">
                MT
              </span>
              <input
                type="number"
                min="100"
                max={profile?.balance ?? 0}
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-12 pr-3 py-3 text-lg font-bold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Montante mínimo de levantamento: MT {settings.minWithdrawal || 100}.
            </p>
          </div>

          {/* Method selector */}
          <div className="surface-card fade-up rounded-2xl p-4 border border-border/70 space-y-2.5">
            <label className="text-sm font-medium text-foreground">Canal de destino</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('M-Pesa')}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 px-2 border text-sm font-medium transition-all cursor-pointer ${
                  method === 'M-Pesa'
                    ? 'border-primary bg-primary/15 text-primary shadow-xs'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="size-2 rounded-full bg-rose-500" />
                <span>Vodacom M-Pesa</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('e-Mola')}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 px-2 border text-sm font-medium transition-all cursor-pointer ${
                  method === 'e-Mola'
                    ? 'border-primary bg-primary/15 text-primary shadow-xs'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="size-2 rounded-full bg-amber-500" />
                <span>Movitel e-Mola</span>
              </button>
            </div>
          </div>

          {/* Account Details */}
          <div className="surface-card fade-up rounded-2xl p-4 border border-border/70 space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Smartphone className="size-3.5 text-primary" />
                Número da carteira móvel
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 841234567"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Nome do titular da conta
              </label>
              <input
                type="text"
                required
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="Nome completo registado no M-Pesa / e-Mola"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Rules info */}
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 p-3.5 text-xs text-amber-900 border border-amber-500/20">
            <Info className="size-4.5 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p>É aplicada uma <strong>taxa de serviço de {settings.withdrawalFeePercent ?? 20}%</strong> sobre o valor do levantamento.</p>
              <p>Certifique-se de que os dados do titular conferem exatamente com os do SIM card para evitar rejeição na operadora.</p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={numAmount < (settings.minWithdrawal || 100) || (profile?.balance ?? 0) < numAmount}
            className="w-full rounded-2xl bg-slate-900 text-white py-4 text-base font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Confirmar Levantamento (Receberá {formatCurrency(numAmount * (1 - (settings.withdrawalFeePercent ?? 20) / 100) || 0)})</span>
            <ArrowRight className="size-4 text-emerald-400" />
          </button>
        </form>
      )}
    </AppLayout>
  );
};
