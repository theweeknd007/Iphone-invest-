import React, { useState } from 'react';
import { Smartphone, Lock, LogIn, ShieldAlert } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';
import { AppleLogo } from '../components/AppleLogo';

export const LoginView: React.FC = () => {
  const { signIn, navigateTo, allUsers } = useSession();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;
    
    const ok = signIn(phone, password);
    if (ok) {
      navigateTo('/conta');
    }
  };

  return (
    <AppLayout title="Iniciar Sessão" backTo="/conta" hideNav>
      <div className="space-y-5 fade-up">
        {/* Brand visual banner */}
        <div className="surface-card rounded-2xl p-8 text-center border border-border/70 space-y-3">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-foreground text-background shadow-lg">
            <AppleLogo className="size-8" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">
            APPLE INVEST
          </h2>
          <p className="text-sm text-muted-foreground">
            Aceda à sua conta para gerir os seus equipamentos Apple e rendimentos diários.
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
              placeholder="Digite a sua palavra-passe"
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-primary text-primary-foreground py-3.5 text-base font-semibold shadow hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <LogIn className="size-4" />
            <span>Entrar na conta</span>
          </button>
          
          <div className="pt-3 text-center border-t border-border/40 mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Ainda não tem conta?{' '}
              <button 
                type="button" 
                onClick={() => navigateTo('/registo')}
                className="font-semibold text-primary hover:underline cursor-pointer"
              >
                Criar conta grátis
              </button>
            </p>

            {allUsers.length > 0 && (
              <p className="text-[10px] text-muted-foreground">
                {allUsers.length} conta(s) registada(s) no sistema
              </p>
            )}
          </div>
        </form>
      </div>
    </AppLayout>
  );
};
