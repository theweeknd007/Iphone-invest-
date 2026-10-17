import React from 'react';
import { Toaster } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { SessionProvider, useSession } from './context/SessionContext';
import { ProductsView } from './views/ProductsView';
import { MyProductsView } from './views/MyProductsView';
import { TeamView } from './views/TeamView';
import { AccountView } from './views/AccountView';
import { CheckInView } from './views/CheckInView';
import { AccountDetailsView } from './views/AccountDetailsView';
import { RechargesView } from './views/RechargesView';
import { WithdrawalsView } from './views/WithdrawalsView';
import { YieldHistoryView } from './views/YieldHistoryView';
import { RechargeView } from './views/RechargeView';
import { WithdrawView } from './views/WithdrawView';
import { WalletView } from './views/WalletView';
import { SupportView } from './views/SupportView';
import { AboutView } from './views/AboutView';
import { RulesView } from './views/RulesView';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { AdminView } from './views/AdminView';

const MainRouter: React.FC = () => {
  const { currentRoute } = useSession();

  const renderView = () => {
    switch (currentRoute) {
      case '/':
        return <ProductsView />;
      case '/meus-produtos':
        return <MyProductsView />;
      case '/equipa':
        return <TeamView />;
      case '/conta':
        return <AccountView />;
      case '/conta/checkin':
        return <CheckInView />;
      case '/conta/detalhes':
        return <AccountDetailsView />;
      case '/conta/recargas':
        return <RechargesView />;
      case '/conta/levantamentos':
        return <WithdrawalsView />;
      case '/conta/rendimentos':
        return <YieldHistoryView />;
      case '/conta/carteira':
        return <WalletView />;
      case '/recarregar':
        return <RechargeView />;
      case '/levantar':
        return <WithdrawView />;
      case '/suporte':
        return <SupportView />;
      case '/sobre':
        return <AboutView />;
      case '/regras':
        return <RulesView />;
      case '/entrar':
        return <LoginView />;
      case '/registo':
        return <RegisterView />;
      case '/admin':
        return <AdminView />;
      default:
        return <ProductsView />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center w-full">
      <div className="w-full flex justify-center flex-1">
        {renderView()}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <SessionProvider>
      <Toaster
        theme="light"
        position="top-center"
        richColors
        toastOptions={{
          style: {
            borderRadius: '1rem',
            border: '1px solid oklch(90.5% 0.007 260)',
            background: '#ffffff',
            color: 'oklch(18% 0.018 260)',
          },
        }}
      />
      <MainRouter />
    </SessionProvider>
  );
}
