import React from 'react';
import {
  Wallet,
  BadgeDollarSign,
  CalendarCheck,
  FileText,
  Gift,
  History,
  CreditCard,
  Coins,
  Info,
  ShieldCheck,
  Headphones,
  ShieldAlert,
  LogOut,
  LogIn,
  ChevronRight,
  MessageCircle,
  LucideIcon,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';
import { formatCurrency } from '../data/plans';
import { RoutePath } from '../types';
import { toast } from 'sonner';
import { AppleLogo } from '../components/AppleLogo';

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  to?: RoutePath;
  onClick?: () => void;
}

export const AccountView: React.FC = () => {
  const { profile, signedIn, signOut, navigateTo, settings, redeemVoucher } = useSession();
  const whatsappGroup = settings.whatsappGroupUrl || 'https://chat.whatsapp.com/CqtV80fMgy8Eqx7iWFjaYW?s=cl&p=a&mlu=4&ilr=4';
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');

  const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, to, onClick }) => {
    const handleClick = () => {
      if (to) {
        navigateTo(to);
      } else if (onClick) {
        onClick();
      }
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-3 border-b border-border/60 px-4 py-3.5 text-left transition-colors last:border-0 hover:bg-secondary/60 cursor-pointer"
      >
        <Icon className="size-[18px] shrink-0 text-primary" strokeWidth={1.7} />
        <span className="min-w-0 flex-1 truncate text-base text-foreground">{label}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>
    );
  };

  return (
    <AppLayout title="Minha conta">
      {/* Header Profile Info */}
      <section className="fade-up brand-gradient -mx-4 -mt-4 md:mx-0 md:mt-0 px-4 md:px-6 pt-5 pb-12 rounded-b-2xl md:rounded-2xl border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary shadow-xs">
            <AppleLogo className="size-5.5" />
          </div>
          <p className="min-w-0 truncate text-base text-foreground font-semibold">
            {signedIn ? `ID ${profile?.id}` : 'Visitante'}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Número de telefone</p>
            <p className="truncate font-display text-base font-semibold text-foreground">
              {profile?.phone ?? '—'}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Saldo Disponível</p>
            <p className="truncate font-display text-base font-semibold text-primary">
              {formatCurrency(profile?.balance ?? 0)}
            </p>
            {profile?.bonusBalance && profile.bonusBalance > 0 ? (
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                🔒 Bónus congelado: {formatCurrency(profile.bonusBalance)}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Floating Action Buttons */}
      <div className="surface-card fade-up relative -mt-8 grid grid-cols-2 gap-3 rounded-2xl p-4 shadow-xl border border-primary/30 bg-white">
        <button
          type="button"
          onClick={() => navigateTo('/recarregar')}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 px-3 text-sm font-bold shadow-md hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
        >
          <Wallet className="size-4" />
          <span>Depositar</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('/levantar')}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white py-3 px-3 text-sm font-bold shadow-md hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
        >
          <BadgeDollarSign className="size-4 text-emerald-400" />
          <span>Levantar</span>
        </button>
      </div>

      {/* Account Operations & Session Menus in responsive 2-column on tablet/desktop */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Operations Menu */}
        <section className="surface-card fade-up overflow-hidden rounded-2xl border border-border/70">
          <MenuItem icon={CalendarCheck} label="Check-in diário (+MT 5)" to="/conta/checkin" />
          <MenuItem icon={FileText} label="Detalhes da conta" to="/conta/detalhes" />
          <MenuItem
            icon={Gift}
            label="Resgatar Código / Voucher de Bónus"
            onClick={() => setIsVoucherModalOpen(true)}
          />
          <MenuItem icon={History} label="Histórico de recargas" to="/conta/recargas" />
          <MenuItem icon={History} label="Histórico de levantamentos" to="/conta/levantamentos" />
          <MenuItem icon={Coins} label="Histórico de rendimentos (24h)" to="/conta/rendimentos" />
          <MenuItem icon={CreditCard} label="Conta de carteira móvel" to="/conta/carteira" />
        </section>

        {/* Info & Session Menu */}
        <section className="surface-card fade-up overflow-hidden rounded-2xl border border-border/70">
          <MenuItem
            icon={MessageCircle}
            label="Grupo Oficial do WhatsApp"
            onClick={() => window.open(whatsappGroup, '_blank')}
          />
          <MenuItem icon={Info} label="Sobre nós" to="/sobre" />
          <MenuItem icon={ShieldCheck} label="Regras da plataforma" to="/regras" />
          <MenuItem icon={Headphones} label="Apoio ao cliente" to="/suporte" />
          <MenuItem icon={ShieldAlert} label="Painel de Administração (Admin)" to="/admin" />
          {signedIn ? (
            <MenuItem
              icon={LogOut}
              label="Terminar sessão"
              onClick={() => {
                signOut();
                toast.success('Sessão terminada');
              }}
            />
          ) : (
            <MenuItem icon={LogIn} label="Iniciar sessão" to="/entrar" />
          )}
        </section>
      </div>

      {/* Voucher Redemption Modal */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="surface-card w-full max-w-sm rounded-3xl p-6 border border-border/80 shadow-2xl space-y-4">
            <div className="text-center space-y-1.5">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Gift className="size-7" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Resgatar Código de Bónus
              </h3>
              <p className="text-xs text-muted-foreground">
                Introduza o código do cupão promocional fornecido pela administração da APPLE INVEST.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!voucherInput.trim()) return;
                const res = redeemVoucher(voucherInput.trim());
                if (res.success) {
                  toast.success(res.message);
                  setIsVoucherModalOpen(false);
                  setVoucherInput('');
                } else {
                  toast.error(res.message);
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <input
                  type="text"
                  required
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                  placeholder="Ex: APPLE2026, BONUSVIP"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-base font-bold text-foreground uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-bold shadow hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Resgatar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
