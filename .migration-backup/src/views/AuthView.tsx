import React, { useState } from 'react';
import {
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  UserPlus,
  LogIn,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../context/SessionContext';
import { AppleLogo } from '../components/AppleLogo';
import { toast } from 'sonner';

interface AuthViewProps {
  initialMode?: 'login' | 'register' | 'recover';
}

export const AuthView: React.FC<AuthViewProps> = ({ initialMode = 'login' }) => {
  const { signIn, signUp, signInWithGoogle, signInWithFirebaseGoogle, resetPassword, navigateTo, allUsers } = useSession();

  const [mode, setMode] = useState<'login' | 'register' | 'recover'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Fields
  const [identifier, setIdentifier] = useState(''); // Phone or email
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Recovery fields
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [recoveryPin, setRecoveryPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedDemoPin, setGeneratedDemoPin] = useState<string | null>(null);

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Insira o seu número de telemóvel ou email.');
      return;
    }
    if (!password) {
      toast.error('Insira a sua palavra-passe.');
      return;
    }

    signIn(identifier, password);
  };

  // Handle Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      toast.error('Introduza um número de telemóvel válido de Moçambique (ex: 841234567).');
      return;
    }
    if (password.length < 4) {
      toast.error('A palavra-passe deve ter no mínimo 4 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As palavras-passes não coincidem.');
      return;
    }
    if (!agreeTerms) {
      toast.error('Deve concordar com os termos da plataforma para prosseguir.');
      return;
    }

    const ok = signUp(cleanPhone, password, inviteCode, email, fullName);
    if (ok) {
      navigateTo('/conta');
    }
  };

  // Handle Password Recovery
  const handleRecoveryRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = recoveryIdentifier.trim();
    if (!raw) {
      toast.error('Insira o número de telemóvel ou email registado.');
      return;
    }

    // Verify if user exists
    const isEmail = raw.includes('@');
    const cleanPhone = raw.replace(/\D/g, '');
    const userFound = allUsers.find((u) =>
      isEmail
        ? u.email?.toLowerCase() === raw.toLowerCase()
        : u.phone === cleanPhone || (cleanPhone.length >= 8 && u.phone.endsWith(cleanPhone))
    );

    if (!userFound) {
      toast.error('Nenhum utilizador encontrado com este contacto.');
      return;
    }

    // Generate a 6-digit verification PIN for this session
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedDemoPin(pin);
    setRecoveryStep(2);
    toast.success(`Código de verificação enviado! Código de segurança: ${pin}`, {
      duration: 10000,
    });
  };

  const handleRecoveryConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedDemoPin || recoveryPin.trim() !== generatedDemoPin.trim()) {
      toast.error('Código de verificação incorreto.');
      return;
    }
    if (newPassword.length < 4) {
      toast.error('A nova palavra-passe deve conter pelo menos 4 caracteres.');
      return;
    }

    const ok = resetPassword(recoveryIdentifier, newPassword, recoveryPin);
    if (ok) {
      setMode('login');
      setIdentifier(recoveryIdentifier);
      setPassword(newPassword);
      setRecoveryStep(1);
      setRecoveryPin('');
      setGeneratedDemoPin(null);
    }
  };

  // Google Sign-in Handler via Firebase
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const handleGoogleClick = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithFirebaseGoogle();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AppLayout title="Acesso à Conta" backTo="/conta" hideNav>
      <div className="mx-auto max-w-md w-full space-y-4 fade-up">
        {/* Brand Banner */}
        <div className="surface-card rounded-3xl p-6 text-center border border-border/80 shadow-md space-y-3 bg-gradient-to-b from-white to-slate-50">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <AppleLogo className="size-7" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight">
              APPLE INVEST
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Portal Oficial de Investimento em Tecnologia Moçambique
            </p>
          </div>

          {/* Mode Selector Segmented Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2 px-1 rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-foreground shadow-xs font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Iniciar Sessão
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`py-2 px-1 rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-foreground shadow-xs font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Criar Conta
            </button>
            <button
              type="button"
              onClick={() => setMode('recover')}
              className={`py-2 px-1 rounded-xl transition-all cursor-pointer ${
                mode === 'recover'
                  ? 'bg-white text-foreground shadow-xs font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Recuperar
            </button>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: INICIAR SESSÃO (LOGIN)
            ========================================================================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="surface-card rounded-3xl p-5 sm:p-6 border border-border/80 shadow-md space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                <Smartphone className="size-3.5 text-primary" />
                Número de Telemóvel ou Email
              </label>
              <div className="flex rounded-2xl border border-border bg-background overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ex: 841234567, 85..., 86... ou email"
                  className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Lock className="size-3.5 text-primary" />
                  Palavra-passe
                </label>
                <button
                  type="button"
                  onClick={() => setMode('recover')}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  Esqueceu-se?
                </button>
              </div>
              <div className="relative flex rounded-2xl border border-border bg-background overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduza a sua palavra-passe"
                  className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm sm:text-base font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <LogIn className="size-4.5" />
              <span>Entrar na Conta</span>
            </button>

            {/* Divider */}
            <div className="relative py-1 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/80" />
              </div>
              <span className="relative bg-card px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ou continue com
              </span>
            </div>

            {/* Google Sign-in Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isGoogleLoading}
              className="w-full rounded-2xl border border-border bg-white py-3 px-4 text-sm font-bold text-foreground hover:bg-slate-50 active:scale-98 transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? 'A autenticar...' : 'Continuar com Google'}</span>
            </button>

            <div className="pt-2 text-center text-xs text-muted-foreground">
              Ainda não tem conta?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                Criar conta gratuita (+100 MT)
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            TAB 2: CRIAR CONTA (REGISTER)
            ========================================================================= */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="surface-card rounded-3xl p-5 sm:p-6 border border-border/80 shadow-md space-y-3.5">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2 text-emerald-800 text-xs font-semibold">
              <Sparkles className="size-4 text-emerald-600 shrink-0" />
              <span>Bónus de Boas-Vindas de 100 MT garantido ao concluir o registo!</span>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                <Smartphone className="size-3.5 text-primary" />
                Número de Telemóvel (Moçambique) *
              </label>
              <div className="flex rounded-2xl border border-border bg-background overflow-hidden focus-within:border-primary transition-all">
                <span className="bg-slate-100 px-3.5 py-3 text-sm text-muted-foreground font-bold flex items-center border-r border-border">
                  +258
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 841234567, 85..., 86..."
                  className="w-full bg-transparent px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                  <User className="size-3.5 text-primary" />
                  Nome (Opcional)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                  <Mail className="size-3.5 text-primary" />
                  Email (Opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                <Lock className="size-3.5 text-primary" />
                Palavra-passe *
              </label>
              <div className="relative flex rounded-2xl border border-border bg-background overflow-hidden focus-within:border-primary transition-all">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full bg-transparent px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                <ShieldCheck className="size-3.5 text-primary" />
                Confirmar Palavra-passe *
              </label>
              <div className="relative flex rounded-2xl border border-border bg-background overflow-hidden focus-within:border-primary transition-all">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a palavra-passe"
                  className="w-full bg-transparent px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                <UserPlus className="size-3.5 text-primary" />
                Código de Convite (Opcional)
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Ex: IPH4920"
                className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none uppercase"
              />
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer"
              />
              <label htmlFor="terms" className="cursor-pointer">
                Concordo com os <strong>Termos e Regras da Plataforma</strong>
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm sm:text-base font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <UserPlus className="size-4.5" />
              <span>Concluir Registo</span>
            </button>

            {/* Divider */}
            <div className="relative py-1 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/80" />
              </div>
              <span className="relative bg-card px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ou registe-se com
              </span>
            </div>

            {/* Google Register Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isGoogleLoading}
              className="w-full rounded-2xl border border-border bg-white py-3 px-4 text-sm font-bold text-foreground hover:bg-slate-50 active:scale-98 transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? 'A autenticar...' : 'Criar Conta com Google (+100 MT)'}</span>
            </button>

            <div className="pt-2 text-center text-xs text-muted-foreground">
              Já tem uma conta registada?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                Iniciar Sessão
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            TAB 3: RECUPERAR PALAVRA-PASSE
            ========================================================================= */}
        {mode === 'recover' && (
          <div className="surface-card rounded-3xl p-5 sm:p-6 border border-border/80 shadow-md space-y-4">
            <div className="text-center space-y-1">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
                <KeyRound className="size-6" />
              </div>
              <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                Recuperação de Acesso
              </h2>
              <p className="text-xs text-muted-foreground">
                Redefina a sua palavra-passe de forma segura através do seu telemóvel ou email registado.
              </p>
            </div>

            {recoveryStep === 1 ? (
              <form onSubmit={handleRecoveryRequest} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1 uppercase tracking-wider">
                    Contacto Registado (+258 ou Email)
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryIdentifier}
                    onChange={(e) => setRecoveryIdentifier(e.target.value)}
                    placeholder="Ex: 841234567 ou utilizador@gmail.com"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm font-bold shadow hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Solicitar Código de Segurança</span>
                  <ArrowRight className="size-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRecoveryConfirm} className="space-y-3.5">
                {generatedDemoPin && (
                  <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 text-blue-900 text-xs">
                    <p className="font-bold flex items-center gap-1.5 text-blue-800">
                      <CheckCircle2 className="size-4" />
                      Código de Verificação Gerado:
                    </p>
                    <p className="font-mono text-base font-black tracking-widest mt-1 text-blue-950">
                      {generatedDemoPin}
                    </p>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Insira este código abaixo para confirmar a posse da conta.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1 uppercase tracking-wider">
                    Código de Segurança (6 dígitos)
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value)}
                    placeholder="Ex: 684920"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-base font-bold font-mono tracking-widest text-center text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1 uppercase tracking-wider">
                    Nova Palavra-passe
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep(1)}
                    className="w-1/3 rounded-2xl border border-border py-3 text-xs font-semibold text-muted-foreground hover:bg-secondary cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-bold shadow hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Salvar Nova Palavra-passe</span>
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 text-center text-xs text-muted-foreground">
              Lembrou-se da palavra-passe?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                Voltar ao Início de Sessão
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
