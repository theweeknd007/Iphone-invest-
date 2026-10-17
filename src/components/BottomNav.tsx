import React from 'react';
import { LayoutGrid, Smartphone, Users, User, MessageSquare } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useChat } from '../context/ChatContext';
import { RoutePath } from '../types';

export const BottomNav: React.FC = () => {
  const { currentRoute, navigateTo } = useSession();
  const { totalUnreadCount } = useChat();

  const navItems = [
    { to: '/' as RoutePath, label: 'Produtos', icon: LayoutGrid, exact: true },
    { to: '/meus-produtos' as RoutePath, label: 'Produtos', icon: Smartphone, exact: false },
    { to: '/chat' as RoutePath, label: 'Chat VIP', icon: MessageSquare, exact: false, badge: totalUnreadCount },
    { to: '/equipa' as RoutePath, label: 'Equipa', icon: Users, exact: false },
    { to: '/conta' as RoutePath, label: 'Conta', icon: User, exact: false },
  ];

  const isActive = (itemTo: RoutePath) => {
    if (itemTo === '/') return currentRoute === '/';
    return currentRoute.startsWith(itemTo);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-card/95 backdrop-blur shadow-lg md:hidden">
      <ul className="grid grid-cols-5">
        {navItems.map(({ to, label, icon: Icon, badge }) => {
          const active = isActive(to);
          return (
            <li key={to}>
              <button
                type="button"
                onClick={() => navigateTo(to)}
                className={`relative flex w-full flex-col items-center gap-1 px-1 py-2 text-xs font-semibold transition-colors ${
                  active ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className="size-5 shrink-0" strokeWidth={1.8} />
                  {typeof badge === 'number' && badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2 grid size-4 place-items-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white animate-pulse">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  ) : null}
                </div>
                <span className="truncate">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};
