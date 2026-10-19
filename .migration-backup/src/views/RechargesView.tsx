import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { TransactionList } from '../components/TransactionList';
import { useSession } from '../context/SessionContext';

export const RechargesView: React.FC = () => {
  const { transactions } = useSession();
  const recharges = transactions.filter((t) => t.type === 'recarga');

  return (
    <AppLayout title="Histórico de recargas" backTo="/conta" hideNav>
      <TransactionList items={recharges} emptyLabel="Sem recargas registadas" />
    </AppLayout>
  );
};
