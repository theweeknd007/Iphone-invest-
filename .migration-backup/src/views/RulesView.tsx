import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';

export const RulesView: React.FC = () => {
  const rules = [
    {
      title: '1. Ativação de Equipamentos Apple',
      desc: 'Cada utilizador pode ativar múltiplos equipamentos (iPhone X ao 18 Ultra) simultaneamente de acordo com o saldo disponível.',
    },
    {
      title: '2. Ciclos e Rendimentos Automáticos',
      desc: 'Os rendimentos são creditados automaticamente a cada 24 horas a partir do momento da compra. Ao terminar o ciclo (6 ou 7 dias), o plano é concluído com retorno total acumulado.',
    },
    {
      title: '3. Recargas e Depósitos em Meticais',
      desc: 'O valor mínimo de recarga é de MT 100 via M-Pesa ou e-Mola. O crédito é efetuado imediatamente após confirmação da operadora.',
    },
    {
      title: '4. Levantamentos Rápidos',
      desc: 'O montante mínimo de levantamento é de MT 100. Os pedidos são processados num intervalo entre 1 e 24 horas úteis, de segunda a domingo.',
    },
    {
      title: '5. Bónus de Convite e Comissões de Equipa',
      desc: 'As comissões de equipa são estruturadas em 3 níveis: 29% para o Nível 1, 2% para o Nível 2 e 1% para o Nível 3, creditadas instantaneamente sobre recargas efetuadas.',
    },
    {
      title: '6. Check-in Diário',
      desc: 'Cada utilizador tem direito a um check-in por dia, recebendo um bónus direto de MT 5 adicionado ao saldo.',
    },
  ];

  return (
    <AppLayout title="Regras da plataforma" backTo="/conta" hideNav>
      <div className="space-y-4 fade-up">
        <section className="surface-card rounded-2xl p-4 border border-border/70 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-slate-100 text-primary shrink-0">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-foreground">
              Termos e Condições Gerais
            </h2>
            <p className="text-xs text-muted-foreground">
              Normas operacionais vigentes para todos os membros APPLE INVEST.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {rules.map((rule) => (
            <div
              key={rule.title}
              className="surface-card rounded-2xl p-4 border border-border/70 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <h3 className="font-display text-sm font-bold text-foreground">
                  {rule.title}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                {rule.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};
