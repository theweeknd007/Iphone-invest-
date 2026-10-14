import React from 'react';
import { LayoutGrid, Smartphone, Users, User } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { RoutePath } from '../types';

export const BottomNav: React.FC = () => {
  const { currentRoute, navigateTo } = useSession();

  const navItems = [
    { to: '/' as RoutePath, label: 'Produtos', icon: LayoutGrid, exact: true },
    { to: '/meus-produtos' as RoutePath, label: 'Meus produtos', icon: Smartphone, exact: false },
    { to: '/equipa' as RoutePath, label: 'Minha equipa', icon: Users, exact: false },
    { to: '/conta' as RoutePath, label: 'Minha conta', icon: User, exact: false },
  ];

  const isActive = (itemTo: RoutePath) => {
    if (itemTo === '/') return currentRoute === '/';
    return currentRoute.startsWith(itemTo);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-card/95 backdrop-blur shadow-lg md:hidden">
      <ul className="grid grid-cols-4">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = isActive(to);
          return (
            <li key={to}>
              <button
                type="button"
                onClick={() => navigateTo(to)}
                className={`flex w-full flex-col items-center gap-1 px-1 py-2 text-xs font-semibold transition-colors ${
                  active ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-5 shrink-0" strokeWidth={1.8} />
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
