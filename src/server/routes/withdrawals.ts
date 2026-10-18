import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

// This route assumes the project exposes a `db` object on `req.app.locals.db` or passes a db instance
// when mounting. It is written to be DB-agnostic: replace query methods with the project's db helpers.

const router = Router();

// POST /withdrawals
// body: { amount, method, destination }
router.post('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = req.user; // assume authentication middleware set req.user with id and phone
    const { amount, method, destination } = req.body;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: 'amount_invalido' });
    }

    // reload user from DB to get latest profitBalance
    const dbUser = await db('users').where({ id: user.id }).first();
    if (!dbUser) return res.status(404).json({ error: 'user_not_found' });

    // Only profitBalance is withdrawable per new rule
    const profitBalance = Number(dbUser.profit_balance || dbUser.profitBalance || 0);

    if (numericAmount > profitBalance) {
      return res.status(400).json({ error: 'saldo_profit_insuficiente' });
    }

    // Ensure there is no existing pending withdrawal for this user (idempotency / anti-dup)
    const existing = await db('withdrawal_requests')
      .where({ user_id: user.id, status: 'pendente' })
      .first();
    if (existing) {
      return res.status(409).json({ error: 'withdrawal_already_pending' });
    }

    const id = uuidv4();

    // perform in transaction: insert withdrawal_request, decrement profit_balance, create transaction log
    await db.transaction(async (trx) => {
      await trx('withdrawal_requests').insert({
        id,
        user_id: user.id,
        user_phone: dbUser.phone || user.phone,
        amount: numericAmount,
        status: 'pendente',
        method,
        destination,
        source: 'profit',
        created_at: new Date(),
      });

      // decrement profit_balance
      const newProfit = profitBalance - numericAmount;
      await trx('users').where({ id: user.id }).update({ profit_balance: newProfit });

      // insert transaction record
      await trx('transactions').insert({
        id: uuidv4(),
        user_id: user.id,
        user_phone: dbUser.phone || user.phone,
        type: 'levantamento',
        amount: numericAmount,
        method: method || 'unknown',
        status: 'pendente',
        source: 'profit',
        created_at: new Date(),
      });

      // add adjustment log
      await trx('balance_adjustment_logs').insert({
        id: uuidv4(),
        target_user_id: user.id,
        target_user_phone: dbUser.phone || user.phone,
        previous_balance: profitBalance,
        new_balance: newProfit,
        amount: numericAmount,
        type: 'debito',
        reason: 'withdrawal_request_profit',
        admin_id: 'system',
        admin_name: 'system',
        created_at: new Date(),
      });
    });

    return res.status(201).json({ id, status: 'pendente' });
  } catch (err) {
    console.error('withdrawal error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
