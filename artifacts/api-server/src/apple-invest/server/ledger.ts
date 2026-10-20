import crypto from 'crypto';
import { getDatabase, saveDatabase, withLock } from './db';
import { logSecurityEvent } from './security';
import { Transaction, BalanceAdjustmentLog, Purchase, Plan } from '../types';
import { StoredUser } from './types';

// Helper to round to 2 decimal places
export function roundCurrency(val: number): number {
  return Math.round(val * 100) / 100;
}

/**
 * Atomic Financial Engine
 */
export class FinancialEngine {
  /**
   * Request a recharge. Notice: Recharge requests NEVER increase user balance directly!
   * It creates a transaction with status 'pendente' requiring admin verification.
   */
  static async requestRecharge(params: {
    userId: string;
    amount: number;
    method: string;
    phone: string;
    reference?: string;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; transaction?: Transaction; message?: string }> {
    const { userId, amount, method, phone, reference, idempotencyKey } = params;

    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Montante inválido.' };
    }

    const roundedAmount = roundCurrency(amount);

    return await withLock(`user-${userId}`, async () => {
      const db = getDatabase();
      const user = db.users.find((u) => u.id === userId);
      if (!user) {
        return { success: false, message: 'Utilizador não encontrado.' };
      }

      if (roundedAmount < (db.settings.minRecharge || 100)) {
        return {
          success: false,
          message: `Montante mínimo de recarga é de MT ${db.settings.minRecharge || 100}.`,
        };
      }

      // Check idempotency by key first
      if (idempotencyKey) {
        const existingByKey = db.transactions.find(
          (t) => t.type === 'recarga' && (t as any).idempotencyKey === idempotencyKey
        );
        if (existingByKey) {
          return { success: true, transaction: existingByKey };
        }
      }

      // Check idempotency if reference or key provided
      if (reference) {
        const existingRef = db.transactions.find(
          (t) => t.type === 'recarga' && t.reference && t.reference.toLowerCase() === reference.trim().toLowerCase()
        );
        if (existingRef) {
          return {
            success: false,
            message: 'Esta referência de pagamento já foi registada anteriormente.',
          };
        }
      }

      const tx: Transaction & { idempotencyKey?: string } = {
        id: `tx-rec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId: user.id,
        userPhone: phone || user.phone,
        type: 'recarga',
        amount: roundedAmount,
        method: `${method} (${phone})`,
        reference: reference?.trim().toUpperCase(),
        status: 'pendente',
        createdAt: new Date().toISOString(),
      };

      if (idempotencyKey) {
        tx.idempotencyKey = idempotencyKey;
      }

      db.transactions.unshift(tx);
      saveDatabase(db);

      logSecurityEvent({
        eventType: 'RECHARGE_APPROVED',
        severity: 'INFO',
        userId: user.id,
        userPhone: user.phone,
        details: `Pedido de recarga de MT ${roundedAmount} criado via ${method}. Aguarda confirmação do administrador.`,
      });

      return { success: true, transaction: tx };
    });
  }

  /**
   * Admin approves a recharge.
   * Atomically credits user balance and marks transaction as 'concluido'.
   */
  static async approveRecharge(params: {
    txId: string;
    adminId: string;
    adminName: string;
  }): Promise<{ success: boolean; message: string; transaction?: Transaction }> {
    const { txId, adminId, adminName } = params;

    const db = getDatabase();
    const tx = db.transactions.find((t) => t.id === txId);
    if (!tx || tx.type !== 'recarga') {
      return { success: false, message: 'Transação de recarga não encontrada.' };
    }

    if (tx.status === 'concluido') {
      return { success: true, message: 'Recarga já aprovada anteriormente.', transaction: tx };
    }

    if (tx.status !== 'pendente') {
      return { success: false, message: `Esta recarga já se encontra com o estado: ${tx.status}.` };
    }

    const userId = tx.userId;
    if (!userId) {
      return { success: false, message: 'Transação sem utilizador associado.' };
    }

    return await withLock(`user-${userId}`, async () => {
      const user = db.users.find((u) => u.id === userId);
      if (!user) {
        return { success: false, message: 'Utilizador beneficiário não encontrado.' };
      }

      const prevBalance = user.balance;
      const newBalance = roundCurrency(prevBalance + tx.amount);

      user.balance = newBalance;
      user.totalRecharged = roundCurrency((user.totalRecharged || 0) + tx.amount);
      tx.status = 'concluido';

      const log: BalanceAdjustmentLog = {
        id: `adj-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        targetUserId: user.id,
        targetUserPhone: user.phone,
        previousBalance: prevBalance,
        newBalance: newBalance,
        amount: tx.amount,
        type: 'aprovacao_recarga',
        reason: `Aprovação de recarga de MT ${tx.amount} (${tx.method})`,
        adminId,
        adminName,
        createdAt: new Date().toISOString(),
      };
      db.adjustmentLogs.unshift(log);

      saveDatabase(db);

      logSecurityEvent({
        eventType: 'RECHARGE_APPROVED',
        severity: 'INFO',
        userId: user.id,
        userPhone: user.phone,
        operatorId: adminId,
        details: `Recarga #${tx.id} de MT ${tx.amount} aprovada pelo admin ${adminName}. Saldo atualizado de MT ${prevBalance} para MT ${newBalance}.`,
      });

      return { success: true, message: 'Recarga aprovada com sucesso.', transaction: tx };
    });
  }

