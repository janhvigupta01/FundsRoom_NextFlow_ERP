import React from 'react';
import { ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({ title, subtitle, actions }) => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div>
        <h1 className="nav-page-title">{title}</h1>
        {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>

      <div className="nav-actions">
        {actions}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.775rem' }}>
          <ShieldCheck size={16} color="#4f46e5" />
          <span style={{ fontWeight: 600, color: '#334155' }}>
            Logged in as <strong style={{ color: '#4f46e5' }}>{user?.role}</strong> ({user?.name})
          </span>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#dc2626', borderColor: '#fecaca', background: '#fff5f5', fontSize: '0.8rem', fontWeight: 600 }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </header>
  );
};
