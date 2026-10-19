import React, { useState } from 'react';
import { 
  Sparkles, 
  Wallet, 
  Smartphone, 
  TrendingUp, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  HelpCircle, 
  X,
  BookOpen,
  Send,
  Users
} from 'lucide-react';
import { useSession } from '../context/SessionContext';

interface TutorialStep {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  actionLabel: string;
  actionRoute: string;
}

export const QuickTipsTutorial: React.FC<{ isOpenByDefault?: boolean }> = ({ isOpenByDefault = false }) => {
  const { navigateTo } = useSession();
  const [isOpen, setIsOpen] = useState(isOpenByDefault);
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TutorialStep[] = [
    {
      number: '01',
      title: 'Faça a sua primeira recarga',
      description: 'Adicione fundos à sua conta de forma segura via M-Pesa ou e-Mola. O saldo fica disponível instantaneamente para alugar o seu iPhone.',
      icon: Wallet,
      actionLabel: 'Recarregar Agora',
      actionRoute: '/recarregar',
    },
    {
      number: '02',
      title: 'Escolha e alugue um iPhone',
      description: 'Selecione entre os nossos 9 modelos disponíveis (desde o iPhone X até ao iPhone 18). Cada aluguer rende 5% de lucro diário garantido.',
      icon: Smartphone,
      actionLabel: 'Ver Modelos',
      actionRoute: '/',
    },
    {
      number: '03',
      title: 'Recolha rendimentos diários',
      description: 'Os seus rendimentos são creditados diariamente. Pode reinvestir ou acumular para alugar novos dispositivos e multiplicar os ganhos.',
      icon: TrendingUp,
      actionLabel: 'Meus Produtos',
      actionRoute: '/meus-produtos',
    },
    {
      number: '04',
      title: 'Convide amigos e ganhe bónus',
      description: 'Partilhe o seu código de convite e lucre em 3 níveis de comissão (29% no Nível 1, 2% no Nível 2 e 1% no Nível 3).',
      icon: Users,
      actionLabel: 'Minha Equipa',
      actionRoute: '/equipa',
    },
  ];

  const activeStep = steps[currentStep];

  return (
    <div className="w-full mb-6">
      {/* Trigger Banner when collapsed */}
      {!isOpen ? (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 text-blue-300">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-blue-300 tracking-wider uppercase">Dicas Rápidas & Guia</div>
              <h3 className="text-sm font-semibold text-white">Como funciona o aluguer de iPhones? (Passo a Passo)</h3>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <span>Ver Tutorial</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : (
        /* Expanded Interactive Tutorial Card / Modal box */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs">
                {activeStep.number}
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Passo {currentStep + 1} de {steps.length}</span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Guia Interativo de Aluguer</h3>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="size-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Step Content */}
          <div className="py-5">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                {React.createElement(activeStep.icon, { className: 'size-6' })}
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  {activeStep.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {activeStep.description}
                </p>
                <button
                  onClick={() => navigateTo(activeStep.actionRoute as any)}
                  className="px-4 py-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>{activeStep.actionLabel}</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation and Indicators */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep((prev) => (prev > 0 ? prev - 1 : steps.length - 1))}
                disabled={currentStep === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0))}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                {currentStep === steps.length - 1 ? 'Concluir' : 'Seguinte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
