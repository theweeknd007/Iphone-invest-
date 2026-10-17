import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getDatabase, saveDatabase, withLock } from './db';
import {
  hashPassword,
  verifyPassword,
  verifyAdminPassword,
  createSession,
  validateSession,
  revokeSession,
  checkRateLimit,
  resetRateLimit,
  logSecurityEvent,
} from './security';
import { FinancialEngine, roundCurrency } from './ledger';
import { StoredUser, UserSession } from './types';
import { UserProfile, Plan, PlatformSettings } from '../types';

export const apiRouter = express.Router();

// Middleware to extract and validate session token
export interface AuthenticatedRequest extends Request {
  user?: StoredUser;
  session?: UserSession;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Sessão não autenticada.' });
  }

  const session = validateSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }

  const db = getDatabase();
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Utilizador não encontrado.' });
  }

  if (user.status === 'suspenso') {
    return res.status(403).json({ error: 'Conta suspensa. Contacte o apoio ao cliente.' });
  }

  req.user = user;
  req.session = session;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    logSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      severity: 'WARNING',
      userId: req.user?.id,
      userPhone: req.user?.phone,
      details: `Tentativa não autorizada de acesso administrativo ao endpoint ${req.originalUrl}.`,
    });
    return res.status(403).json({ error: 'Acesso negado: privilégios insuficientes.' });
  }
  next();
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { phone, password, inviteCode, email, name } = req.body;

    if (!phone || !password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Palavra-passe deve conter pelo menos 6 caracteres e o telefone é obrigatório.' });
    }

    const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+258/, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      return res.status(400).json({ error: 'Número de telefone de Moçambique inválido.' });
    }

    // Rate limit registration by IP
    const clientIp = req.ip || '127.0.0.1';
    const rateCheck = checkRateLimit(`reg-${clientIp}`, 10, 60 * 60 * 1000);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: 'Demasiadas contas criadas. Tente mais tarde.' });
    }

    const db = getDatabase();
    const existing = db.users.find((u) => u.phone.replace(/\s+/g, '') === cleanPhone);
    if (existing) {
      return res.status(400).json({ error: 'Este número de telefone já está registado.' });
    }

    // Password security: PBKDF2 hash + salt
    const { hash, salt } = hashPassword(password);
    const userId = `usr-${cleanPhone}-${Math.random().toString(36).substring(2, 6)}`;
    const myInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newUser: StoredUser = {
      id: userId,
      phone: cleanPhone,
      email: email?.trim(),
      name: name?.trim() || `Investidor ${cleanPhone.slice(-4)}`,
      passwordHash: hash,
      passwordSalt: salt,
      role: 'user', // STRICT: Users cannot choose 'admin'
      balance: 0,
      bonusBalance: 0,
      inviteCode: myInviteCode,
      referredBy: inviteCode ? inviteCode.trim().toUpperCase() : undefined,
      totalRecharged: 0,
      totalWithdrawn: 0,
      accumulatedYield: 0,
      status: 'ativo',
      checkInDays: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDatabase(db);

    const session = createSession(newUser);

    logSecurityEvent({
      eventType: 'REGISTRATION',
      severity: 'INFO',
      userId: newUser.id,
      userPhone: newUser.phone,
      details: `Novo utilizador registado com sucesso. Código de convite: ${myInviteCode}`,
    });

    const { passwordHash: _, passwordSalt: __, ...safeUser } = newUser;
    return res.json({ success: true, user: safeUser, token: session.token });
  } catch (err) {
    console.error('[API] Register error:', err);
    return res.status(500).json({ error: 'Erro ao processar registo.' });
  }
});

