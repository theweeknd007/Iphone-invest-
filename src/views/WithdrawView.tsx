import React, { useState } from 'react';
import {
  BadgeDollarSign,
  Smartphone,
  ArrowRight,
  CheckCircle,
  Info,
  ShieldCheck,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';
import { formatCurrency } from '../data/plans';
import { toast } from 'sonner';

export const WithdrawView: React.FC = () => {
  const { withdraw, updateWallet, profile, navigateTo, settings } = useSession();
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'M-Pesa' | 'e-Mola'>(
    profile?.wallet?.provider ?? 'M-Pesa'
  );
  const [phone, setPhone] = useState<string>(
    profile?.wallet?.phone ?? profile?.phone ?? ''
  );
  const [holderName, setHolderName] = useState<string>(
    profile?.wallet?.holderName ?? ''
  );
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const numAmount = Number(amount) || 0;
  const minWithdrawal = settings.minWithdrawal || 100;
  const feePercent = settings.withdrawalFeePercent ?? 20;
  const feeAmount = Math.round(numAmount * (feePercent / 100));
  const netAmount = Math.max(0, numAmount - feeAmount);

  const availableBalance = profile?.balance ?? 0;

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error('Inicie sessão para efetuar um levantamento.');
      navigateTo('/entrar');
      return;
    }
    if (numAmount < minWithdrawal) {
      toast.error(`O valor mínimo para levantamento é MT ${minWithdrawal}.`);
      return;
    }
    if (numAmount > availableBalance) {
      toast.error('Saldo disponível insuficiente.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      toast.error('Introduza o número de telemóvel da carteira móvel.');
      return;
    }
    if (!holderName.trim()) {
      toast.error('Introduza o nome completo do titular conforme o registo no SIM.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleExecuteWithdrawal = () => {
    setShowConfirmModal(false);
    updateWallet(method, phone, holderName);
    const ok = withdraw(numAmount, method, phone);
    if (ok) {
      setSubmitted(true);
    }
  };

  const handleAllBalance = () => {
    if (availableBalance > 0) {
      setAmount(String(availableBalance));
    }
  };

  return (
    <AppLayout title="Levantar Fundos" backTo="/conta" hideNav>
      <div className="space-y-4 fade-up max-w-lg mx-auto">
        {submitted ? (
          <div className="surface-card rounded-3xl p-6 sm:p-8 text-center border border-border/80 shadow-md space-y-4">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle className="size-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Processamento Iniciado
              </span>
              <h2 className="font-display text-xl font-bold text-foreground mt-3">
                Pedido de Levantamento Registado!
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                O seu pedido de levantamento de <strong className="text-foreground">{formatCurrency(numAmount)}</strong> foi enviado para processamento.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-border/80 p-4 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Solicitado:</span>
                <span className="font-bold text-foreground">{formatCurrency(numAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa da Plataforma ({feePercent}%):</span>
                <span className="font-bold text-rose-600">-{formatCurrency(feeAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-1.5">
                <span className="font-bold text-foreground">Valor Líquido a Receber:</span>
                <span className="font-display font-black text-emerald-600 text-sm">{formatCurrency(netAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Canal de Destino:</span>
                <span className="font-bold text-foreground">{method} (+258 {phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Titular da Conta:</span>
                <span className="font-bold text-foreground">{holderName}</span>
              </div>
              <div className="pt-2 border-t border-border/60 text-muted-foreground">
                <p>• Prazo de liquidação: 1 a 24 horas úteis via M-Pesa / e-Mola.</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigateTo('/conta/levantamentos')}
                className="w-full rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-bold shadow hover:bg-primary/90 transition-all cursor-pointer"
              >
                Ver Histórico de Levantamentos
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/conta')}
                className="w-full rounded-2xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                Voltar à Minha Conta
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleOpenConfirm} className="space-y-4">
            {/* Balance Card */}
            <div className="surface-card flex items-center justify-between rounded-3xl p-4.5 border border-border/80 shadow-xs">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Saldo Disponível para Saque</p>
                <p className="font-display text-2xl font-black text-emerald-600 mt-0.5">
                  {formatCurrency(availableBalance)}
                </p>
                {profile?.bonusBalance && profile.bonusBalance > 0 ? (
                  <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                    🔒 Bónus congelado: {formatCurrency(profile.bonusBalance)} (desbloqueável via compras/ações)
                  </p>
                ) : null}
              </div>
              <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <BadgeDollarSign className="size-6" />
              </div>
            </div>

            {/* Amount input with live calculation */}
            <div className="surface-card rounded-3xl p-5 border border-border/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-foreground">Montante a Levantar</label>
                <button
                  type="button"
                  onClick={handleAllBalance}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  Levantar Saldo Total
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-3 text-base font-black text-muted-foreground">
                  MT
                </span>
                <input
                  type="number"
                  min={minWithdrawal}
                  max={availableBalance}
                  required
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background pl-14 pr-4 py-3 text-xl font-black text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Dynamic Fee & Net Receive Breakdown */}
              {numAmount > 0 && (
                <div className="rounded-2xl bg-slate-50 border border-border/70 p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxa da plataforma ({feePercent}%):</span>
                    <span className="font-semibold text-rose-600">-{formatCurrency(feeAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground border-t border-border/60 pt-1.5 text-sm">
                    <span>Valor Líquido a Receber:</span>
                    <span className="font-display font-black text-emerald-600 text-base">
                      {formatCurrency(netAmount)}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground font-medium">
                Mínimo de levantamento: <strong>{formatCurrency(minWithdrawal)}</strong>. Taxa fixa de {feePercent}%.
              </p>
            </div>

            {/* Destination Method selector */}
            <div className="surface-card rounded-3xl p-4.5 border border-border/80 shadow-xs space-y-3">
              <label className="text-sm font-bold text-foreground">Canal de Destino</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMethod('M-Pesa')}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-3 border text-sm font-bold transition-all cursor-pointer ${
                    method === 'M-Pesa'
                      ? 'border-red-500 bg-red-50 text-red-700 shadow-xs ring-2 ring-red-500/20'
                      : 'border-border bg-slate-50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="size-2.5 rounded-full bg-red-600 shrink-0" />
                  <span>Vodacom M-Pesa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('e-Mola')}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-3 border text-sm font-bold transition-all cursor-pointer ${
                    method === 'e-Mola'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-xs ring-2 ring-amber-500/20'
                      : 'border-border bg-slate-50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="size-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Movitel e-Mola</span>
                </button>
              </div>
            </div>

            {/* Beneficiary Details */}
            <div className="surface-card rounded-3xl p-5 border border-border/80 shadow-xs space-y-3.5">
              <label className="text-sm font-bold text-foreground">Dados do Beneficiário</label>

              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                  <Smartphone className="size-3.5 text-primary" />
                  Número da Carteira Móvel (+258) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 841234567"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                  <ShieldCheck className="size-3.5 text-primary" />
                  Nome do Titular da Conta *
                </label>
                <input
                  type="text"
                  required
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="Nome completo conforme registo do SIM"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Security Notice */}
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-start gap-3 text-xs text-amber-900">
              <Info className="size-4.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>
                  <strong>Aviso de Segurança:</strong> O nome do titular e número devem coincidir exatamente com os dados da operadora ({method}).
                </p>
                <p>
                  Os levantamentos são processados diariamente pela administração em horários úteis.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={numAmount < minWithdrawal || numAmount > availableBalance}
              className="w-full rounded-2xl bg-slate-900 text-white py-4 text-base font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Submeter Levantamento ({formatCurrency(netAmount)} Líquido)</span>
              <ArrowRight className="size-4.5 text-emerald-400" />
            </button>
          </form>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
            <div className="surface-card w-full max-w-sm rounded-3xl p-6 border border-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="text-center space-y-1">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-6" />
                </div>
                <h3 className="font-display font-bold text-base text-foreground">
                  Confirmar Levantamento
                </h3>
                <p className="text-xs text-muted-foreground">
                  Verifique os dados com atenção antes da dedução do saldo.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montante Solicitado:</span>
                  <span className="font-bold text-foreground">{formatCurrency(numAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa da Plataforma ({feePercent}%):</span>
                  <span className="font-bold text-rose-600">-{formatCurrency(feeAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-1.5">
                  <span className="font-bold text-foreground">Valor a Receber no SIM:</span>
                  <span className="font-display font-black text-emerald-600 text-sm">{formatCurrency(netAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destino:</span>
                  <span className="font-bold text-foreground">{method} (+258 {phone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Titular:</span>
                  <span className="font-bold text-foreground">{holderName}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="w-1/3 rounded-2xl border border-border py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  Corrigir
                </button>
                <button
                  type="button"
                  onClick={handleExecuteWithdrawal}
                  className="flex-1 rounded-2xl bg-slate-900 text-white py-2.5 text-xs sm:text-sm font-bold shadow hover:bg-slate-800 cursor-pointer"
                >
                  Confirmar Saque
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
