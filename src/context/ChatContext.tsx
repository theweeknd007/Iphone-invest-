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
  startConversationWithUser: (userId: string, userName?: string) => Promise<void>;
  soundEnabled: boolean;
  toggleSound: () => void;
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
  const { profile, isAdminAuth } = useSession();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPeerOnline, setIsPeerOnline] = useState<boolean>(false);
  const [peerTyping, setPeerTyping] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('apple_invest_chat_sound') !== 'false';
  });

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);
  const pollingIntervalRef = useRef<any>(null);

  // Derive current effective user ID and role
  const effectiveRole: 'admin' | 'user' = (profile?.role === 'admin' || isAdminAuth) ? 'admin' : 'user';
  const effectiveUserId = profile?.id || (effectiveRole === 'admin' ? 'admin-001' : 'visitor-guest');
  const effectiveUserName = profile?.name || (effectiveRole === 'admin' ? 'Administrador' : 'Cliente');

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('apple_invest_chat_sound', String(next));
      return next;
    });
  };

  // Total unread messages count
  const totalUnreadCount = conversations.reduce((acc, c) => {
    return acc + (effectiveRole === 'admin' ? (c.unreadCount || 0) : (c.userUnreadCount || 0));
  }, 0);

  // Set default active conversation ID on mount or role change
  useEffect(() => {
    if (effectiveRole === 'user') {
      const defaultUserConv = `conv-${effectiveUserId}`;
      setActiveConversationId(defaultUserConv);
    }
  }, [effectiveRole, effectiveUserId]);

  // Fetch conversations list
  const refreshConversations = useCallback(async () => {
    try {
      const query = effectiveRole === 'admin' ? '?role=admin' : `?userId=${effectiveUserId}`;
      const res = await apiRequest<{ conversations: ChatConversation[] }>(`/chat/conversations${query}`);
      if (res.data?.conversations) {
        setConversations(res.data.conversations);
        if (effectiveRole === 'admin' && !activeConversationId && res.data.conversations.length > 0) {
          setActiveConversationId(res.data.conversations[0].id);
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
        setMessages((prev) => {
          // If server returned messages, use them
          if (res.data!.messages.length > 0) {
            return res.data!.messages;
          }
          // If server returned empty and user has optimistic messages in progress, keep optimistic
          return prev.filter((m) => m.conversationId === convId);
        });
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

  // Start a conversation with a specific user (admin action)
  const startConversationWithUser = async (userId: string, userName?: string) => {
    try {
      const res = await apiRequest<{ success: boolean; conversation: ChatConversation }>('/chat/start', {
        method: 'POST',
        body: JSON.stringify({ userId, userName }),
      });

      if (res.data?.conversation) {
        const conv = res.data.conversation;
        setConversations((prev) => {
          if (prev.some((c) => c.id === conv.id)) return prev;
          return [conv, ...prev];
        });
        setActiveConversationId(conv.id);
        loadMessagesForConversation(conv.id);
      }
    } catch {
      setActiveConversationId(`conv-${userId}`);
    }
  };

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
            userName: effectiveUserName,
          }));
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'message:new' && data.message) {
              const newMsg: ChatMessage = data.message;
              setMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === newMsg.id);
                if (idx >= 0) return prev;
                return [...prev, newMsg];
              });

              // Play chime and trigger sonner toast if from someone else
              if (newMsg.senderId !== effectiveUserId) {
                if (soundEnabled) {
                  playChime();
                }
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
                  userId: newMsg.senderRole === 'user' ? newMsg.senderId : (newMsg.recipientId || 'guest'),
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

    // Background polling fallback (guarantees real-time updates every 3s in all environments)
    pollingIntervalRef.current = setInterval(() => {
      refreshConversations();
      const target = activeConversationId || (effectiveRole === 'user' ? `conv-${effectiveUserId}` : '');
      if (target) {
        apiRequest<{ messages: ChatMessage[] }>(`/chat/messages/${target}`).then((res) => {
          if (res.data?.messages && res.data.messages.length > 0) {
            setMessages((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(res.data!.messages)) {
                return res.data!.messages;
              }
              return prev;
            });
          }
        }).catch(() => {});
      }
    }, 3000);

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [effectiveUserId, effectiveRole, effectiveUserName, refreshConversations, activeConversationId, soundEnabled]);

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

  // Send message with optimistic update
  const sendMessage = async (
    content: string,
    attachmentUrl?: string,
    attachmentType?: 'image' | 'video' | 'file'
  ): Promise<boolean> => {
    if (!content.trim() && !attachmentUrl) return false;

    const targetConvId = activeConversationId || (effectiveRole === 'user' ? `conv-${effectiveUserId}` : '');
    if (!targetConvId) return false;

    let targetRecipient = 'admin';
    if (effectiveRole === 'admin') {
      const conv = conversations.find((c) => c.id === targetConvId);
      targetRecipient = conv?.userId || targetConvId.replace('conv-', '');
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: targetConvId,
      senderId: effectiveUserId,
      senderName: effectiveUserName,
      senderRole: effectiveRole,
      recipientId: targetRecipient,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      read: false,
      attachmentUrl,
      attachmentType,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, optimisticMessage]);

    // 1. WebSocket attempt
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
          senderName: effectiveUserName,
          senderRole: effectiveRole,
          recipientId: targetRecipient,
          content: content.trim(),
          attachmentUrl,
          attachmentType,
        }),
      });

      if (res.data?.success && res.data.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? res.data!.message : m)));
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
        startConversationWithUser,
        soundEnabled,
        toggleSound,
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
