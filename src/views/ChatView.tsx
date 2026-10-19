import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Video,
  X,
  CheckCheck,
  Check,
  Shield,
  Headphones,
  Sparkles,
  ArrowLeft,
  Users,
  Search,
  MessageCircle,
  Lock,
  Volume2,
  VolumeX,
  ExternalLink,
  Wallet,
  Phone,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useSession } from '../context/SessionContext';
import { AppLayout } from '../components/AppLayout';
import { AppleLogo } from '../components/AppleLogo';
import { toast } from 'sonner';

export const ChatView: React.FC = () => {
  const {
    messages,
    sendMessage,
    uploadChatMedia,
    isConnected,
    isPeerOnline,
    peerTyping,
    sendTypingStatus,
    conversations,
    activeConversationId,
    setActiveConversationId,
    startConversationWithUser,
    soundEnabled,
    toggleSound,
  } = useChat();

  const { profile, isAdminAuth, allUsers, navigateTo } = useSession();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminSidebarTab, setAdminSidebarTab] = useState<'conversations' | 'clients'>('conversations');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const effectiveRole = (profile?.role === 'admin' || isAdminAuth) ? 'admin' : 'user';
  const myUserId = profile?.id || (effectiveRole === 'admin' ? 'admin-001' : 'visitor-guest');

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, peerTyping]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('O ficheiro excede o limite máximo de 25MB.');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    setFileType(isVideo ? 'video' : 'image');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const textToSend = directText || inputMessage;
    if (!textToSend.trim() && !selectedFile) return;

    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | undefined;

    if (selectedFile) {
      setIsUploading(true);
      const res = await uploadChatMedia(selectedFile);
      setIsUploading(false);
      if (res) {
        mediaUrl = res.url;
        mediaType = res.attachmentType;
      } else {
        return;
      }
    }

    setInputMessage('');
    handleClearSelectedFile();
    sendTypingStatus(false);

    await sendMessage(textToSend, mediaUrl, mediaType);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    sendTypingStatus(e.target.value.length > 0);
  };

  // Find active conversation details
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId);
  }, [conversations, activeConversationId]);

  // Find corresponding user in allUsers
  const activeChatUser = useMemo(() => {
    if (!activeConversationId) return null;
    const targetUserId = activeConversation?.userId || activeConversationId.replace('conv-', '');
    return allUsers.find((u) => u.id === targetUserId);
  }, [activeConversation, activeConversationId, allUsers]);

  // Filter conversations for admin
  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.userName.toLowerCase().includes(q) ||
        c.userPhone.includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  // Filter clients for admin
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allUsers.filter((u) => {
      if (u.role === 'admin' || u.id === 'admin-001') return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    });
  }, [allUsers, searchQuery]);

  // Quick FAQ chips for clients
  const clientFaqChips = [
    { label: '📱 Rendimentos de 5%', text: 'Como funcionam os rendimentos diários de 5% da Apple Invest?' },
    { label: '💳 Como Recarregar', text: 'Como faço uma recarga por M-Pesa ou e-Mola?' },
    { label: '💸 Levantamentos', text: 'Quais são as regras e tempo de levantamento?' },
    { label: '👥 Bónus de Equipa', text: 'Como funciona a comissão de convite de 29%?' },
    { label: '👨‍💼 Falar com Suporte', text: 'Gostaria de falar com o suporte humano ou administração.' },
  ];

  // Quick reply templates for admin
  const adminTemplates = [
    '👋 Olá! Bem-vindo à Apple Invest. Em que posso ajudar hoje?',
    '📸 Por favor envie o comprovativo ou captura de ecrã do M-Pesa / e-Mola.',
    '✅ O seu levantamento foi aprovado com sucesso! Já foi enviado para a sua conta móvel.',
    '🎉 Recarga confirmada e saldo creditado! Pode agora ativar o seu iPhone.',
    '⏳ O seu pedido está a ser verificado pela equipa financeira. Concluiremos em breve.',
    '💡 Lembre-se: os rendimentos de 5% acumulam a cada 24 horas no seu saldo.',
  ];

  return (
    <AppLayout title="Chat & Apoio Oficial" backTo="/conta" hideNav>
      <div className="surface-card flex h-[calc(100vh-8.5rem)] min-h-[540px] w-full flex-col overflow-hidden rounded-2xl border border-border/80 shadow-xl md:flex-row relative">
        
        {/* ==========================================================
            ADMIN SIDEBAR: Conversations & Client Directory
            ========================================================== */}
        {effectiveRole === 'admin' && (
          <aside
            className={`${
              showMobileSidebar ? 'flex' : 'hidden'
            } md:flex flex-col w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border/80 bg-slate-50/80 shrink-0 z-20 md:static absolute inset-0 bg-white`}
          >
            {/* Admin Header with Tabs */}
            <div className="p-3 border-b border-border/80 space-y-2.5 bg-white">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <Headphones className="size-4 text-primary" />
                  <span>Central de Atendimento</span>
                </span>
                <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold">
                  {conversations.length} conversas
                </span>
              </div>

              {/* Sub-tabs: Conversas vs Todos os Clientes */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAdminSidebarTab('conversations')}
                  className={`flex-1 rounded-lg py-1.5 text-center transition-all cursor-pointer ${
                    adminSidebarTab === 'conversations'
                      ? 'bg-white text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Conversas ({conversations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSidebarTab('clients')}
                  className={`flex-1 rounded-lg py-1.5 text-center transition-all cursor-pointer ${
                    adminSidebarTab === 'clients'
                      ? 'bg-white text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Clientes ({allUsers.length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={adminSidebarTab === 'conversations' ? 'Pesquisar conversa...' : 'Pesquisar cliente...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {adminSidebarTab === 'conversations' ? (
                filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
                    <p>Nenhuma conversa ativa encontrada.</p>
                    <button
                      type="button"
                      onClick={() => setAdminSidebarTab('clients')}
                      className="text-primary font-bold hover:underline"
                    >
                      Ver lista de clientes e iniciar conversa →
                    </button>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = conv.id === activeConversationId;
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => {
                          setActiveConversationId(conv.id);
                          setShowMobileSidebar(false);
                        }}
                        className={`flex w-full items-start gap-3 p-3 text-left transition-colors cursor-pointer ${
                          isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="relative grid size-10 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-800 font-bold text-xs shadow-xs">
                          {conv.userName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate font-semibold text-xs text-foreground">
                              {conv.userName}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                              {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate font-mono">
                            {conv.userPhone}
                          </p>
                          <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
                            {conv.lastMessage || 'Sem mensagens'}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-white text-[10px] font-extrabold animate-pulse">
                            {conv.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                )
              ) : (
                /* Clients Directory Tab */
                filteredClients.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Nenhum cliente registado.
                  </div>
                ) : (
                  filteredClients.map((client) => {
                    return (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-3 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-bold text-foreground truncate">
                            {client.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {client.phone} • MT {client.balance.toLocaleString('pt-PT')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            startConversationWithUser(client.id, client.name);
                            setAdminSidebarTab('conversations');
                            setShowMobileSidebar(false);
                          }}
                          className="shrink-0 flex items-center gap-1 rounded-lg bg-primary text-white px-2.5 py-1 text-xs font-semibold shadow hover:bg-primary/90 cursor-pointer"
                        >
                          <MessageCircle className="size-3.5" />
                          <span>Abrir</span>
                        </button>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </aside>
        )}

        {/* ==========================================================
            CHAT MAIN PANEL (Messages, Header & Input)
            ========================================================== */}
        <section className="flex flex-1 flex-col h-full bg-card min-w-0">
          
          {/* Room Switcher for Users: Support vs Community */}
          {effectiveRole === 'user' && (
            <div className="flex border-b border-border/80 bg-slate-100/90 p-1.5 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveConversationId(`conv-${myUserId}`)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeConversationId === `conv-${myUserId}`
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-foreground hover:bg-slate-200'
                }`}
              >
                <Headphones className="size-4" />
                <span>Suporte Privado</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveConversationId('conv-community')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeConversationId === 'conv-community'
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-foreground hover:bg-slate-200'
                }`}
              >
                <Users className="size-4" />
                <span>👥 Comunidade Global</span>
              </button>
            </div>
          )}

          {/* Top Chat Header */}
          <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-white/95 backdrop-blur-xs shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile toggle button for Admin */}
              {effectiveRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                  className="md:hidden grid size-8 place-items-center rounded-lg border border-border text-foreground hover:bg-slate-100"
                  title="Ver lista de conversas"
                >
                  <Users className="size-4" />
                </button>
              )}

              <div className="relative shrink-0">
                <div className="grid size-10 place-items-center rounded-full bg-foreground text-background shadow-xs">
                  {activeConversationId === 'conv-community' ? <Users className="size-5" /> : <AppleLogo className="size-5" />}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white ${
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  title={isConnected ? 'Conectado em tempo real' : 'A sincronizar...'}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-sm font-bold text-foreground truncate">
                    {activeConversationId === 'conv-community'
                      ? '👥 Comunidade Oficial Apple Invest'
                      : effectiveRole === 'admin'
                      ? (activeConversation?.userName || activeChatUser?.name || 'Cliente Apple Invest')
                      : 'Apoio Oficial APPLE INVEST'}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 shrink-0">
                    <Sparkles className="size-2.5" />
                    {activeConversationId === 'conv-community' ? 'GRUPO GLOBAL' : (effectiveRole === 'admin' ? 'CLIENTE' : 'VIP')}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Lock className="size-2.5 text-muted-foreground/70 shrink-0" />
                  <span className="truncate">
                    {activeConversationId === 'conv-community' ? (
                      'Canal aberto para conversas, partilha de lucros e networking entre membros'
                    ) : effectiveRole === 'admin' && activeChatUser ? (
                      <>
                        <span className="font-mono">{activeChatUser.phone}</span>
                        <span> • Saldo: MT {activeChatUser.balance.toLocaleString('pt-PT')}</span>
                      </>
                    ) : isPeerOnline ? (
                      'Administrador Online • Conversa Cifrada Direta'
                    ) : (
                      'Atendimento 24/7 • Moçambique'
                    )}
                  </span>
                </p>
              </div>
            </div>

            {/* Action Tools in Header */}
            <div className="flex items-center gap-2 shrink-0">
              {/* WhatsApp direct call button if admin has phone */}
              {effectiveRole === 'admin' && activeChatUser && (
                <a
                  href={`https://wa.me/258${activeChatUser.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  title="Abrir no WhatsApp"
                >
                  <Phone className="size-3" />
                  <span>WhatsApp</span>
                  <ExternalLink className="size-2.5 opacity-70" />
                </a>
              )}

              {/* Sound notification toggle button */}
              <button
                type="button"
                onClick={toggleSound}
                className={`grid size-8 place-items-center rounded-lg border transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'border-border text-foreground hover:bg-slate-100'
                    : 'border-rose-200 bg-rose-50 text-rose-600'
                }`}
                title={soundEnabled ? 'Som ativado (clique para silenciar)' : 'Som desativado (clique para ativar)'}
              >
                {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
            </div>
          </div>

          {/* Quick FAQ Options for Users */}
          {effectiveRole === 'user' && (
            <div className="border-b border-border/60 bg-slate-50/90 px-3 py-2 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Zap className="size-3 text-amber-500" />
                Dúvidas:
              </span>
              {clientFaqChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(undefined, chip.text)}
                  className="shrink-0 rounded-full bg-white border border-border/80 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all cursor-pointer shadow-2xs"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Quick Template Toolbar for Admin */}
          {effectiveRole === 'admin' && (
            <div className="border-b border-border/60 bg-slate-50/90 px-3 py-2 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Zap className="size-3 text-amber-500" />
                Respostas Rápidas:
              </span>
              {adminTemplates.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputMessage(template)}
                  className="shrink-0 rounded-full bg-white border border-border/80 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all cursor-pointer shadow-2xs truncate max-w-[220px]"
                  title={template}
                >
                  {template}
                </button>
              ))}
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50/40 via-white to-slate-50/30">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                  <Headphones className="size-7" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    {effectiveRole === 'admin'
                      ? 'Inicie a conversa com este cliente'
                      : 'Canal Direto de Atendimento APPLE INVEST'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                    {effectiveRole === 'admin'
                      ? 'Envie uma mensagem ou selecione uma resposta rápida acima para falar com o investidor.'
                      : 'Envie as suas dúvidas sobre rendimentos diários de 5%, ativação de iPhones, recargas ou levantamentos via M-Pesa e e-Mola.'}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === myUserId || (effectiveRole === 'admin' && msg.senderRole === 'admin');

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} fade-up`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-md rounded-2xl p-3 text-sm shadow-xs ${
                        isMe
                          ? 'bg-primary text-white rounded-br-xs'
                          : 'bg-white border border-border/90 text-foreground rounded-bl-xs'
                      }`}
                    >
                      {/* Sender label */}
                      {!isMe && (
                        <p className="text-[10px] font-bold text-primary mb-1 flex items-center gap-1">
                          <AppleLogo className="size-3" />
                          <span>{msg.senderName}</span>
                        </p>
                      )}

                      {/* Attachment Rendering */}
                      {msg.attachmentUrl && (
                        <div className="mb-2 overflow-hidden rounded-xl bg-black/5">
                          {msg.attachmentType === 'video' ? (
                            <video
                              src={msg.attachmentUrl}
                              controls
                              className="max-h-64 w-full rounded-xl object-contain bg-black"
                            />
                          ) : (
                            <img
                              src={msg.attachmentUrl}
                              alt="Anexo"
                              className="max-h-64 w-full rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setEnlargedImage(msg.attachmentUrl || null)}
                            />
                          )}
                        </div>
                      )}

                      {/* Message Content */}
                      {msg.content && (
                        <p className="whitespace-pre-wrap leading-relaxed break-words text-xs sm:text-sm font-sans">
                          {msg.content}
                        </p>
                      )}

                      {/* Timestamp & Delivery Receipt */}
                      <div
                        className={`flex items-center justify-end gap-1 text-[10px] mt-1 font-mono ${
                          isMe ? 'text-white/80' : 'text-muted-foreground'
                        }`}
                      >
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <span>
                            {msg.read ? (
                              <CheckCheck className="size-3 text-sky-200" title="Lido" />
                            ) : (
                              <Check className="size-3 text-white/70" title="Enviado" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {peerTyping && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic fade-up">
                <div className="flex gap-1 items-center bg-white px-3 py-1.5 rounded-full border border-border shadow-xs">
                  <div className="size-1.5 rounded-full bg-primary animate-bounce" />
                  <div className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                  <div className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-[11px] font-medium text-foreground">
                    A escrever...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Media preview before sending */}
          {filePreview && (
            <div className="border-t border-border/80 bg-slate-50 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {fileType === 'video' ? (
                  <div className="size-12 rounded-lg bg-black flex items-center justify-center text-white">
                    <Video className="size-5" />
                  </div>
                ) : (
                  <img src={filePreview} alt="Preview" className="size-12 rounded-lg object-cover" />
                )}
                <div className="text-xs">
                  <p className="font-semibold text-foreground truncate max-w-[200px]">
                    {selectedFile?.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Pronto para enviar ({fileType === 'video' ? 'Vídeo' : 'Imagem'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearSelectedFile}
                className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-slate-200"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Bottom Chat Input Form */}
          <form
            onSubmit={(e) => handleSendMessage(e)}
            className="flex items-center gap-2 border-t border-border/80 p-3 bg-white"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*,audio/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-slate-100 transition-colors cursor-pointer"
              title="Anexar foto, comprovativo ou vídeo"
            >
              <Paperclip className="size-5" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Escreva a sua mensagem..."
              className="flex-1 rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none transition-all"
            />

            <button
              type="submit"
              disabled={(!inputMessage.trim() && !selectedFile) || isUploading}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="size-4" />
            </button>
          </form>
        </section>

        {/* Modal for viewing enlarged images */}
        {enlargedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setEnlargedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img src={enlargedImage} alt="Ampliado" className="max-h-[85vh] max-w-full rounded-xl object-contain" />
              <button
                type="button"
                onClick={() => setEnlargedImage(null)}
                className="absolute -top-3 -right-3 grid size-8 place-items-center rounded-full bg-white text-black shadow-lg"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
