import React from 'react';
import { Headphones, MessageCircle, Send, Clock, HelpCircle, Users2, ExternalLink } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';

export const SupportView: React.FC = () => {
  const { settings } = useSession();
  const whatsappGroup = settings.whatsappGroupUrl || 'https://chat.whatsapp.com/CqtV80fMgy8Eqx7iWFjaYW?s=cl&p=a&mlu=4&ilr=4';
  const cleanPhone = settings.supportWhatsapp.replace(/\D/g, '') || '258840000000';

  return (
    <AppLayout title="Apoio ao cliente" backTo="/conta" hideNav>
      <div className="space-y-4 fade-up">
        {/* WhatsApp Group Highlight Card */}
        <section className="surface-card rounded-2xl p-5 border border-emerald-200 bg-emerald-50/60 text-center space-y-3">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
            <Users2 className="size-7" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              Comunidade Oficial
            </span>
            <h2 className="font-display text-base font-bold text-foreground mt-1.5">
              Grupo Oficial do WhatsApp
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              Participe no grupo exclusivo de investidores para novidades diárias, dicas, anúncios e comprovativos de levantamentos.
            </p>
          </div>

          <div className="pt-1">
            <a
              href={whatsappGroup}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white py-3 px-4 text-sm font-semibold shadow-lg hover:bg-emerald-500 active:scale-98 transition-all cursor-pointer"
            >
              <MessageCircle className="size-4" />
              <span>Entrar no Grupo de WhatsApp</span>
              <ExternalLink className="size-3.5 opacity-80" />
            </a>
          </div>
        </section>

        {/* Support channels card */}
        <section className="surface-card rounded-2xl p-5 border border-border/70 text-center space-y-3">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-primary shadow-inner">
            <Headphones className="size-6" />
          </div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Atendimento Individual
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Fale diretamente com os nossos gestores de conta para suporte técnico ou financeiro.
          </p>

          <div className="pt-1 flex flex-col gap-2">

            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-secondary/80 text-foreground py-2.5 px-4 text-sm font-semibold border border-border hover:bg-secondary transition-colors"
            >
              <MessageCircle className="size-4 text-emerald-400" />
              <span>Suporte Direto WhatsApp ({settings.supportWhatsapp})</span>
            </a>

            <a
              href={settings.supportTelegram.startsWith('http') ? settings.supportTelegram : `https://t.me/${settings.supportTelegram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-sky-600/90 text-white py-2.5 px-4 text-sm font-semibold shadow hover:bg-sky-600 transition-colors"
            >
              <Send className="size-4" />
              <span>Canal Oficial do Telegram ({settings.supportTelegram})</span>
            </a>
          </div>
        </section>

        {/* Operating hours */}
        <section className="surface-card rounded-2xl p-4 border border-border/70 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-secondary text-primary shrink-0">
            <Clock className="size-5" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-foreground">Horário de Atendimento</p>
            <p className="text-muted-foreground mt-0.5">Segunda a Domingo: 08:00 às 20:00 (GMT+2)</p>
          </div>
        </section>

        {/* FAQ list */}
        <section className="surface-card rounded-2xl p-4 border border-border/70 space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-border/50">
            <HelpCircle className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Perguntas Frequentes</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Como são gerados os rendimentos?</p>
              <p className="text-muted-foreground leading-relaxed">
                Ao ativar um equipamento, o rendimento diário é calculado a cada 24 horas e adicionado diretamente ao seu saldo disponível.
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-border/40">
              <p className="font-semibold text-foreground">Quanto tempo demora um levantamento?</p>
              <p className="text-muted-foreground leading-relaxed">
                Os levantamentos via M-Pesa ou e-Mola são processados no prazo máximo de 1 a 24 horas úteis.
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-border/40">
              <p className="font-semibold text-foreground">Como funcionam as comissões de equipa?</p>
              <p className="text-muted-foreground leading-relaxed">
                Ganha 29% da recarga dos convidados diretos (Nível 1), 2% no Nível 2 e 1% no Nível 3.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};
