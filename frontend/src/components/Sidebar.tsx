import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowLeftRight,
  FileText,
  Receipt,
  LogOut,
  Boxes
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'customers', label: 'Customer CRM', icon: Users, visible: hasRole('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE') },
    { id: 'products', label: 'Products & Stock', icon: Package, visible: true },
    { id: 'stock-movements', label: 'Stock Movement Log', icon: ArrowLeftRight, visible: hasRole('ADMIN', 'WAREHOUSE') },
    { id: 'challans', label: 'Sales Challans', icon: FileText, visible: true },
    { id: 'invoices', label: 'Invoices & Accounts', icon: Receipt, visible: hasRole('ADMIN', 'ACCOUNTS', 'SALES') },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">
          <Boxes size={22} />
        </div>
        <div>
          <div className="logo-text">NexFlow ERP</div>
          <div className="logo-sub">Operations Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {navItems.filter(item => item.visible).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
            >
              <Icon size={18} className="nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name.split(' ')[0]}</span>
            <span className="user-role-badge">{user?.role}</span>
          </div>
        </div>
        <button className="btn btn-secondary btn-icon" onClick={logout} title="Sign Out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
