import React, { useState } from 'react';
import { Copy, Check, Users } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';
import { formatCurrency } from '../data/plans';
import { toast } from 'sonner';
import { AppleLogo } from '../components/AppleLogo';

export const TeamView: React.FC = () => {
  const { profile, signedIn, allUsers, settings } = useSession();
  const [copiedKey, setCopiedKey] = useState<'code' | 'link' | null>(null);

  const inviteCode = profile?.inviteCode ?? 'IPH8392';
  const inviteLink = signedIn
    ? `${window.location.origin}/registo?c=${inviteCode}`
    : 'Disponível após iniciar sessão';

  const handleCopy = async (text: string, key: 'code' | 'link') => {
    if (!signedIn) {
      toast.info('Inicie sessão para obter o seu código de convite.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success('Copiado para a área de transferência');
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      toast.success('Copiado');
    }
  };

  // Real Multi-level calculations
  const level1Users = profile
    ? allUsers.filter((u) => u.referredBy && u.referredBy.toUpperCase() === profile.inviteCode.toUpperCase())
    : [];

  const level1Codes = new Set(level1Users.map((u) => u.inviteCode.toUpperCase()));
  const level2Users = profile
    ? allUsers.filter((u) => u.referredBy && level1Codes.has(u.referredBy.toUpperCase()))
    : [];

  const level2Codes = new Set(level2Users.map((u) => u.inviteCode.toUpperCase()));
  const level3Users = profile
    ? allUsers.filter((u) => u.referredBy && level2Codes.has(u.referredBy.toUpperCase()))
    : [];

  const totalInvitedCount = level1Users.length + level2Users.length + level3Users.length;

  const level1Earnings = level1Users.reduce(
    (acc, u) => acc + Math.round((u.totalRecharged * settings.level1Commission) / 100),
    0
  );
  const level2Earnings = level2Users.reduce(
    (acc, u) => acc + Math.round((u.totalRecharged * settings.level2Commission) / 100),
    0
  );
  const level3Earnings = level3Users.reduce(
    (acc, u) => acc + Math.round((u.totalRecharged * settings.level3Commission) / 100),
    0
  );

  const totalReferralEarnings = level1Earnings + level2Earnings + level3Earnings;

  const teamLevels = [
    {
      level: 1,
      rate: settings.level1Commission,
      members: level1Users.length,
      earnings: level1Earnings,
    },
    {
      level: 2,
      rate: settings.level2Commission,
      members: level2Users.length,
      earnings: level2Earnings,
    },
    {
      level: 3,
      rate: settings.level3Commission,
      members: level3Users.length,
      earnings: level3Earnings,
    },
  ];

  return (
    <AppLayout title="Minha equipa">
      {/* Top Banner */}
      <section className="fade-up brand-gradient rounded-2xl px-4 py-6 text-center border border-border/70">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary shadow-xs">
          <AppleLogo className="size-7" />
        </div>
        <p className="mt-2 text-base text-foreground font-semibold">A minha equipa</p>
        <div className="mt-4 grid grid-cols-2 divide-x divide-border">
          <div>
            <p className="font-display text-xl font-bold text-foreground">
              {totalInvitedCount}
            </p>
            <p className="text-[11px] text-muted-foreground">Convidados reais</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-foreground">
              {formatCurrency(totalReferralEarnings)}
            </p>
            <p className="text-[11px] text-muted-foreground">Comissão acumulada</p>
          </div>
        </div>
      </section>

      {/* Referral Code & Link */}
      <section className="surface-card fade-up mt-4 rounded-2xl p-4 border border-border/70">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Código de convite</p>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate font-display text-base font-semibold tracking-wider text-foreground">
                {inviteCode}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(inviteCode, 'code')}
                className="flex shrink-0 items-center gap-1 text-sm text-primary font-medium hover:underline cursor-pointer"
              >
                {copiedKey === 'code' ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copiedKey === 'code' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Link de convite</p>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                {inviteLink}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(inviteLink, 'link')}
                className="flex shrink-0 items-center gap-1 text-sm text-primary font-medium hover:underline cursor-pointer"
              >
                {copiedKey === 'link' ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copiedKey === 'link' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Tier Commission Table */}
      <section className="surface-card fade-up mt-4 overflow-hidden rounded-2xl">
        <div className="grid grid-cols-3 brand-gradient px-3 py-2.5 text-[11px] font-medium border-b border-border/40">
          <span>Taxa de comissão</span>
          <span className="text-center">Membros</span>
          <span className="text-right">Comissões</span>
        </div>
        {teamLevels.map((lvl) => (
          <div
            key={lvl.level}
            className="grid grid-cols-3 items-center border-b border-border/60 px-3 py-3 text-sm last:border-0 hover:bg-secondary/30 transition-colors"
          >
            <span className="truncate font-medium text-foreground">
              Nível {lvl.level} · <span className="text-primary">{lvl.rate}%</span>
            </span>
            <span className="text-center text-muted-foreground">{lvl.members}</span>
            <span className="text-right font-medium text-success">
              {formatCurrency(lvl.earnings)}
            </span>
          </div>
        ))}
      </section>

      {/* Real direct members list */}
      {level1Users.length > 0 && (
        <section className="surface-card fade-up mt-4 rounded-2xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Users className="size-3.5 text-primary" />
            <span>Membros Diretos (Nível 1)</span>
          </h3>
          <div className="space-y-1.5 pt-1">
            {level1Users.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-1.5 text-sm border-b border-border/40 last:border-0"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    +258 {member.phone.slice(0, 2)} *** {member.phone.slice(-2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ID {member.id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    Recarregou: {formatCurrency(member.totalRecharged)}
                  </p>
                  <p className="text-[10px] text-success font-semibold">
                    Comissão: +{formatCurrency(Math.round((member.totalRecharged * settings.level1Commission) / 100))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Explanatory Steps */}
      <section className="fade-up mt-6 pb-2">
        <h2 className="mb-3 text-center font-display text-base font-semibold text-muted-foreground">
          Como funciona
        </h2>
        <ol className="space-y-2.5 text-base text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">1.</span>
            <span>Partilhe o seu código com amigos e familiares.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">2.</span>
            <span>Receba comissão de 29%, 2% e 1% nos três níveis da sua equipa real.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">3.</span>
            <span>
              As comissões entram no seu saldo assim que a recarga do convidado for confirmada.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">4.</span>
            <span>Acompanhe aqui os convidados reais e os rendimentos acumulados.</span>
          </li>
        </ol>
      </section>
    </AppLayout>
  );
};