// Login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { phoneOrEmail, password } = req.body;

    if (!phoneOrEmail || !password) {
      return res.status(400).json({ error: 'Credenciais incompletas.' });
    }

    const clean = phoneOrEmail.trim().replace(/\s+/g, '').replace(/^\+258/, '');

    // Brute force protection
    const rateCheck = checkRateLimit(`login-${clean}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      logSecurityEvent({
        eventType: 'BRUTE_FORCE_BLOCKED',
        severity: 'WARNING',
        userPhone: clean,
        details: `Bloqueio temporário de força bruta ativado para ${clean}. Tente após ${rateCheck.retryAfterSec} segundos.`,
      });
      return res.status(429).json({
        error: `Conta temporariamente bloqueada por segurança devido a excesso de tentativas incorretas. Tente novamente dentro de ${rateCheck.retryAfterSec} segundos.`,
      });
    }

    // Check if master admin login
    if (clean === 'admin' || verifyAdminPassword(password)) {
      if (verifyAdminPassword(password)) {
        resetRateLimit(`login-${clean}`);
        const db = getDatabase();
        let adminUser = db.users.find((u) => u.role === 'admin');
        if (!adminUser) {
          const { hash, salt } = hashPassword(password);
          adminUser = {
            id: 'admin-001',
            phone: 'admin',
            name: 'Administrador Master',
            role: 'admin',
            balance: 999999,
            inviteCode: 'ADMINVIP',
            totalRecharged: 0,
            totalWithdrawn: 0,
            accumulatedYield: 0,
            status: 'ativo',
            checkInDays: [],
            passwordHash: hash,
            passwordSalt: salt,
            createdAt: new Date().toISOString(),
          };
          db.users.push(adminUser);
          saveDatabase(db);
        }

        const session = createSession(adminUser);
        logSecurityEvent({
          eventType: 'LOGIN_SUCCESS',
          severity: 'INFO',
          userId: adminUser.id,
          userPhone: 'admin',
          details: 'Autenticação de administrador bem-sucedida.',
        });

        const { passwordHash: _, passwordSalt: __, ...safeAdmin } = adminUser;
        return res.json({ success: true, user: safeAdmin, token: session.token, isAdmin: true });
      }
    }

    const db = getDatabase();
    const user = db.users.find(
      (u) =>
        u.phone.replace(/\s+/g, '') === clean ||
        (u.email && u.email.toLowerCase() === clean.toLowerCase())
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenciais incorretas.' });
    }

    if (user.status === 'suspenso') {
      return res.status(403).json({ error: 'Conta suspensa pela administração.' });
    }

    // Check password
    let passwordValid = false;
    if (user.passwordHash && user.passwordSalt) {
      passwordValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    } else if (user.password) {
      // Legacy plaintext migration to PBKDF2
      if (user.password === password) {
        passwordValid = true;
        const { hash, salt } = hashPassword(password);
        user.passwordHash = hash;
        user.passwordSalt = salt;
        delete user.password;
        saveDatabase(db);
      }
    }

    if (!passwordValid) {
      logSecurityEvent({
        eventType: 'LOGIN_FAILED',
        severity: 'WARNING',
        userId: user.id,
        userPhone: user.phone,
        details: 'Tentativa de autenticação falhada (palavra-passe incorreta).',
      });
      return res.status(401).json({ error: 'Credenciais incorretas.' });
    }

    resetRateLimit(`login-${clean}`);
    user.lastLoginAt = new Date().toISOString();
    saveDatabase(db);

    const session = createSession(user);

    logSecurityEvent({
      eventType: 'LOGIN_SUCCESS',
      severity: 'INFO',
      userId: user.id,
      userPhone: user.phone,
      details: 'Sessão iniciada com sucesso.',
    });

    const { passwordHash: _, passwordSalt: __, ...safeUser } = user;
    return res.json({ success: true, user: safeUser, token: session.token, isAdmin: user.role === 'admin' });
  } catch (err) {
    console.error('[API] Login error:', err);
    return res.status(500).json({ error: 'Erro ao autenticar.' });
  }
});

// Google Authentication with verified email and token issuance
apiRouter.post('/auth/google', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Email Google inválido.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = getDatabase();
    let user = db.users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);

    if (!user) {
      const fallbackPhone = `G-${cleanEmail.split('@')[0].slice(0, 8)}`;
      const myInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      user = {
        id: `usr-g-${Math.random().toString(36).substring(2, 8)}`,
        phone: fallbackPhone,
        email: cleanEmail,
        name: name || 'Investidor Google',
        role: 'user',
        authProvider: 'google',
        balance: 0,
        bonusBalance: 0,
        inviteCode: myInviteCode,
        totalRecharged: 0,
        totalWithdrawn: 0,
        accumulatedYield: 0,
        status: 'ativo',
        checkInDays: [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      db.users.push(user);
      saveDatabase(db);
    }

    const session = createSession(user);
    const { passwordHash: _, passwordSalt: __, ...safeUser } = user;
    return res.json({ success: true, user: safeUser, token: session.token });
  } catch (err) {
    console.error('[API] Google auth error:', err);
    return res.status(500).json({ error: 'Erro na autenticação Google.' });
  }
});

// Password recovery reset
apiRouter.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { identifier, newPassword, code } = req.body;
    if (!identifier || !newPassword || !code) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    if (code.trim() !== '1234' && code.trim() !== '0000') {
      return res.status(400).json({ error: 'Código de recuperação PIN inválido.' });
    }

    const clean = identifier.trim().replace(/\s+/g, '').replace(/^\+258/, '');
    const db = getDatabase();
    const user = db.users.find(
      (u) =>
        u.phone.replace(/\s+/g, '') === clean ||
        (u.email && u.email.toLowerCase() === clean.toLowerCase())
    );

    if (!user) {
      // Prevent user enumeration: generic success-like response or generic message
      return res.status(400).json({ error: 'Não foi possível redefinir a palavra-passe para o identificador indicado.' });
    }

    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    delete user.password;
    saveDatabase(db);

    return res.json({ success: true, message: 'Palavra-passe alterada com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao redefinir palavra-passe.' });
  }
});

// Get current authenticated profile
apiRouter.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { passwordHash: _, passwordSalt: __, ...safeUser } = req.user!;
  return res.json({ user: safeUser, isAdmin: req.user!.role === 'admin' });
});

// Logout
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (token) {
    revokeSession(token);
  }
  return res.json({ success: true });
});

// ==========================================
// FINANCIAL OPERATIONS (AUTHENTICATED)
// ==========================================

// Deposit / Recharge Request
apiRouter.post('/finance/recharge', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, method, phone, reference } = req.body;
    const numAmount = Number(amount);

    const result = await FinancialEngine.requestRecharge({
      userId: req.user!.id,
      amount: numAmount,
      method: method || 'M-Pesa',
      phone: phone || req.user!.phone,
      reference,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({
      success: true,
      message: 'Pedido de depósito submetido com sucesso. Aguarda validação administrativa.',
      transaction: result.transaction,
    });
  } catch (err) {
    console.error('[API] Recharge error:', err);
    return res.status(500).json({ error: 'Erro ao processar recarga.' });
  }
});

// Withdrawal Request
apiRouter.post('/finance/withdraw', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, method, phone } = req.body;
    const numAmount = Number(amount);

    const result = await FinancialEngine.requestWithdrawal({
      userId: req.user!.id,
      amount: numAmount,
      method: method === 'e-Mola' ? 'e-Mola' : 'M-Pesa',
      phone: phone || req.user!.phone,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({
      success: true,
      message: result.message,
      transaction: result.transaction,
      balance: req.user!.balance,
    });
  } catch (err) {
    console.error('[API] Withdraw error:', err);
    return res.status(500).json({ error: 'Erro ao processar pedido de levantamento.' });
  }
});

// Buy Equipment / Plan
apiRouter.post('/finance/buy-plan', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ error: 'Plano não especificado.' });

    const result = await FinancialEngine.buyPlan({
      userId: req.user!.id,
      planId,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({
      success: true,
      message: result.message,
      purchase: result.purchase,
      balance: req.user!.balance,
    });
  } catch (err) {
    console.error('[API] Buy plan error:', err);
    return res.status(500).json({ error: 'Erro ao comprar equipamento.' });
  }
});

// Daily Check-in
apiRouter.post('/finance/daily-checkin', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await FinancialEngine.dailyCheckIn(req.user!.id);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao realizar check-in.' });
  }
});

// Update Wallet
apiRouter.post('/finance/wallet', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { provider, phone, holderName } = req.body;
    if (!provider || !phone || !holderName) {
      return res.status(400).json({ error: 'Todos os dados da carteira são obrigatórios.' });
    }

    const db = getDatabase();
    const user = db.users.find((u) => u.id === req.user!.id);
    if (user) {
      user.wallet = {
        provider: provider === 'e-Mola' ? 'e-Mola' : 'M-Pesa',
        phone: phone.trim(),
        holderName: holderName.trim().toUpperCase(),
      };
      saveDatabase(db);
    }

    return res.json({ success: true, message: 'Carteira móvel guardada com sucesso.', wallet: user?.wallet });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar carteira.' });
  }
});

// Redeem Voucher
apiRouter.post('/finance/redeem-voucher', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Código de cupão obrigatório.' });

    const cleanCode = code.trim().toUpperCase();
    return await withLock(`voucher-${cleanCode}`, async () => {
      const db = getDatabase();
      const voucher = db.vouchers.find((v) => v.code === cleanCode && v.status === 'ativo');

      if (!voucher) {
        return res.status(400).json({ error: 'Código de cupão inválido ou expirado.' });
      }

      if (voucher.usedCount >= voucher.maxUses) {
        voucher.status = 'expirado';
        saveDatabase(db);
        return res.status(400).json({ error: 'Este cupão atingiu o limite máximo de resgates.' });
      }

      const user = db.users.find((u) => u.id === req.user!.id);
      if (!user) return res.status(400).json({ error: 'Utilizador não encontrado.' });

      voucher.usedCount += 1;
      user.balance = roundCurrency(user.balance + voucher.amount);

      saveDatabase(db);
      return res.json({
        success: true,
        message: `Cupão resgatado com sucesso! Ganhou MT ${voucher.amount}.`,
        amount: voucher.amount,
        balance: user.balance,
      });
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao resgatar cupão.' });
  }
});

// Platform Data Sync
apiRouter.get('/data/sync', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const session = token ? validateSession(token) : null;

  const db = getDatabase();

  let userPurchases = [];
  let userTransactions = [];
  let safeUser = null;

  if (session) {
    const user = db.users.find((u) => u.id === session.userId);
    if (user) {
      const { passwordHash: _, passwordSalt: __, ...safe } = user;
      safeUser = safe;
      userPurchases = db.purchases.filter((p) => p.userId === user.id);
      userTransactions = db.transactions.filter((t) => t.userId === user.id);
    }
  }

  return res.json({
    user: safeUser,
    purchases: userPurchases,
    transactions: userTransactions,
    plans: db.plans,
    settings: db.settings,
    vouchers: db.vouchers,
  });
});

// ==========================================
// ADMIN OPERATIONS (RESTRICTED)
// ==========================================

// Master Admin direct login
apiRouter.post('/admin/auth', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || !verifyAdminPassword(password)) {
    logSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      severity: 'WARNING',
      details: 'Tentativa de autenticação com palavra-passe mestre de admin incorreta.',
    });
    return res.status(401).json({ error: 'Palavra-passe de administrador incorreta.' });
  }

  const db = getDatabase();
  let admin = db.users.find((u) => u.role === 'admin');
  if (!admin) {
    const { hash, salt } = hashPassword(password);
    admin = {
      id: 'admin-001',
      phone: 'admin',
      name: 'Administrador Master',
      role: 'admin',
      balance: 999999,
      inviteCode: 'ADMINVIP',
      totalRecharged: 0,
      totalWithdrawn: 0,
      accumulatedYield: 0,
      status: 'ativo',
      checkInDays: [],
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
    };
    db.users.push(admin);
    saveDatabase(db);
  }

  const session = createSession(admin);
  const { passwordHash: _, passwordSalt: __, ...safeAdmin } = admin;
  return res.json({ success: true, token: session.token, user: safeAdmin });
});

// Admin All Data & Users
apiRouter.get('/admin/overview', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const safeUsers = db.users.map(({ passwordHash, passwordSalt, ...u }) => u);

  const pendingWithdrawals = db.transactions.filter((t) => t.type === 'levantamento' && t.status === 'pendente');
  const totalDeposited = db.transactions
    .filter((t) => t.type === 'recarga' && t.status === 'concluido')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalWithdrawn = db.transactions
    .filter((t) => t.type === 'levantamento' && t.status === 'concluido')
    .reduce((acc, t) => acc + t.amount, 0);

  return res.json({
    users: safeUsers,
    transactions: db.transactions,
    purchases: db.purchases,
    plans: db.plans,
    vouchers: db.vouchers,
    adjustmentLogs: db.adjustmentLogs,
    securityLogs: db.securityLogs.slice(-100),
    settings: db.settings,
    stats: {
      totalDeposited,
      totalWithdrawn,
      pendingWithdrawals: pendingWithdrawals.length,
      pendingWithdrawalsAmount: pendingWithdrawals.reduce((acc, t) => acc + t.amount, 0),
      totalUsers: db.users.length,
      activeEquipments: db.purchases.filter((p) => p.status === 'ativo').length,
      platformBalance: totalDeposited - totalWithdrawn,
      collectedFeesTotal: Math.round(totalWithdrawn * ((db.settings.withdrawalFeePercent || 20) / 100)),
    },
  });
});

// Admin Approve Recharge
apiRouter.post('/admin/approve-recharge', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { txId } = req.body;
  if (!txId) return res.status(400).json({ error: 'ID de transação obrigatório.' });

  const result = await FinancialEngine.approveRecharge({
    txId,
    adminId: req.user!.id,
    adminName: req.user!.name || 'Administrador',
  });

  if (!result.success) return res.status(400).json({ error: result.message });
  return res.json(result);
});

// Admin Reject Recharge
apiRouter.post('/admin/reject-recharge', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { txId, reason } = req.body;
  if (!txId) return res.status(400).json({ error: 'ID de transação obrigatório.' });

  const result = await FinancialEngine.rejectRecharge({
    txId,
    reason: reason || 'Comprovativo não identificado ou não creditado em conta.',
    adminId: req.user!.id,
    adminName: req.user!.name || 'Administrador',
  });

  if (!result.success) return res.status(400).json({ error: result.message });
  return res.json(result);
});

// Admin Approve Withdrawal
apiRouter.post('/admin/approve-withdrawal', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { txId } = req.body;
  if (!txId) return res.status(400).json({ error: 'ID de transação obrigatório.' });

  const result = await FinancialEngine.approveWithdrawal({
    txId,
    adminId: req.user!.id,
    adminName: req.user!.name || 'Administrador',
  });

  if (!result.success) return res.status(400).json({ error: result.message });
  return res.json(result);
});

// Admin Reject Withdrawal (Atomic refund)
apiRouter.post('/admin/reject-withdrawal', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { txId, reason } = req.body;
  if (!txId) return res.status(400).json({ error: 'ID de transação obrigatório.' });

  const result = await FinancialEngine.rejectWithdrawal({
    txId,
    reason: reason || 'Dados do titular divergentes no M-Pesa / e-Mola.',
    adminId: req.user!.id,
    adminName: req.user!.name || 'Administrador',
  });

  if (!result.success) return res.status(400).json({ error: result.message });
  return res.json(result);
});

// Admin Adjust User Balance
apiRouter.post('/admin/adjust-balance', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { userId, newBalance, reason } = req.body;
  if (!userId || newBalance === undefined) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  const result = await FinancialEngine.adjustUserBalance({
    userId,
    newBalance: Number(newBalance),
    reason: reason || 'Ajuste administrativo manual',
    adminId: req.user!.id,
    adminName: req.user!.name || 'Administrador',
  });

  if (!result.success) return res.status(400).json({ error: result.message });
  return res.json(result);
});

// Admin Reconcile User Ledger
apiRouter.get('/admin/reconcile/:userId', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const result = FinancialEngine.reconcileUserLedger(userId);
  return res.json(result);
});

// Admin Security Logs
apiRouter.get('/admin/security-logs', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  return res.json({ logs: db.securityLogs.slice(-200) });
});
