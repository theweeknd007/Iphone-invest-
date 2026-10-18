-- Migration: add profit_balance column to users and create withdrawal_requests table

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profit_balance numeric DEFAULT 0;

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id varchar PRIMARY KEY,
  user_id varchar NOT NULL,
  user_phone varchar,
  amount numeric NOT NULL,
  status varchar NOT NULL DEFAULT 'pendente',
  method varchar,
  destination varchar,
  source varchar NOT NULL DEFAULT 'profit',
  admin_note text,
  created_at timestamp WITH TIME ZONE DEFAULT now(),
  processed_at timestamp WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
