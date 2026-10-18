import request from 'supertest';
import app from '../src/app'; // adjust import to your app

describe('Withdrawals', () => {
  it('should reject if amount > profitBalance', async () => {
    // needs test DB setup: create user with profit_balance = 10
    const token = 'test-token-for-user';
    const res = await request(app)
      .post('/withdrawals')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1000, method: 'M-Pesa', destination: '2547xxxx' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('saldo_profit_insuficiente');
  });
});
