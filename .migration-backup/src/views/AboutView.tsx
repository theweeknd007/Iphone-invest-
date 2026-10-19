import React from 'react';
import { Shield, Award, Users } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { AppleLogo } from '../components/AppleLogo';

export const AboutView: React.FC = () => {
  return (
    <AppLayout title="Sobre nós" backTo="/conta" hideNav>
      <div className="space-y-4 fade-up">
        {/* Brand header */}
        <section className="surface-card rounded-2xl p-6 border border-border/70 text-center space-y-3">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-foreground text-background shadow-lg">
            <AppleLogo className="size-8" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">
            APPLE INVEST
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Plataforma inovadora focada no ecossistema de investimento e rendimento com equipamentos oficiais Apple em Moçambique.
          </p>
        </section>


        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="surface-card rounded-2xl p-4 border border-border/70 flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-slate-100 text-primary shrink-0">
              <Shield className="size-5" />
            </div>
            <div className="text-xs sm:text-sm">
              <p className="font-bold text-foreground">Segurança e Transparência</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                Transações processadas pelas principais redes de carteira móvel de Moçambique (M-Pesa e e-Mola) com total rastreabilidade.
              </p>
            </div>
          </div>

          <div className="surface-card rounded-2xl p-4 border border-border/70 flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-slate-100 text-primary shrink-0">
              <Award className="size-5" />
            </div>
            <div className="text-xs sm:text-sm">
              <p className="font-bold text-foreground">Rendimentos a Cada 24 Horas</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                Linha completa de iPhones (iPhone X ao 18 Ultra) com rendimento diário creditado automaticamente no seu saldo.
              </p>
            </div>
          </div>

          <div className="surface-card rounded-2xl p-4 border border-border/70 flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-slate-100 text-primary shrink-0">
              <Users className="size-5" />
            </div>
            <div className="text-xs sm:text-sm">
              <p className="font-bold text-foreground">Comunidade e Equipa</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                Sistema de comissões multinível (29%, 2%, 1%) para recompensar embaixadores e membros ativos da comunidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