  /**
   * Admin rejects a recharge.
   */
  static async rejectRecharge(params: {
    txId: string;
    reason: string;
    adminId: string;
    adminName: string;
  }): Promise<{ success: boolean; message: string }> {
    const { txId, reason, adminId, adminName } = params;
    const db = getDatabase();
    const tx = db.transactions.find((t) => t.id === txId);
    if (!tx || tx.type !== 'recarga') {
      return { success: false, message: 'Transação de recarga não encontrada.' };
    }
    if (tx.status === 'falhado') {
      return { success: true, message: 'Recarga já rejeitada anteriormente.' };
    }
    if (tx.status !== 'pendente') {
      return { success: false, message: `Esta recarga já tem o estado ${tx.status}.` };
    }

    tx.status = 'falhado';
    tx.note = reason;
    saveDatabase(db);

    logSecurityEvent({
      eventType: 'RECHARGE_REJECTED',
      severity: 'WARNING',
      userId: tx.userId,
      userPhone: tx.userPhone,
      operatorId: adminId,
      details: `Recarga #${tx.id} rejeitada pelo admin ${adminName}. Motivo: ${reason}`,
    });

    return { success: true, message: 'Recarga rejeitada com sucesso.' };
  }

  /**
   * Request a withdrawal.
   * Atomically verifies balance >= amount, debits balance, and creates 'pendente' transaction.
   * Concurrency protected by withLock to prevent double-spending!
   */
  static async requestWithdrawal(params: {
    userId: string;
    amount: number;
    method: 'M-Pesa' | 'e-Mola';
    phone: string;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; message: string; transaction?: Transaction }> {
    const { userId, amount, method, phone, idempotencyKey } = params;

    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Montante inválido.' };
    }

    const roundedAmount = roundCurrency(amount);

    return await withLock(`user-${userId}`, async () => {
      const db = getDatabase();
      const user = db.users.find((u) => u.id === userId);
      if (!user) {
        return { success: false, message: 'Utilizador não encontrado.' };
      }

      if (!db.settings.withdrawalsEnabled) {
        return { success: false, message: 'Os levantamentos estão temporariamente desativados pela administração.' };
      }

      if (idempotencyKey) {
        const existingByKey = db.transactions.find(
          (t) => t.type === 'levantamento' && (t as any).idempotencyKey === idempotencyKey
        );
        if (existingByKey) {
          return { success: true, message: 'Pedido já registado anteriormente.', transaction: existingByKey };
        }
      }

      const minW = db.settings.minWithdrawal || 100;
      if (roundedAmount < minW) {
        return { success: false, message: `O valor mínimo para levantamento é de MT ${minW}.` };
      }

      if (user.balance < roundedAmount) {
        return {
          success: false,
          message: `Saldo insuficiente. O seu saldo disponível é de MT ${user.balance}.`,
        };
      }

      const pendingCount = db.transactions.filter(
        (t) => t.userId === user.id && t.type === 'levantamento' && t.status === 'pendente'
      ).length;
      if (pendingCount >= 3) {
        return {
          success: false,
          message: 'Já possui pedidos de levantamento pendentes em análise. Aguarde a conclusão antes de submeter outro.',
        };
      }

      const prevBalance = user.balance;
      user.balance = roundCurrency(user.balance - roundedAmount);
      user.totalWithdrawn = roundCurrency((user.totalWithdrawn || 0) + roundedAmount);

      const tx: Transaction & { idempotencyKey?: string } = {
        id: `tx-wth-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId: user.id,
        userPhone: phone || user.phone,
        type: 'levantamento',
        amount: roundedAmount,
        method: `${method} (${phone})`,
        status: 'pendente',
        createdAt: new Date().toISOString(),
      };

      if (idempotencyKey) {
        tx.idempotencyKey = idempotencyKey;
      }

      db.transactions.unshift(tx);
      saveDatabase(db);

      logSecurityEvent({
        eventType: 'WITHDRAWAL_APPROVED',
        severity: 'INFO',
        userId: user.id,
        userPhone: user.phone,
        details: `Levantamento #${tx.id} de MT ${roundedAmount} solicitado via ${method}. Saldo debitado de MT ${prevBalance} para MT ${user.balance}.`,
      });

      return { success: true, message: 'Pedido de levantamento submetido com sucesso.', transaction: tx };
    });
  }

  /**
   * Admin approves a withdrawal
   */
  static async approveWithdrawal(params: {
    txId: string;
    adminId: string;
    adminName: string;
  }): Promise<{ success: boolean; message: string }> {
    const { txId, adminId, adminName } = params;
    const db = getDatabase();
    const tx = db.transactions.find((t) => t.id === txId);
    if (!tx || tx.type !== 'levantamento') {
      return { success: false, message: 'Transação de levantamento não encontrada.' };
    }
    if (tx.status === 'concluido') {
      return { success: true, message: 'Levantamento já marcado como concluído.' };
    }
    if (tx.status !== 'pendente') {
      return { success: false, message: `Este levantamento já está com o estado ${tx.status}.` };
    }

    tx.status = 'concluido';
    saveDatabase(db);

    logSecurityEvent({
      eventType: 'WITHDRAWAL_APPROVED',
      severity: 'INFO',
      userId: tx.userId,
      userPhone: tx.userPhone,
      operatorId: adminId,
      details: `Levantamento #${tx.id} de MT ${tx.amount} marcado como concluído pelo admin ${adminName}.`,
    });

    return { success: true, message: 'Levantamento aprovado com sucesso.' };
  }

  /**
   * Admin rejects a withdrawal.
   * AUTOMATIC REFUND: Returns funds to user balance with audit log!
   */
  static async rejectWithdrawal(params: {
    txId: string;
    reason: string;
    adminId: string;
    adminName: string;
  }): Promise<{ success: boolean; message: string }> {
    const { txId, reason, adminId, adminName } = params;
    const db = getDatabase();
    const tx = db.transactions.find((t) => t.id === txId);
    if (!tx || tx.type !== 'levantamento') {
      return { success: false, message: 'Transação de levantamento não encontrada.' };
    }
    if (tx.status === 'falhado') {
      return { success: true, message: 'Levantamento já rejeitado anteriormente.' };
    }
    if (tx.status !== 'pendente') {
      return { success: false, message: `Este levantamento já tem o estado ${tx.status}.` };
    }

    const userId = tx.userId;
    if (!userId) {
      tx.status = 'falhado';
      tx.note = reason;
      saveDatabase(db);
      return { success: true, message: 'Levantamento rejeitado.' };
    }

    return await withLock(`user-${userId}`, async () => {
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        const prevBal = user.balance;
        user.balance = roundCurrency(user.balance + tx.amount);
        user.totalWithdrawn = Math.max(0, roundCurrency((user.totalWithdrawn || 0) - tx.amount));

        const log: BalanceAdjustmentLog = {
          id: `adj-ref-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          targetUserId: user.id,
          targetUserPhone: user.phone,
          previousBalance: prevBal,
          newBalance: user.balance,
          amount: tx.amount,
          type: 'credito',
          reason: `Reembolso por levantamento rejeitado: ${reason}`,
          adminId,
          adminName,
          createdAt: new Date().toISOString(),
        };
        db.adjustmentLogs.unshift(log);
      }

      tx.status = 'falhado';
      tx.note = reason;
      saveDatabase(db);

      logSecurityEvent({
        eventType: 'WITHDRAWAL_REJECTED',
        severity: 'WARNING',
        userId: tx.userId,
        userPhone: tx.userPhone,
        operatorId: adminId,
        details: `Levantamento #${tx.id} de MT ${tx.amount} rejeitado pelo admin ${adminName}. Fundos reembolsados ao utilizador. Motivo: ${reason}`,
      });

      return { success: true, message: 'Levantamento rejeitado e montante reembolsado ao utilizador.' };
    });
  }

  /**
   * Buy equipment/plan
   */
  static async buyPlan(params: {
    userId: string;
    planId: string;
  }): Promise<{ success: boolean; message: string; purchase?: Purchase }> {
    const { userId, planId } = params;

    return await withLock(`user-${userId}`, async () => {
      const db = getDatabase();
      const user = db.users.find((u) => u.id === userId);
      if (!user) return { success: false, message: 'Utilizador não encontrado.' };

      const plan = db.plans.find((p) => p.id === planId);
      if (!plan) return { success: false, message: 'Equipamento não encontrado.' };

      if (user.balance < plan.price) {
        return {
          success: false,
          message: `Saldo insuficiente (${user.balance} MT). Recarregue a sua conta para ativar o ${plan.name}.`,
        };
      }

      user.balance = roundCurrency(user.balance - plan.price);

      const purchase: Purchase = {
        id: `pur-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId: user.id,
        planId: plan.id,
        planName: plan.name,
        model: plan.model,
        price: plan.price,
        dailyYield: plan.dailyYield,
        days: plan.days,
        daysCompleted: 0,
        totalEarned: 0,
        purchasedAt: new Date().toISOString(),
        lastPayoutAt: new Date().toISOString(),
        status: 'ativo',
      };

      db.purchases.push(purchase);

      const tx: Transaction = {
        id: `tx-plan-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId: user.id,
        userPhone: user.phone,
        type: 'ajuste',
        amount: plan.price,
        method: `Compra de Equipamento (${plan.name})`,
        status: 'concluido',
        createdAt: new Date().toISOString(),
      };
      db.transactions.unshift(tx);

      saveDatabase(db);
      return { success: true, message: `Equipamento ${plan.name} ativado com sucesso!`, purchase };
    });
  }

  /**
   * Daily check-in
   */
  static async dailyCheckIn(userId: string): Promise<{ success: boolean; reward: number; message: string }> {
    return await withLock(`user-${userId}`, async () => {
      const db = getDatabase();
      const user = db.users.find((u) => u.id === userId);
      if (!user) return { success: false, reward: 0, message: 'Utilizador não encontrado.' };

      const todayStr = new Date().toISOString().split('T')[0];
      if (user.lastCheckInDate === todayStr) {
        return { success: false, reward: 0, message: 'Já realizou o check-in diário hoje. Volte amanhã!' };
      }

      const reward = db.settings.checkInBonus || 5;
      user.lastCheckInDate = todayStr;
      user.balance = roundCurrency(user.balance + reward);

      const dayOfMonth = new Date().getDate();
      if (!user.checkInDays) user.checkInDays = [];
      if (!user.checkInDays.includes(dayOfMonth)) {
        user.checkInDays.push(dayOfMonth);
      }

      const tx: Transaction = {
        id: `tx-chk-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId: user.id,
        userPhone: user.phone,
        type: 'bonus',
        amount: reward,
        method: 'Recompensa de Check-in Diário',
        status: 'concluido',
        createdAt: new Date().toISOString(),
      };
      db.transactions.unshift(tx);

      saveDatabase(db);
      return { success: true, reward, message: `Check-in realizado com sucesso! Ganhou MT ${reward}.` };
    });
  }

  /**
   * Administrative balance adjustment with immutable audit trail
   */
  static async adjustUserBalance(params: {
    userId: string;
    newBalance: number;
    reason: string;
    adminId: string;
    adminName: string;
  }): Promise<{ success: boolean; message: string; previousBalance: number; newBalance: number }> {
    const { userId, newBalance, reason, adminId, adminName } = params;

    if (isNaN(newBalance) || newBalance < 0) {
      return { success: false, message: 'Montante inválido ou negativo.', previousBalance: 0, newBalance: 0 };
    }

    const roundedNew = roundCurrency(newBalance);

    return await withLock(`user-${userId}`, async () => {
      const db = getDatabase();
      const user = db.users.find((u) => u.id === userId);
      if (!user) {
        return { success: false, message: 'Utilizador não encontrado.', previousBalance: 0, newBalance: 0 };
      }

      const prevBal = user.balance;
      const diff = roundCurrency(roundedNew - prevBal);

      user.balance = roundedNew;

      const log: BalanceAdjustmentLog = {
        id: `adj-man-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        targetUserId: user.id,
        targetUserPhone: user.phone,
        previousBalance: prevBal,
        newBalance: roundedNew,
        amount: Math.abs(diff),
        type: diff >= 0 ? 'credito' : 'debito',
        reason: reason || 'Ajuste manual administrativo',
        adminId,
        adminName,
        createdAt: new Date().toISOString(),
      };
      db.adjustmentLogs.unshift(log);

      const tx: Transaction = {
        id: `tx-adj-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId: user.id,
        userPhone: user.phone,
        type: 'ajuste',
        amount: Math.abs(diff),
        method: `Ajuste Administrativo (${reason})`,
        status: 'concluido',
        createdAt: new Date().toISOString(),
      };
      db.transactions.unshift(tx);

      saveDatabase(db);

      logSecurityEvent({
        eventType: 'BALANCE_ADJUSTED',
        severity: 'WARNING',
        userId: user.id,
        userPhone: user.phone,
        operatorId: adminId,
        details: `Saldo do utilizador ${user.phone} ajustado de MT ${prevBal} para MT ${roundedNew} por ${adminName}. Motivo: ${reason}`,
      });

      return {
        success: true,
        message: `Saldo atualizado com sucesso para MT ${roundedNew}.`,
        previousBalance: prevBal,
        newBalance: roundedNew,
      };
    });
  }

  /**
   * Reconciliation Engine: audits ledger consistency for user
   */
  static reconcileUserLedger(userId: string): {
    consistent: boolean;
    currentBalance: number;
    expectedBalance: number;
    discrepancy: number;
    transactionCount: number;
  } {
    const db = getDatabase();
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return { consistent: false, currentBalance: 0, expectedBalance: 0, discrepancy: 0, transactionCount: 0 };
    }

    const userTxs = db.transactions.filter((t) => t.userId === user.id);

    const approvedDeposits = db.transactions
      .filter((t) => t.userId === user.id && t.type === 'recarga' && t.status === 'concluido')
      .reduce((acc, t) => acc + t.amount, 0);

    const yields = db.transactions
      .filter((t) => t.userId === user.id && t.type === 'rendimento' && t.status === 'concluido')
      .reduce((acc, t) => acc + t.amount, 0);

    const bonuses = db.transactions
      .filter((t) => t.userId === user.id && t.type === 'bonus' && t.status === 'concluido')
      .reduce((acc, t) => acc + t.amount, 0);

    const withdrawalsDebited = db.transactions
      .filter((t) => t.userId === user.id && t.type === 'levantamento' && (t.status === 'concluido' || t.status === 'pendente'))
      .reduce((acc, t) => acc + t.amount, 0);

    const userPurchases = db.purchases.filter((p) => p.userId === user.id);
    const totalSpentOnPurchases = userPurchases.reduce((acc, p) => acc + p.price, 0);

    const manualAdjustments = db.adjustmentLogs
      .filter((a) => a.targetUserId === user.id && a.type !== 'aprovacao_recarga' && !a.reason.toLowerCase().includes('reembolso'))
      .reduce((acc, a) => acc + (a.type === 'credito' || a.type === 'bonus' ? a.amount : -a.amount), 0);

    const expected = roundCurrency(
      approvedDeposits + yields + bonuses - withdrawalsDebited - totalSpentOnPurchases + manualAdjustments
    );
    const current = roundCurrency(user.balance);
    const discrepancy = roundCurrency(Math.abs(current - expected));

    const isConsistent = discrepancy <= 1.0;

    if (!isConsistent) {
      logSecurityEvent({
        eventType: 'DISCREPANCY_DETECTED',
        severity: 'CRITICAL',
        userId: user.id,
        userPhone: user.phone,
        details: `Discrepância detetada no utilizador ${user.phone}: Saldo Atual MT ${current} vs Saldo Calculado MT ${expected} (Divergência: MT ${discrepancy}).`,
      });
    }

    return {
      consistent: isConsistent,
      currentBalance: current,
      expectedBalance: expected,
      discrepancy,
      transactionCount: userTxs.length,
    };
  }
}

