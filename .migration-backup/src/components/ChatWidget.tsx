import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useSession } from '../context/SessionContext';

export const ChatWidget: React.FC = () => {
  const { totalUnreadCount, isConnected } = useChat();
  const { currentRoute, navigateTo } = useSession();

  // Hide widget if already inside /chat
  if (currentRoute === '/chat') {
    return null;
  }

  return (
    <aside aria-label="Apoio e Chat em tempo real" className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6">
      <button
        type="button"
        onClick={() => navigateTo('/chat')}
        className="group relative flex items-center gap-2.5 rounded-full bg-primary px-4 py-3 text-white shadow-xl shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
        title="Conversar com Apoio Oficial"
      >
        <div className="relative">
          <MessageSquare className="size-5" />
          {/* Real-time status dot */}
          <span
            className={`absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-primary ${
              isConnected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
        </div>

        <span className="hidden sm:inline font-bold text-xs tracking-wide">
          Apoio em Direto
        </span>

        {/* Unread Message Badge */}
        {totalUnreadCount > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white animate-pulse shadow-md">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        )}
      </button>
    </aside>
  );
};
