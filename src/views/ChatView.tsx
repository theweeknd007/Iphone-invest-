import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Image,
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
  FileText,
  Lock,
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
  } = useChat();

  const { profile, isAdminAuth, navigateTo } = useSession();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [searchConv, setSearchConv] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const effectiveRole = (profile?.role === 'admin' || isAdminAuth) ? 'admin' : 'user';
  const myUserId = profile?.id || 'visitor-guest';

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !selectedFile) return;

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

    const textToSend = inputMessage;
    setInputMessage('');
    handleClearSelectedFile();
    sendTypingStatus(false);

    await sendMessage(textToSend, mediaUrl, mediaType);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    sendTypingStatus(e.target.value.length > 0);
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.userName.toLowerCase().includes(searchConv.toLowerCase()) ||
      c.userPhone.includes(searchConv) ||
      c.id.includes(searchConv)
  );

  return (
    <AppLayout title="Chat & Suporte Oficial" backTo="/conta" hideNav>
      <div className="surface-card flex h-[calc(100vh-8.5rem)] min-h-[500px] w-full flex-col overflow-hidden rounded-2xl border border-border/80 shadow-xl md:flex-row">
        {/* ==========================================================
            DESKTOP ADMIN SIDEBAR: Conversations List (only for admin)
            ========================================================== */}
        {effectiveRole === 'admin' && (
          <aside className="w-full border-b border-border/80 bg-slate-50/70 md:w-80 md:border-b-0 md:border-r flex flex-col shrink-0">
            <div className="p-3 border-b border-border/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  <span>Conversas de Clientes</span>
                </span>
                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                  {conversations.length}
                </span>
              </div>
              <div className="relative">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar cliente ou número..."
                  value={searchConv}
                  onChange={(e) => setSearchConv(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Nenhuma conversa encontrada.
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === activeConversationId;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`flex w-full items-start gap-3 p-3 text-left transition-colors cursor-pointer ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-700 font-bold text-xs">
                        {conv.userName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-semibold text-xs text-foreground">
                            {conv.userName}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {conv.userPhone}
                        </p>
                        <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
                          {conv.lastMessage || 'Sem mensagens'}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-white text-[10px] font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* ==========================================================
            CHAT MAIN WINDOW (Messages & Input)
            ========================================================== */}
        <section className="flex flex-1 flex-col h-full bg-card min-w-0">
          {/* Top Chat Header */}
          <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-white/90 backdrop-blur-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="grid size-10 place-items-center rounded-full bg-foreground text-background shadow-xs">
                  <AppleLogo className="size-5" />
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white ${
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  title={isConnected ? 'Conectado em tempo real' : 'A reconectar...'}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-sm font-bold text-foreground truncate">
                    {effectiveRole === 'admin'
                      ? (conversations.find((c) => c.id === activeConversationId)?.userName || 'Atendimento ao Cliente')
                      : 'Apoio Oficial Apple Invest'}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <Sparkles className="size-2.5" />
                    VIP
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Lock className="size-2.5 text-muted-foreground/70" />
                  <span>
                    {isPeerOnline
                      ? 'Online • Conversa Direta & Cifrada'
                      : 'Ativo 24/7 • Moçambique'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                {isConnected ? 'Em Direto' : 'A sincronizar...'}
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50/50 to-white">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Headphones className="size-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    Canal Direto de Atendimento
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Envie dúvidas sobre rendimentos diários, ativação de iPhones, recargas ou levantamentos M-Pesa / e-Mola.
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
                          : 'bg-white border border-border/80 text-foreground rounded-bl-xs'
                      }`}
                    >
                      {/* Sender label in group/admin view */}
                      {!isMe && (
                        <p className="text-[10px] font-bold text-primary mb-1">
                          {msg.senderName}
                        </p>
                      )}

                      {/* Attachment Rendering (Image or Video) */}
                      {msg.attachmentUrl && (
                        <div className="mb-2 overflow-hidden rounded-xl bg-black/5">
                          {msg.attachmentType === 'video' ? (
                            <video
                              src={msg.attachmentUrl}
                              controls
                              className="max-h-60 w-full rounded-xl object-contain bg-black"
                            />
                          ) : (
                            <img
                              src={msg.attachmentUrl}
                              alt="Anexo"
                              className="max-h-60 w-full rounded-xl object-cover cursor-pointer hover:opacity-95"
                              onClick={() => window.open(msg.attachmentUrl, '_blank')}
                            />
                          )}
                        </div>
                      )}

                      {/* Text content */}
                      {msg.content && (
                        <p className="whitespace-pre-wrap leading-relaxed break-words text-xs sm:text-sm">
                          {msg.content}
                        </p>
                      )}

                      {/* Timestamp & Read Receipt */}
                      <div
                        className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                          isMe ? 'text-white/80' : 'text-muted-foreground'
                        }`}
                      >
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <span>
                            {msg.read ? (
                              <CheckCheck className="size-3 text-sky-200" />
                            ) : (
                              <Check className="size-3 text-white/70" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
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
                    Pronto para enviar ({fileType})
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
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 border-t border-border/80 p-3 bg-white"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-slate-100 transition-colors cursor-pointer"
              title="Anexar imagem ou vídeo"
            >
              <Paperclip className="size-5" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Escreva a sua mensagem..."
              className="flex-1 rounded-xl border border-border bg-slate-50/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none transition-all"
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
      </div>
    </AppLayout>
  );
};
