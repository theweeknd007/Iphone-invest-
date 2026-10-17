import React, { useState } from 'react';
import { CreditCard, Save, Smartphone, User, ShieldCheck, Check } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';
import { toast } from 'sonner';

export const WalletView: React.FC = () => {
  const { profile, updateWallet } = useSession();
  const [provider, setProvider] = useState<'M-Pesa' | 'e-Mola'>(
    profile?.wallet?.provider ?? 'M-Pesa'
  );
  const [phone, setPhone] = useState(
    profile?.wallet?.phone ?? profile?.phone ?? ''
  );
  const [holderName, setHolderName] = useState(
    profile?.wallet?.holderName ?? ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      toast.error('Introduza um número de telemóvel válido de Moçambique.');
      return;
    }
    if (!holderName.trim()) {
      toast.error('Introduza o nome completo do titular conforme o registo na operadora.');
      return;
    }

    updateWallet(provider, cleanPhone, holderName.trim());
  };

  return (
    <AppLayout title="Carteira Móvel" backTo="/conta" hideNav>
      <div className="space-y-4 fade-up max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="surface-card rounded-3xl p-5 sm:p-6 border border-border/80 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <CreditCard className="size-6" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-foreground">
                  Dados de Receção de Levantamentos
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vincule a sua conta oficial M-Pesa ou e-Mola para liquidação direta de levantamentos.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Operadora / Serviço
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setProvider('M-Pesa')}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-3 border text-sm font-bold transition-all cursor-pointer ${
                    provider === 'M-Pesa'
                      ? 'border-red-500 bg-red-50 text-red-700 shadow-xs ring-2 ring-red-500/20'
                      : 'border-border bg-slate-50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="size-2.5 rounded-full bg-red-600 shrink-0" />
                  <span>Vodacom M-Pesa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('e-Mola')}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-3 border text-sm font-bold transition-all cursor-pointer ${
                    provider === 'e-Mola'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-xs ring-2 ring-amber-500/20'
                      : 'border-border bg-slate-50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="size-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Movitel e-Mola</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Smartphone className="size-3.5 text-primary" />
                Número de Telemóvel (+258) *
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <User className="size-3.5 text-primary" />
                Nome Completo do Titular *
              </label>
              <input
                type="text"
                required
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="Nome registado no SIM card da operadora"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="rounded-2xl bg-slate-50 border border-border/70 p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Para sua segurança, os pagamentos são emitidos apenas para contas cujo nome do titular seja idêntico ao registado no operador de telefonia.
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm sm:text-base font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="size-4.5" />
            <span>Guardar Carteira Móvel</span>
          </button>
        </form>
      </div>
    </AppLayout>
  );
};
