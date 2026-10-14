import React, { useState } from 'react';
import { Wallet, Smartphone, CheckCircle, ArrowRight, ShieldCheck, Hash } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';
import { formatCurrency } from '../data/plans';

const PRESET_AMOUNTS = [400, 800, 2000, 8000, 20000, 50000];

export const RechargeView: React.FC = () => {
  const { recharge, profile, navigateTo, settings } = useSession();
  const [selectedAmount, setSelectedAmount] = useState<number>(800);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [method, setMethod] = useState<'M-Pesa' | 'e-Mola'>('M-Pesa');
  const [phone, setPhone] = useState<string>(profile?.phone ?? '');
  const [reference, setReference] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < 100) return;
    recharge(finalAmount, method, phone, reference);
    setSubmitted(true);
  };

  return (
    <AppLayout title="Recarregar" backTo="/conta" hideNav>
      {submitted ? (
        <div className="surface-card fade-up rounded-2xl p-6 text-center border border-border/70 space-y-4">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-success/20 text-success">
            <CheckCircle className="size-8" />
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Recarga registada com sucesso!
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O valor de <span className="font-semibold text-foreground">{formatCurrency(finalAmount)}</span> foi registado na sua conta via {method} ({phone}).
          </p>
          {reference && (
            <div className="rounded-xl bg-secondary/70 p-3 text-sm text-muted-foreground text-left">
              <span className="font-semibold text-foreground">Referência da transação:</span> {reference}
            </div>
          )}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="w-full rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-semibold shadow hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Ir para o catálogo de equipamentos
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setReference('');
              }}
              className="w-full rounded-full border border-border py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Fazer outra recarga
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRecharge} className="space-y-4">
          {/* Current Balance Card */}
          <div className="surface-card fade-up flex items-center justify-between rounded-2xl p-4 border border-border/70">
            <div>
              <p className="text-sm text-muted-foreground">Saldo atual da conta</p>
              <p className="font-display text-lg font-bold text-primary">
                {formatCurrency((profile?.balance ?? 0) + (profile?.bonusBalance ?? 0))}
              </p>
            </div>
            <div className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
              <Wallet className="size-5" />
            </div>
          </div>

          {/* Official Channel Info */}
          <div className="surface-card fade-up rounded-2xl p-3.5 border border-primary/30 bg-primary/5 text-sm space-y-1.5">
            <div className="flex items-center gap-1.5 text-primary font-semibold">
              <ShieldCheck className="size-4" />
              <span>Canais Oficiais de Pagamento Moçambique</span>
            </div>
            <p className="text-foreground text-sm font-semibold mt-1">
              {method === 'M-Pesa'
                ? `Vodacom M-Pesa Oficial: ${settings.mpesaOfficialNumber || '84 900 1234'} (${settings.mpesaOfficialName || 'APPLE INVEST MOZ'})`
                : `Movitel e-Mola Oficial: ${settings.emolaOfficialNumber || '86 900 1234'} (${settings.emolaOfficialName || 'APPLE INVEST MOZ'})`}
            </p>
          </div>

          {/* Payment Method Selector */}
          <div className="surface-card fade-up rounded-2xl p-4 border border-border/70 space-y-2.5">
            <label className="text-sm font-medium text-foreground">Método de pagamento</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('M-Pesa')}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 px-2 border text-sm font-medium transition-all cursor-pointer ${
                  method === 'M-Pesa'
                    ? 'border-primary bg-primary/15 text-primary shadow-xs font-semibold'
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
                    ? 'border-primary bg-primary/15 text-primary shadow-xs font-semibold'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="size-2 rounded-full bg-amber-500" />
                <span>Movitel e-Mola</span>
              </button>
            </div>
          </div>

          {/* Preset Amounts */}
          <div className="surface-card fade-up rounded-2xl p-4 border border-border/70 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Escolha o montante</label>
              <span className="text-xs font-semibold text-muted-foreground">Mínimo: MT {settings.minRecharge || 100}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`rounded-xl py-2.5 px-2 text-center text-sm font-semibold border transition-all cursor-pointer ${
                    selectedAmount === amt && !customAmount
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border bg-secondary/40 text-foreground hover:bg-secondary'
                  }`}
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>

            {/* Custom Amount Field */}
            <div className="pt-1">
              <input
                type="number"
                placeholder="Ou digite outro valor (ex: 1500)"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(0);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Mobile Phone Number */}
          <div className="surface-card fade-up rounded-2xl p-4 border border-border/70 space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Smartphone className="size-3.5 text-primary" />
              Número de telemóvel pagador
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 841234567 ou 861234567"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Transaction Reference / ID */}
          <div className="surface-card fade-up rounded-2xl p-4 border border-border/70 space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Hash className="size-3.5 text-primary" />
              Referência do SMS de pagamento (Opcional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: MP260909.1234.A0123"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none uppercase"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!finalAmount || finalAmount < 100}
            className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Confirmar Depósito de {formatCurrency(finalAmount || 0)}</span>
            <ArrowRight className="size-4" />
          </button>
        </form>
      )}
    </AppLayout>
  );
};
