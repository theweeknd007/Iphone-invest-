import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { getDatabase, saveDatabase, withLock } from './db';
import { validateSession } from './security';
import { ChatMessage, ChatConversation } from '../types';

interface ClientMetadata {
  userId: string;
  role: 'user' | 'admin';
  userName: string;
  connectionId: string;
}

const activeClients = new Map<WebSocket, ClientMetadata>();

export function setupChatWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws/chat' });

  wss.on('connection', (ws: WebSocket) => {
    const connectionId = 'conn-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

    ws.on('message', async (data: Buffer | string) => {
      try {
        const raw = data.toString();
        const payload = JSON.parse(raw);

        switch (payload.type) {
          case 'auth': {
            const token = payload.token;
            const db = getDatabase();
            let sessionUser = null;

            if (token) {
              const session = validateSession(token);
              if (session) {
                sessionUser = db.users.find((u) => u.id === session.userId);
              }
            }

            const userId = sessionUser?.id || payload.userId || `guest-${connectionId.slice(-6)}`;
            const role = (sessionUser?.role === 'admin' || payload.role === 'admin') ? 'admin' : 'user';
            const userName = sessionUser?.name || (role === 'admin' ? 'Suporte Apple Invest' : (payload.userName || `Cliente #${userId.slice(-4)}`));

            activeClients.set(ws, {
              userId,
              role,
              userName,
              connectionId,
            });

            ws.send(JSON.stringify({
              type: 'auth:success',
              userId,
              role,
              userName,
            }));

            // Send presence update
            broadcastPresence();
            break;
          }

          case 'send_message': {
            const client = activeClients.get(ws);
            if (!client) {
              ws.send(JSON.stringify({ type: 'error', message: 'Não autenticado no chat.' }));
              return;
            }

            const { conversationId, recipientId, content, attachmentUrl, attachmentType } = payload;
            if (!content && !attachmentUrl) return;

            const db = getDatabase();
            const now = new Date().toISOString();
            const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

            // Determine effective conversation
            let convId = conversationId;
            let effectiveRecipient = recipientId;

            if (client.role === 'user') {
              convId = `conv-${client.userId}`;
              effectiveRecipient = 'admin';
            } else if (!convId) {
              convId = `conv-${recipientId}`;
            }

            const chatMsg: ChatMessage = {
              id: messageId,
              conversationId: convId,
              senderId: client.userId,
              senderName: client.userName,
              senderRole: client.role,
              recipientId: effectiveRecipient,
              content: content ? String(content).trim() : '',
              timestamp: now,
              read: false,
              attachmentUrl,
              attachmentType,
            };

            await withLock('chat-messages', () => {
              db.messages.push(chatMsg);

              // Find or create conversation
              let conv = db.conversations.find((c) => c.id === convId);
              if (!conv) {
                conv = {
                  id: convId,
                  userId: client.role === 'user' ? client.userId : recipientId,
                  userName: client.role === 'user' ? client.userName : (db.users.find(u => u.id === recipientId)?.name || 'Cliente VIP'),
                  userPhone: db.users.find(u => u.id === (client.role === 'user' ? client.userId : recipientId))?.phone || '84 000 0000',
                  lastMessage: chatMsg.content || (chatMsg.attachmentType === 'video' ? '📹 Vídeo' : '📷 Foto'),
                  lastMessageAt: now,
                  unreadCount: client.role === 'user' ? 1 : 0,
                  userUnreadCount: client.role === 'admin' ? 1 : 0,
                  status: 'open',
                };
                db.conversations.push(conv);
              } else {
                conv.lastMessage = chatMsg.content || (chatMsg.attachmentType === 'video' ? '📹 Vídeo' : '📷 Foto');
                conv.lastMessageAt = now;
                if (client.role === 'user') {
                  conv.unreadCount = (conv.unreadCount || 0) + 1;
                } else {
                  conv.userUnreadCount = (conv.userUnreadCount || 0) + 1;
                }
              }

              saveDatabase(db);
            });

            // Broadcast message in real-time to active WebSocket clients
            broadcastChatMessage(chatMsg);
            break;
          }

          case 'mark_read': {
            const client = activeClients.get(ws);
            if (!client || !payload.conversationId) return;

            const db = getDatabase();
            await withLock('chat-messages', () => {
              const conv = db.conversations.find((c) => c.id === payload.conversationId);
              if (conv) {
                if (client.role === 'admin') {
                  conv.unreadCount = 0;
                } else {
                  conv.userUnreadCount = 0;
                }
              }

              db.messages
                .filter((m) => m.conversationId === payload.conversationId && m.senderId !== client.userId)
                .forEach((m) => {
                  m.read = true;
                });

              saveDatabase(db);
            });

            // Notify sender that messages were read
            broadcastToConversation(payload.conversationId, {
              type: 'messages:read',
              conversationId: payload.conversationId,
              readBy: client.userId,
            });
            break;
          }

          case 'typing': {
            const client = activeClients.get(ws);
            if (!client || !payload.conversationId) return;

            broadcastToConversation(payload.conversationId, {
              type: 'typing',
              conversationId: payload.conversationId,
              userId: client.userId,
              userName: client.userName,
              isTyping: !!payload.isTyping,
            }, ws);
            break;
          }

          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          }
        }
      } catch (err) {
        console.error('[WebSocket] Message handling error:', err);
      }
    });

    ws.on('close', () => {
      activeClients.delete(ws);
      broadcastPresence();
    });

    ws.on('error', (err) => {
      console.warn('[WebSocket] Client error:', err);
      activeClients.delete(ws);
    });
  });

  return wss;
}

export function broadcastChatMessage(msg: ChatMessage) {
  const payload = JSON.stringify({
    type: 'message:new',
    message: msg,
  });

  for (const [ws, client] of activeClients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      // Send to:
      // 1. All admins
      // 2. The sender
      // 3. The recipient user
      if (
        client.role === 'admin' ||
        client.userId === msg.senderId ||
        client.userId === msg.recipientId ||
        msg.conversationId === `conv-${client.userId}`
      ) {
        try {
          ws.send(payload);
        } catch {
          // Ignore transient send failures
        }
      }
    }
  }
}

export function broadcastToConversation(conversationId: string, data: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(data);
  for (const [ws, client] of activeClients.entries()) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      if (client.role === 'admin' || conversationId === `conv-${client.userId}`) {
        try {
          ws.send(payload);
        } catch {
          // Ignore transient send failures
        }
      }
    }
  }
}

function broadcastPresence() {
  const onlineCount = activeClients.size;
  const adminOnline = Array.from(activeClients.values()).some((c) => c.role === 'admin');
  const payload = JSON.stringify({
    type: 'presence:update',
    onlineCount,
    adminOnline,
  });

  for (const ws of activeClients.keys()) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(payload);
      } catch {
        // Ignore
      }
    }
  }
}
