import React from 'react';
import {
  ChevronLeft,
  LayoutGrid,
  Smartphone,
  Users,
  User,
  Wallet,
  BadgeDollarSign,
  Headphones,
  ShieldAlert,
} from 'lucide-react';
import { BottomNav } from './BottomNav';
import { useSession } from '../context/SessionContext';
import { RoutePath } from '../types';
import { AppleLogo } from './AppleLogo';
import { formatCurrency } from '../data/plans';

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
  backTo?: RoutePath;
  action?: React.ReactNode;
  hideNav?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  title,
  children,
  backTo,
  action,
  hideNav = false,
}) => {
  const { currentRoute, navigateTo, profile, signedIn } = useSession();

  const navItems = [
    { to: '/' as RoutePath, label: 'Produtos', icon: LayoutGrid },
    { to: '/meus-produtos' as RoutePath, label: 'Meus Equipamentos', icon: Smartphone },
    { to: '/equipa' as RoutePath, label: 'Minha Equipa', icon: Users },
    { to: '/conta' as RoutePath, label: 'Minha Conta', icon: User },
  ];

  const totalBalance = (profile?.balance ?? 0) + (profile?.bonusBalance ?? 0);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      {/* =========================================================================
          DESKTOP & TABLET TOP NAVIGATION BAR (md:flex)
          ========================================================================= */}
      <header className="sticky top-0 z-40 hidden border-b border-border/80 bg-white/95 backdrop-blur-md md:block shadow-xs">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Brand Logo & Name */}
          <div
            onClick={() => navigateTo('/')}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="grid size-9 place-items-center rounded-xl bg-foreground text-background shadow-sm">
              <AppleLogo className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-base font-extrabold tracking-tight text-foreground leading-none">
                APPLE INVEST
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
                Investimento Oficial em Tecnologia
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = to === '/' ? currentRoute === '/' : currentRoute.startsWith(to);
              return (
                <button
                  key={to}
                  type="button"
                  onClick={() => navigateTo(to)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-slate-100 text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop User Quick Actions & Balance */}
          <div className="flex items-center gap-3">
            {signedIn ? (
              <div className="flex items-center gap-2 rounded-full border border-border bg-slate-50 py-1 px-3 shadow-xs">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-muted-foreground font-semibold">Saldo</span>
                  <span className="font-display text-xs font-extrabold text-foreground">
                    {formatCurrency(totalBalance)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('/recarregar')}
                  className="rounded-full bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                  title="Recarregar"
                >
                  <Wallet className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigateTo('/entrar')}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Entrar / Criar Conta
              </button>
            )}

            <button
              type="button"
              onClick={() => navigateTo('/suporte')}
              className="grid size-9 place-items-center rounded-full border border-border bg-white text-muted-foreground hover:text-foreground hover:border-slate-300 transition-colors cursor-pointer"
              title="Apoio ao cliente"
            >
              <Headphones className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE TOP HEADER (md:hidden)
          ========================================================================= */}
      <header className="sticky top-0 z-30 brand-gradient border-b border-border/70 bg-white/95 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center px-2 pt-[env(safe-area-inset-top)]">
          <div className="flex h-12 items-center">
            {backTo ? (
              <button
                type="button"
                onClick={() => navigateTo(backTo)}
                aria-label="Voltar"
                className="grid size-9 place-items-center rounded-full text-foreground/85 transition-colors hover:bg-slate-100"
              >
                <ChevronLeft className="size-5" />
              </button>
            ) : (
              <div
                onClick={() => navigateTo('/')}
                className="grid size-8 place-items-center rounded-lg bg-foreground text-background ml-1 cursor-pointer"
              >
                <AppleLogo className="size-4.5" />
              </div>
            )}
          </div>

          <h1 className="truncate text-center text-[15px] font-bold text-foreground">
            {title}
          </h1>

          <div className="flex h-12 items-center justify-end text-sm text-foreground/80">
            {action || (
              <button
                type="button"
                onClick={() => navigateTo('/suporte')}
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-foreground"
              >
                <Headphones className="size-4.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN RESPONSIVE CONTENT AREA
          Adapts cleanly to mobile (max-w-md), tablet (max-w-3xl), desktop (max-w-6xl)
          ========================================================================= */}
      <main
        className={`flex-1 w-full mx-auto px-4 sm:px-6 md:px-8 pt-4 md:pt-6 ${
          hideNav ? 'pb-10 md:pb-12' : 'pb-24 md:pb-12'
        } max-w-md md:max-w-5xl lg:max-w-6xl`}
      >
        {children}
      </main>

      {/* =========================================================================
          DESKTOP FOOTER (hidden on mobile)
          ========================================================================= */}
      <footer className="hidden md:block border-t border-border/80 bg-slate-50 py-8 text-center text-xs text-muted-foreground mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AppleLogo className="size-4 text-foreground" />
            <span className="font-semibold text-foreground">APPLE INVEST</span>
            <span>• Todos os direitos reservados © 2026</span>
          </div>

          <div className="flex items-center gap-4 font-medium">
            <button
              type="button"
              onClick={() => navigateTo('/sobre')}
              className="hover:text-foreground hover:underline cursor-pointer"
            >
              Sobre Nós
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/regras')}
              className="hover:text-foreground hover:underline cursor-pointer"
            >
              Regras da Plataforma
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/suporte')}
              className="hover:text-foreground hover:underline cursor-pointer"
            >
              Apoio ao Cliente
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/admin')}
              className="hover:text-foreground hover:underline cursor-pointer flex items-center gap-1"
            >
              <ShieldAlert className="size-3" />
              <span>Painel Admin</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      {!hideNav && <BottomNav />}
    </div>
  );
};
