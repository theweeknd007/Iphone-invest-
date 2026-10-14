import React, { useState } from 'react';
import { Smartphone, Lock, UserPlus, Sparkles } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';
import { AppleLogo } from '../components/AppleLogo';

export const RegisterView: React.FC = () => {
  const { signUp, navigateTo } = useSession();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;
    
    const ok = signUp(phone, password, inviteCode);
    if (ok) {
      navigateTo('/conta');
    }
  };

  const handleQuickCreateTestAccount = () => {
    const randomSuffix = Math.floor(1000000 + Math.random() * 8999999);
    const testPhone = `84${randomSuffix.toString().slice(0, 7)}`;
    const ok = signUp(testPhone, '123456', inviteCode);
    if (ok) {
      navigateTo('/conta');
    }
  };

  return (
    <AppLayout title="Criar Conta" backTo="/conta" hideNav>
      <div className="space-y-5 fade-up">
        {/* Brand visual banner */}
        <div className="surface-card rounded-2xl p-8 text-center border border-border/70 space-y-3">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-foreground text-background shadow-lg">
            <AppleLogo className="size-8" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">
            APPLE INVEST
          </h2>
          <p className="text-sm text-muted-foreground">
            Registe o seu número real de telemóvel para começar a investir em equipamentos Apple e obter 5% de lucro diário.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="surface-card rounded-2xl p-5 border border-border/70 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <Smartphone className="size-3.5 text-primary" />
              Número de telemóvel (Moçambique)
            </label>
            <div className="flex rounded-xl border border-border bg-background overflow-hidden focus-within:border-primary transition-colors">
              <span className="bg-secondary/70 px-3 py-3 text-sm text-muted-foreground font-semibold flex items-center">
                +258
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 841234567, 85..., 86..."
                className="w-full bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <Lock className="size-3.5 text-primary" />
              Palavra-passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma palavra-passe"
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <UserPlus className="size-3.5 text-primary" />
              Código de convite (Opcional)
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Ex: IPH4920"
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none uppercase transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-primary text-primary-foreground py-3.5 text-base font-semibold shadow hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <UserPlus className="size-4" />
            <span>Concluir registo</span>
          </button>
          
          {/* Quick test registration helper */}
          <div className="pt-3 flex flex-col gap-3 text-center border-t border-border/40 mt-4">
            <p className="text-sm text-muted-foreground">
              Já possui uma conta?{' '}
              <button 
                type="button" 
                onClick={() => navigateTo('/entrar')}
                className="font-semibold text-primary hover:underline cursor-pointer"
              >
                Iniciar Sessão
              </button>
            </p>

            <button
              type="button"
              onClick={handleQuickCreateTestAccount}
              className="w-full text-sm font-medium text-amber-800 hover:text-amber-900 cursor-pointer flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/10 py-2.5 border border-amber-500/20 transition-colors"
            >
              <Sparkles className="size-3.5" />
              <span>Gerar Utilizador de Teste Rapidamente</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};
