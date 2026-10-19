import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Sparkles, Check, AlertCircle, Info } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { formatDate } from '../data/plans';

export const NotificationBell: React.FC = () => {
  const { notifications, markNotificationAsRead, signedIn, profile } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notificationsList = (notifications || []).filter(
    (n) => n.userId === 'all' || (profile && n.userId === profile.id) || !n.userId
  );
  const unreadCount = notificationsList.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!signedIn) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative grid size-9 place-items-center rounded-full border border-border bg-white text-muted-foreground hover:text-foreground hover:border-slate-300 transition-colors cursor-pointer shadow-xs"
        title="Notificações"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-border/60 bg-secondary/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              <h4 className="font-display text-xs font-bold text-foreground">
                Notificações ({notificationsList.length})
              </h4>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markNotificationAsRead()}
                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                <CheckCheck className="size-3.5" />
                <span>Marcar lidas</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
            {notificationsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <Bell className="size-6 mx-auto text-muted-foreground/50 mb-1" />
                <p className="font-semibold text-foreground">Sem notificações no momento.</p>
                <p className="text-[11px]">As aprovações de saldos e bónus aparecerão aqui instantaneamente.</p>
              </div>
            ) : (
              notificationsList.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markNotificationAsRead(n.id)}
                  className={`p-3.5 text-xs transition-colors cursor-pointer flex items-start gap-2.5 ${
                    n.read ? 'bg-card opacity-75' : 'bg-primary/5 font-medium'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {n.type === 'success' ? (
                      <div className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="size-3.5" />
                      </div>
                    ) : n.type === 'error' || n.type === 'warning' ? (
                      <div className="grid size-6 place-items-center rounded-full bg-rose-100 text-rose-700">
                        <AlertCircle className="size-3.5" />
                      </div>
                    ) : (
                      <div className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary">
                        <Info className="size-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-foreground truncate">{n.title}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  {!n.read && (
                    <span className="size-2 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
