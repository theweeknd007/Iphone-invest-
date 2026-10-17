import React, { useState } from 'react';
import {
  Wallet,
  Smartphone,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Hash,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';
import { formatCurrency } from '../data/plans';
import { toast } from 'sonner';

const PRESET_AMOUNTS = [400, 800, 2000, 8000, 20000, 50000];

export const RechargeView: React.FC = () => {
  const { recharge, profile, navigateTo, settings } = useSession();
  const [selectedAmount, setSelectedAmount] = useState<number>(800);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [method, setMethod] = useState<'M-Pesa' | 'e-Mola'>('M-Pesa');
  const [phone, setPhone] = useState<string>(profile?.phone ?? '');
  const [reference, setReference] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;
  const minRecharge = settings.minRecharge || 100;

  const currentOfficialNumber =
    method === 'M-Pesa'
      ? settings.mpesaOfficialNumber || '84 900 1234'
      : settings.emolaOfficialNumber || '86 900 1234';

  const currentOfficialName =
    method === 'M-Pesa'
      ? settings.mpesaOfficialName || 'APPLE INVEST MOZ'
      : settings.emolaOfficialName || 'APPLE INVEST MOZ';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text.replace(/\s+/g, ''));
    setCopiedKey(key);
    toast.success('Número copiado para a área de transferência!');
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < minRecharge) {
      toast.error(`O valor mínimo para recarga é MT ${minRecharge}.`);
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      toast.error('Introduza o seu número de telemóvel pagador.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteRecharge = () => {
    setShowConfirmModal(false);
    recharge(finalAmount, method, phone, reference);
    setSubmitted(true);
  };

  return (
    <AppLayout title="Depositar Fundos" backTo="/conta" hideNav>
      <div className="space-y-4 fade-up max-w-lg mx-auto">
        {submitted ? (
          <div className="surface-card rounded-3xl p-6 sm:p-8 text-center border border-border/80 shadow-md space-y-4">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
              <Clock className="size-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                Aguardando Validação
              </span>
              <h2 className="font-display text-xl font-bold text-foreground mt-3">
                Pedido de Depósito Registado!
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                O seu depósito de <strong className="text-foreground">{formatCurrency(finalAmount)}</strong> via {method} foi submetido à administração para verificação.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-border/80 p-4 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Canal de Pagamento:</span>
                <span className="font-bold text-foreground">{method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número Pagador:</span>
                <span className="font-bold text-foreground">+258 {phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conta Oficial de Destino:</span>
                <span className="font-bold text-foreground">{currentOfficialNumber}</span>
              </div>
              {reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referência SMS:</span>
                  <span className="font-mono font-bold text-primary">{reference}</span>
                </div>
              )}
              <div className="pt-2 border-t border-border/60 text-muted-foreground">
                <p>• O saldo será creditado automaticamente na sua conta assim que a administração confirmar a referência.</p>
                <p>• Tempo estimado: 5 a 20 minutos.</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigateTo('/conta/recargas')}
                className="w-full rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-bold shadow hover:bg-primary/90 transition-all cursor-pointer"
              >
                Acompanhar no Histórico de Recargas
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setReference('');
                }}
                className="w-full rounded-2xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                Efetuar Outro Depósito
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleOpenConfirm} className="space-y-4">
            {/* Current Balance Card */}
            <div className="surface-card flex items-center justify-between rounded-3xl p-4.5 border border-border/80 shadow-xs">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Saldo Atual da Conta</p>
                <p className="font-display text-2xl font-black text-primary mt-0.5">
                  {formatCurrency((profile?.balance ?? 0) + (profile?.bonusBalance ?? 0))}
                </p>
                {profile?.bonusBalance && profile.bonusBalance > 0 ? (
                  <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                    Inclui {formatCurrency(profile.bonusBalance)} de bónus congelado
                  </p>
                ) : null}
              </div>
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="size-6" />
              </div>
            </div>

            {/* Step 1: Select Method */}
            <div className="surface-card rounded-3xl p-4.5 border border-border/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-black">
                  1
                </div>
                <label className="text-sm font-bold text-foreground">Escolha o Método de Pagamento</label>
              </div>

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

            {/* Official Payment Channel Box with Copy Button */}
            <div className="surface-card rounded-3xl p-5 border border-primary/30 bg-primary/5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-primary" />
                  Canal Oficial de Pagamento
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Verificado
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-border flex items-center justify-between gap-3 shadow-inner">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {method === 'M-Pesa' ? 'Número M-Pesa Oficial' : 'Número e-Mola Oficial'}
                  </p>
                  <p className="font-display text-xl font-black text-foreground tracking-tight mt-0.5">
                    {currentOfficialNumber}
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    Titular: <span className="text-primary">{currentOfficialName}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(currentOfficialNumber, 'official')}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 text-white px-3 py-2 text-xs font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0"
                >
                  {copiedKey === 'official' ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed space-y-1">
                <p>
                  <strong>Instruções de envio:</strong> Efetue a transferência direta do montante pretendido no seu menu móvel (M-Pesa ou e-Mola) para o número oficial acima.
                </p>
              </div>
            </div>

            {/* Step 2: Amount Selection */}
            <div className="surface-card rounded-3xl p-4.5 border border-border/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-black">
                    2
                  </div>
                  <label className="text-sm font-bold text-foreground">Montante a Recarregar</label>
                </div>
                <span className="text-xs font-bold text-muted-foreground">Mínimo: {formatCurrency(minRecharge)}</span>
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
                    className={`rounded-2xl py-3 px-2 text-center text-sm font-black border transition-all cursor-pointer ${
                      selectedAmount === amt && !customAmount
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-slate-50 text-foreground hover:bg-slate-100'
                    }`}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div>
                <input
                  type="number"
                  min={minRecharge}
                  placeholder="Ou digite outro valor (ex: 1500)"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(0);
                  }}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Step 3: Payer Phone & Reference */}
            <div className="surface-card rounded-3xl p-4.5 border border-border/80 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-black">
                  3
                </div>
                <label className="text-sm font-bold text-foreground">Dados de Confirmação do Envio</label>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                  <Smartphone className="size-3.5 text-primary" />
                  Número do Telemóvel Pagador *
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
                  <Hash className="size-3.5 text-primary" />
                  Código de Referência do SMS Oficial *
                </label>
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: MP260909.1234.A0123"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-mono uppercase font-bold text-foreground focus:border-primary focus:outline-none tracking-wider"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Insira o ID ou código de transação recebido no SMS da Vodacom / Movitel.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!finalAmount || finalAmount < minRecharge}
              className="w-full rounded-2xl bg-primary text-primary-foreground py-4 text-base font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Submeter Depósito de {formatCurrency(finalAmount || 0)}</span>
              <ArrowRight className="size-4.5" />
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
                  Confirmar Envio do Depósito
                </h3>
                <p className="text-xs text-muted-foreground">
                  Revise os dados antes de submeter para aprovação administrativa.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montante:</span>
                  <span className="font-display font-black text-primary text-sm">{formatCurrency(finalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Canal:</span>
                  <span className="font-bold text-foreground">{method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conta Oficial de Destino:</span>
                  <span className="font-bold text-foreground">{currentOfficialNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seu Número Pagador:</span>
                  <span className="font-bold text-foreground">+258 {phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Código de Referência:</span>
                  <span className="font-mono font-bold text-foreground">{reference || 'Não informado'}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="w-1/3 rounded-2xl border border-border py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRecharge}
                  className="flex-1 rounded-2xl bg-primary text-primary-foreground py-2.5 text-xs sm:text-sm font-bold shadow hover:bg-primary/90 cursor-pointer"
                >
                  Confirmar e Submeter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
