import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { StockMovementsPage } from './pages/StockMovementsPage';
import { ChallansPage } from './pages/ChallansPage';
import { InvoicesPage } from './pages/InvoicesPage';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        fontFamily: 'var(--font-main)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            NexFlow ERP
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Initializing operations session...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const getPageInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return { title: 'Operational Overview', subtitle: 'Real-time performance metrics & low stock alerts' };
      case 'customers':
        return { title: 'Customer CRM Directory', subtitle: 'Relationship tracking, credit terms, and follow-up notes' };
      case 'products':
        return { title: 'Product & Stock Management', subtitle: 'Catalog, stock thresholds, and location mapping' };
      case 'stock-movements':
        return { title: 'Stock Movement Audit Trail', subtitle: 'Immutable transaction ledger for all warehouse adjustments' };
      case 'challans':
        return { title: 'Sales Delivery Challans', subtitle: 'Order dispatching with real-time stock allocation' };
      case 'invoices':
        return { title: 'Accounts & GST Invoicing', subtitle: 'Billing, tax computation, and payment settlements' };
      default:
        return { title: 'Operations Portal', subtitle: '' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="app-container">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="main-content">
        <Navbar title={pageInfo.title} subtitle={pageInfo.subtitle} />

        {currentTab === 'dashboard' && <DashboardPage setCurrentTab={setCurrentTab} />}
        {currentTab === 'customers' && <CustomersPage />}
        {currentTab === 'products' && <ProductsPage setCurrentTab={setCurrentTab} />}
        {currentTab === 'stock-movements' && <StockMovementsPage />}
        {currentTab === 'challans' && <ChallansPage setCurrentTab={setCurrentTab} />}
        {currentTab === 'invoices' && <InvoicesPage />}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
