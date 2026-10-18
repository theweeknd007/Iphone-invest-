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

// Verified FAQ Knowledge Base for Automated Assistance
export function getAutomatedFaqAnswer(question: string, settings: any): string | null {
  const q = question.toLowerCase().trim();

  // 1. Yields / Rendimentos / 5% / iPhone / Lucro
  if (
    q.includes('rendimento') ||
    q.includes('rendimentos') ||
    q.includes('5%') ||
    q.includes('como funciona') ||
    q.includes('lucro') ||
    q.includes('diario') ||
    q.includes('diário') ||
    q.includes('ciclo')
  ) {
    return `📱 *Rendimentos Diários APPLE INVEST:*\n• Todos os equipamentos Apple (do iPhone X ao 18 Pro Max) rendem exatamente *5% ao dia* sobre o valor do equipamento.\n• O ciclo total é de *60 dias*.\n• Os rendimentos acumulam a cada 24 horas diretamente no seu saldo disponível.\n• Pode levantar ou reinvestir os seus rendimentos a qualquer momento!`;
  }

  // 2. Recharge / Recarga / Depósito / M-Pesa / e-Mola / Pagar
  if (
    q.includes('recarga') ||
    q.includes('recarregar') ||
    q.includes('deposito') ||
    q.includes('depósito') ||
    q.includes('m-pesa') ||
    q.includes('mpesa') ||
    q.includes('e-mola') ||
    q.includes('emola') ||
    q.includes('pagar') ||
    q.includes('como depositar')
  ) {
    const mpesaNum = settings.mpesaOfficialNumber || '84 900 1234';
    const mpesaName = settings.mpesaOfficialName || 'APPLE INVEST MOZ';
    const emolaNum = settings.emolaOfficialNumber || '86 900 1234';
    const minRec = settings.minRecharge || 100;
    return `💳 *Como Fazer uma Recarga:*\n1. Vá ao menu *Recarregar* no app.\n2. Escolha M-Pesa ou e-Mola (Valor Mínimo: *MT ${minRec}*).\n3. Transfira para a conta oficial:\n   • *M-Pesa:* ${mpesaNum} (${mpesaName})\n   • *e-Mola:* ${emolaNum} (${mpesaName})\n4. Copie o código ou referência do SMS de confirmação da operadora e insira no formulário.\n5. O seu saldo é creditado em poucos minutos após verificação!`;
  }

  // 3. Withdraw / Levantar / Levantamento / Saque / Taxa
  if (
    q.includes('levantar') ||
    q.includes('levantamento') ||
    q.includes('saque') ||
    q.includes('taxa') ||
    q.includes('minimo') ||
    q.includes('mínimo') ||
    q.includes('tempo')
  ) {
    const minWith = settings.minWithdrawal || 100;
    const fee = settings.withdrawalFeePercent || 20;
    return `💸 *Regras de Levantamento:*\n• *Valor Mínimo:* MT ${minWith}\n• *Taxa de Processamento:* ${fee}%\n• *Método:* Direto na sua conta M-Pesa ou e-Mola cadastrada no menu 'Carteira'\n• *Prazo:* Os pedidos são processados em 1 a 24 horas úteis.\n\nCertifique-se de configurar a sua carteira móvel antes de solicitar o levantamento.`;
  }

  // 4. Team / Equipa / Convite / Afiliados / Bónus / Amigos
  if (
    q.includes('equipa') ||
    q.includes('convid') ||
    q.includes('amigo') ||
    q.includes('afiliado') ||
    q.includes('comissao') ||
    q.includes('comissão') ||
    q.includes('29%')
  ) {
    const l1 = settings.level1Commission || 29;
    const l2 = settings.level2Commission || 2;
    const l3 = settings.level3Commission || 1;
    return `👥 *Comissões da Equipa APPLE INVEST:*\nGanha comissões generosas sempre que os seus convidados recarregam:\n• *Nível 1 (Convite Direto):* ${l1}%\n• *Nível 2 (Convidados dos seus amigos):* ${l2}%\n• *Nível 3:* ${l3}%\n\nAceda ao menu *Equipa* para copiar o seu link e código de convite exclusivo!`;
  }

  // 5. Humano / Atendente / Suporte
  if (
    q.includes('humano') ||
    q.includes('atendente') ||
    q.includes('pessoa') ||
    q.includes('suporte') ||
    q.includes('urgente')
  ) {
    const wa = settings.supportWhatsapp || '+258 84 000 0000';
    return `👨‍💼 *Apoio Humano em Direto:*\nA equipa de suporte e administração foi notificada da sua mensagem e vai responder diretamente aqui no chat em instantes!\n\nSe preferir atendimento imediato via WhatsApp oficial:\n📲 ${wa}`;
  }

  return null;
}

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
            const userName = sessionUser?.name || (role === 'admin' ? 'Administrador' : (payload.userName || `Cliente #${userId.slice(-4)}`));

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

            // Determine effective conversation and recipient
            let convId = conversationId;
            let effectiveRecipient = recipientId;

            if (client.role === 'user') {
              convId = `conv-${client.userId}`;
              effectiveRecipient = 'admin';
            } else {
              // Admin sending message
              if (!convId && effectiveRecipient && effectiveRecipient !== 'admin' && effectiveRecipient !== 'user') {
                convId = `conv-${effectiveRecipient}`;
              } else if (convId) {
                const targetUid = convId.replace('conv-', '');
                if (!effectiveRecipient || effectiveRecipient === 'user') {
                  effectiveRecipient = targetUid;
                }
              }
            }

            if (!convId) {
              convId = `conv-${client.userId}`;
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

            const targetUserId = client.role === 'user' ? client.userId : effectiveRecipient;
            const targetUser = db.users.find((u) => u.id === targetUserId);

            await withLock('chat-messages', () => {
              db.messages.push(chatMsg);

              // Find or create conversation
              let conv = db.conversations.find((c) => c.id === convId);
              if (!conv) {
                conv = {
                  id: convId,
                  userId: targetUserId,
                  userName: client.role === 'user' ? client.userName : (targetUser?.name || 'Cliente VIP'),
                  userPhone: targetUser?.phone || (client.role === 'user' ? client.userName : '84 000 0000'),
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
                if (targetUser && !conv.userPhone) {
                  conv.userPhone = targetUser.phone;
                }
                if (client.role === 'user') {
                  conv.unreadCount = (conv.unreadCount || 0) + 1;
                } else {
                  conv.userUnreadCount = (conv.userUnreadCount || 0) + 1;
                }
              }

              saveDatabase(db);
            });

            // Broadcast user/admin message in real-time
            broadcastChatMessage(chatMsg);

            // Automated FAQ response if client is a regular user and message has a recognized query
            if (client.role === 'user' && chatMsg.content) {
              const faqAnswer = getAutomatedFaqAnswer(chatMsg.content, db.settings);
              if (faqAnswer) {
                setTimeout(async () => {
                  const autoMsgId = `auto-msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                  const autoNow = new Date().toISOString();
                  const autoMsg: ChatMessage = {
                    id: autoMsgId,
                    conversationId: convId,
                    senderId: 'admin-001',
                    senderName: 'Suporte Oficial Apple Invest',
                    senderRole: 'admin',
                    recipientId: client.userId,
                    content: faqAnswer,
                    timestamp: autoNow,
                    read: false,
                  };

                  await withLock('chat-messages', () => {
                    const freshDb = getDatabase();
                    freshDb.messages.push(autoMsg);
                    const freshConv = freshDb.conversations.find((c) => c.id === convId);
                    if (freshConv) {
                      freshConv.lastMessage = autoMsg.content;
                      freshConv.lastMessageAt = autoNow;
                      freshConv.userUnreadCount = (freshConv.userUnreadCount || 0) + 1;
                    }
                    saveDatabase(freshDb);
                  });

                  broadcastChatMessage(autoMsg);
                }, 750);
              }
            }
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
      // 4. Any client belonging to this conversation
      const isRecipient = client.userId === msg.recipientId;
      const isSender = client.userId === msg.senderId;
      const isConvOwner = msg.conversationId === `conv-${client.userId}`;

      if (client.role === 'admin' || isSender || isRecipient || isConvOwner) {
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
