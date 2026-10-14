import React, { useState } from 'react';
import { CreditCard, Save } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';

export const WalletView: React.FC = () => {
  const { profile, updateWallet } = useSession();
  const [provider, setProvider] = useState<'M-Pesa' | 'e-Mola'>(
    profile?.wallet?.provider ?? 'M-Pesa'
  );
  const [phone, setPhone] = useState(profile?.wallet?.phone ?? profile?.phone ?? '');
  const [holderName, setHolderName] = useState(profile?.wallet?.holderName ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWallet(provider, phone, holderName);
  };

  return (
    <AppLayout title="Carteira móvel" backTo="/conta" hideNav>
      <form onSubmit={handleSubmit} className="space-y-4 fade-up">
        <div className="surface-card rounded-2xl p-4 border border-border/70 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
              <CreditCard className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Dados de receção
              </h2>
              <p className="text-sm text-muted-foreground">
                Vincule o número M-Pesa ou e-Mola para levantamentos rápidos.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Operadora / Serviço</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('M-Pesa')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 border text-sm font-medium transition-all cursor-pointer ${
                  provider === 'M-Pesa'
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-secondary/50 text-muted-foreground'
                }`}
              >
                <span>Vodacom M-Pesa</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('e-Mola')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 border text-sm font-medium transition-all cursor-pointer ${
                  provider === 'e-Mola'
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-secondary/50 text-muted-foreground'
                }`}
              >
                <span>Movitel e-Mola</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Número de telefone</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 841234567"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nome completo do titular</label>
            <input
              type="text"
              required
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="Nome conforme registo no SIM card"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-primary text-primary-foreground py-3 text-sm font-semibold shadow hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Save className="size-4" />
          <span>Guardar dados da carteira</span>
        </button>
      </form>
    </AppLayout>
  );
};
