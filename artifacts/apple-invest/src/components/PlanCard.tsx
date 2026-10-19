import React, { useState } from 'react';
import { ShoppingCart, Cpu, Calendar, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { Plan } from '../types';
import { formatCurrency } from '../data/plans';
import { AppleLogo } from './AppleLogo';

interface PlanCardProps {
  plan: Plan;
  onBuy: (plan: Plan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onBuy }) => {
  const [imgError, setImgError] = useState(false);
  const totalReturn = plan.dailyYield * plan.days;
  const netProfit = totalReturn - plan.price;
  const roiPercent = Math.round((netProfit / plan.price) * 100);

  return (
    <article className="surface-card fade-up flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card hover:shadow-lg hover:border-primary/40 transition-all duration-300 group">
      {/* Top Media Header with Image */}
      <div className={`relative h-44 w-full overflow-hidden bg-gradient-to-b ${plan.tone} flex items-center justify-center p-3`}>
        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          {plan.badge && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-xs px-3 py-1 text-xs font-extrabold text-foreground shadow-sm border border-border/60">
              <Sparkles className="size-3.5 text-amber-500 fill-amber-500" />
              <span>{plan.badge}</span>
            </span>
          )}
        </div>

        {plan.chip && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 backdrop-blur-xs px-3 py-1 text-xs font-bold text-white shadow-sm border border-slate-700/60">
              <Cpu className="size-3.5 text-primary" />
              <span>{plan.chip}</span>
            </span>
          </div>
        )}

        {/* Product Image / Video or Fallback Mockup */}
        {plan.video || (plan.mediaType === 'video' && plan.image) ? (
          <div className="relative h-full w-full flex items-center justify-center">
            <video
              src={plan.video || plan.image}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-500 rounded-lg"
            />
            <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-xs">
              Vídeo Oficial
            </span>
          </div>
        ) : plan.image && !imgError ? (
          <img
            src={plan.image}
            alt={plan.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="grid size-16 place-items-center rounded-2xl bg-white shadow-md border border-border">
              <AppleLogo className="size-9 text-foreground" />
            </div>
            <span className="text-sm font-bold text-muted-foreground">{plan.name}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-5 gap-4">
        {/* Title and Model Specs */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
              <AppleLogo className="size-5 shrink-0 text-foreground" />
              <span>{plan.name}</span>
            </h3>
            <span className="text-xs sm:text-sm font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300">
              5% / dia
            </span>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground line-clamp-1 mt-1 font-medium">
            {plan.model}
          </p>
          {plan.specs && (
            <p className="text-xs sm:text-sm text-muted-foreground/90 mt-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary shrink-0" />
              <span className="truncate">{plan.specs}</span>
            </p>
          )}
        </div>

        {/* Financial Metrics Box */}
        <div className="rounded-2xl bg-slate-50 border border-border/70 p-4 space-y-3 text-sm sm:text-base">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2 font-medium">
              <TrendingUp className="size-4.5 text-emerald-600" />
              Rendimento diário (5%)
            </span>
            <span className="font-black text-emerald-600 text-base sm:text-lg">
              +{formatCurrency(plan.dailyYield)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2 font-medium">
              <Calendar className="size-4.5 text-primary" />
              Ciclo de investimento
            </span>
            <span className="font-bold text-foreground">
              {plan.days} dias ({plan.days * 24}h)
            </span>
          </div>

          <div className="pt-2.5 border-t border-border/80 flex items-center justify-between">
            <span className="font-bold text-foreground">Retorno acumulado</span>
            <span className="font-black text-primary text-base sm:text-lg">
              {formatCurrency(totalReturn)}
            </span>
          </div>
        </div>

        {/* Price & CTA Action */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Valor Oficial</p>
            <p className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {formatCurrency(plan.price)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onBuy(plan)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-base font-bold text-white shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <ShoppingCart className="size-5" />
            <span>Investir</span>
          </button>
        </div>
      </div>
    </article>
  );
};
