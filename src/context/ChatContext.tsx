import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, ChatConversation } from '../types';
import { useSession } from './SessionContext';
import { apiRequest, getStoredToken } from '../api/client';
import { toast } from 'sonner';

interface ChatContextType {
  conversations: ChatConversation[];
  messages: ChatMessage[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  sendMessage: (content: string, attachmentUrl?: string, attachmentType?: 'image' | 'video' | 'file') => Promise<boolean>;
  uploadChatMedia: (file: File) => Promise<{ url: string; attachmentType: 'image' | 'video' } | null>;
  markConversationAsRead: (conversationId: string) => void;
  totalUnreadCount: number;
  isConnected: boolean;
  isPeerOnline: boolean;
  peerTyping: boolean;
  sendTypingStatus: (isTyping: boolean) => void;
  loadMessagesForConversation: (convId: string) => Promise<void>;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

// Gentle, non-intrusive notification chime via Web Audio API
function playChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, signedIn, isAdminAuth } = useSession();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPeerOnline, setIsPeerOnline] = useState<boolean>(false);
  const [peerTyping, setPeerTyping] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Derive current effective user ID
  const effectiveUserId = profile?.id || 'visitor-guest';
  const effectiveRole: 'admin' | 'user' = (profile?.role === 'admin' || isAdminAuth) ? 'admin' : 'user';

  // Total unread messages count
  const totalUnreadCount = conversations.reduce((acc, c) => {
    return acc + (effectiveRole === 'admin' ? (c.unreadCount || 0) : (c.userUnreadCount || 0));
  }, 0);

  // Fetch initial conversations list
  const refreshConversations = useCallback(async () => {
    try {
      const query = effectiveRole === 'admin' ? '' : `?userId=${effectiveUserId}`;
      const res = await apiRequest<{ conversations: ChatConversation[] }>(`/chat/conversations${query}`);
      if (res.data?.conversations) {
        setConversations(res.data.conversations);
        // Default active conversation
        if (!activeConversationId && res.data.conversations.length > 0) {
          if (effectiveRole === 'admin') {
            setActiveConversationId(res.data.conversations[0].id);
          } else {
            setActiveConversationId(`conv-${effectiveUserId}`);
          }
        }
      }
    } catch {
      // Ignore network errors
    }
  }, [effectiveRole, effectiveUserId, activeConversationId]);

  // Load message history for a conversation
  const loadMessagesForConversation = useCallback(async (convId: string) => {
    if (!convId) return;
    try {
      const res = await apiRequest<{ messages: ChatMessage[] }>(`/chat/messages/${convId}`);
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (convId: string) => {
    if (!convId) return;
    try {
      await apiRequest(`/chat/read/${convId}`, {
        method: 'POST',
        body: JSON.stringify({ userId: effectiveUserId, role: effectiveRole }),
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            return {
              ...c,
              unreadCount: effectiveRole === 'admin' ? 0 : c.unreadCount,
              userUnreadCount: effectiveRole === 'user' ? 0 : c.userUnreadCount,
            };
          }
          return c;
        })
      );

      setMessages((prev) =>
        prev.map((m) => (m.conversationId === convId ? { ...m, read: true } : m))
      );
    } catch {
      // Ignore
    }
  }, [effectiveUserId, effectiveRole]);

  // Setup WebSocket connection
  useEffect(() => {
    let unmounted = false;

    function connectWs() {
      if (unmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (unmounted) return;
          setIsConnected(true);
          const token = getStoredToken();
          ws.send(JSON.stringify({
            type: 'auth',
            token,
            userId: effectiveUserId,
            role: effectiveRole,
            userName: profile?.name || (effectiveRole === 'admin' ? 'Suporte Apple Invest' : 'Cliente'),
          }));
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'message:new' && data.message) {
              const newMsg: ChatMessage = data.message;
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });

              // Play chime and trigger sonner toast if from someone else
              if (newMsg.senderId !== effectiveUserId) {
                playChime();
                toast.info(`Nova mensagem de ${newMsg.senderName}`, {
                  description: newMsg.content || (newMsg.attachmentType === 'video' ? 'Enviou um vídeo' : 'Enviou uma imagem'),
                  action: {
                    label: 'Ver Chat',
                    onClick: () => setIsChatOpen(true),
                  },
                });
              }

              // Update conversation snippet
              setConversations((prev) => {
                const existingIdx = prev.findIndex((c) => c.id === newMsg.conversationId);
                const updatedConv: ChatConversation = existingIdx >= 0 ? {
                  ...prev[existingIdx],
                  lastMessage: newMsg.content || (newMsg.attachmentType === 'video' ? '📹 Vídeo' : '📷 Foto'),
                  lastMessageAt: newMsg.timestamp,
                  unreadCount: effectiveRole === 'admin' && newMsg.senderRole !== 'admin'
                    ? (prev[existingIdx].unreadCount || 0) + 1
                    : prev[existingIdx].unreadCount,
                  userUnreadCount: effectiveRole === 'user' && newMsg.senderRole === 'admin'
                    ? (prev[existingIdx].userUnreadCount || 0) + 1
                    : prev[existingIdx].userUnreadCount,
                } : {
                  id: newMsg.conversationId,
                  userId: newMsg.senderRole === 'user' ? newMsg.senderId : 'guest',
                  userName: newMsg.senderRole === 'user' ? newMsg.senderName : 'Cliente VIP',
                  userPhone: '84 000 0000',
                  lastMessage: newMsg.content || (newMsg.attachmentType === 'video' ? '📹 Vídeo' : '📷 Foto'),
                  lastMessageAt: newMsg.timestamp,
                  unreadCount: effectiveRole === 'admin' ? 1 : 0,
                  userUnreadCount: effectiveRole === 'user' ? 1 : 0,
                  status: 'open',
                };

                if (existingIdx >= 0) {
                  const copy = [...prev];
                  copy[existingIdx] = updatedConv;
                  return copy.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
                }
                return [updatedConv, ...prev];
              });
            } else if (data.type === 'messages:read') {
              if (data.conversationId === activeConversationId) {
                setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
              }
            } else if (data.type === 'typing') {
              if (data.userId !== effectiveUserId) {
                setPeerTyping(!!data.isTyping);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                if (data.isTyping) {
                  typingTimeoutRef.current = setTimeout(() => {
                    setPeerTyping(false);
                  }, 4000);
                }
              }
            } else if (data.type === 'presence:update') {
              setIsPeerOnline(effectiveRole === 'admin' ? data.onlineCount > 1 : data.adminOnline);
            }
          } catch {
            // Ignore message parsing errors
          }
        };

        ws.onclose = () => {
          if (unmounted) return;
          setIsConnected(false);
          // Auto reconnect after 3s
          reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        reconnectTimeoutRef.current = setTimeout(connectWs, 4000);
      }
    }

    connectWs();
    refreshConversations();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [effectiveUserId, effectiveRole, profile?.name, refreshConversations, activeConversationId]);

  // Load conversation messages whenever active conversation changes
  useEffect(() => {
    const targetConvId = activeConversationId || (effectiveRole === 'user' ? `conv-${effectiveUserId}` : '');
    if (targetConvId) {
      loadMessagesForConversation(targetConvId);
      markConversationAsRead(targetConvId);
    }
  }, [activeConversationId, effectiveRole, effectiveUserId, loadMessagesForConversation, markConversationAsRead]);

  // Send typing indicator
  const sendTypingStatus = (isTyping: boolean) => {
    const targetConvId = activeConversationId || `conv-${effectiveUserId}`;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        conversationId: targetConvId,
        isTyping,
      }));
    }
  };

  // Send message
  const sendMessage = async (
    content: string,
    attachmentUrl?: string,
    attachmentType?: 'image' | 'video' | 'file'
  ): Promise<boolean> => {
    if (!content.trim() && !attachmentUrl) return false;

    const targetConvId = activeConversationId || `conv-${effectiveUserId}`;
    const targetRecipient = effectiveRole === 'admin' ? 'user' : 'admin';

    // 1. Try WebSocket first
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'send_message',
        conversationId: targetConvId,
        recipientId: targetRecipient,
        content: content.trim(),
        attachmentUrl,
        attachmentType,
      }));
      return true;
    }

    // 2. HTTP Fallback
    try {
      const res = await apiRequest<{ success: boolean; message: ChatMessage }>('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: targetConvId,
          senderId: effectiveUserId,
          senderName: profile?.name || (effectiveRole === 'admin' ? 'Suporte Apple Invest' : 'Cliente'),
          senderRole: effectiveRole,
          recipientId: targetRecipient,
          content: content.trim(),
          attachmentUrl,
          attachmentType,
        }),
      });

      if (res.data?.success && res.data.message) {
        setMessages((prev) => [...prev, res.data!.message]);
        return true;
      }
      return false;
    } catch {
      toast.error('Erro ao enviar mensagem.');
      return false;
    }
  };

  // Upload image/video attachment for chat
  const uploadChatMedia = async (file: File): Promise<{ url: string; attachmentType: 'image' | 'video' } | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await apiRequest<{ success: boolean; url: string; attachmentType: 'image' | 'video' }>('/chat/upload', {
            method: 'POST',
            body: JSON.stringify({
              fileData: reader.result,
              fileName: file.name,
              mimeType: file.type,
            }),
          });

          if (res.data?.success && res.data.url) {
            resolve({
              url: res.data.url,
              attachmentType: res.data.attachmentType,
            });
          } else {
            toast.error(res.error || 'Falha ao carregar anexo.');
            resolve(null);
          }
        } catch {
          toast.error('Erro no upload do anexo.');
          resolve(null);
        }
      };
      reader.onerror = () => {
        toast.error('Não foi possível ler o ficheiro.');
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        messages,
        activeConversationId,
        setActiveConversationId,
        sendMessage,
        uploadChatMedia,
        markConversationAsRead,
        totalUnreadCount,
        isConnected,
        isPeerOnline,
        peerTyping,
        sendTypingStatus,
        loadMessagesForConversation,
        isChatOpen,
        setIsChatOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
