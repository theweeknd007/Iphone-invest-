import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { TransactionList } from '../components/TransactionList';
import { useSession } from '../context/SessionContext';

export const WithdrawalsView: React.FC = () => {
  const { transactions } = useSession();
  const withdrawals = transactions.filter((t) => t.type === 'levantamento');

  return (
    <AppLayout title="Histórico de levantamentos" backTo="/conta" hideNav>
      <TransactionList items={withdrawals} emptyLabel="Sem levantamentos registados" />
    </AppLayout>
  );
};
