export interface Transaction {
  id: string;
  userId?: string;
  userPhone?: string;
  type: 'recarga' | 'levantamento' | 'rendimento' | 'bonus' | 'ajuste';
  amount: number;
  method: string;
  reference?: string;
  note?: string;
  status: 'pendente' | 'concluido' | 'falhado';
  createdAt: string;
  idempotencyKey?: string;
}
