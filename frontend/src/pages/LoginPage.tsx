import React, { useState } from 'react';
import { Boxes, ArrowRight, CheckCircle2, User, Key, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@erp.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPass
      });

      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        success(`Welcome back, ${res.data.data.user.name}! (${res.data.data.user.role} mode)`);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
    handleLogin(undefined, roleEmail, 'password123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top left, #1e1b4b, #0f172a)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Glow Elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'rgba(99, 102, 241, 0.15)',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'rgba(16, 185, 129, 0.1)',
        filter: 'blur(90px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '1050px',
        background: 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        overflow: 'hidden',
        zIndex: 10
      }}>
        {/* Left Side: Brand & Feature Showcase */}
        <div style={{
          padding: '3rem',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(15, 23, 42, 0.8))',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 8px 16px rgba(79, 70, 229, 0.4)'
              }}>
                <Boxes size={26} />
              </div>
              <div>
                <h1 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>NexFlow ERP</h1>
                <p style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Wholesale Operations Portal</p>
              </div>
            </div>

            <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '1rem' }}>
              Enterprise Grade Operations & Logistics Engine
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Seamlessly unify Customer CRM, Multi-Warehouse Inventory, Sales Challan Dispatches, and Accounting with atomic stock synchronization.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                'Strict Non-Negative Inventory with Transactional Locks',
                'Role-Based Access Control (Admin, Sales, Warehouse, Accounts)',
                'Immutable Stock Movement Audit Logs',
                'Instant Sales Challan & PDF Voucher Generation'
              ].map((text, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#e2e8f0', fontSize: '0.85rem' }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', color: '#64748b', fontSize: '0.775rem' }}>
            NexFlow Portal v1.0.0 • Full-Stack Case Study Architecture
          </div>
        </div>

        {/* Right Side: Login Form & Quick Role Switcher */}
        <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ color: 'white', fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>Sign In to Portal</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Select a demo profile or enter your credentials.</p>
          </div>

          {/* 1-Click Role Switcher */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '1rem',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '1.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#818cf8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              <Sparkles size={14} /> 1-Click Evaluation Switcher
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => quickLogin('admin@erp.com')}
                style={{
                  padding: '0.6rem 0.75rem',
                  background: email === 'admin@erp.com' ? '#4f46e5' : 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                👑 <strong>Admin</strong>
                <div style={{ fontSize: '0.675rem', color: '#cbd5e1' }}>Full Superuser</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('sales@erp.com')}
                style={{
                  padding: '0.6rem 0.75rem',
                  background: email === 'sales@erp.com' ? '#4f46e5' : 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                💼 <strong>Sales</strong>
                <div style={{ fontSize: '0.675rem', color: '#cbd5e1' }}>CRM & Challans</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('warehouse@erp.com')}
                style={{
                  padding: '0.6rem 0.75rem',
                  background: email === 'warehouse@erp.com' ? '#4f46e5' : 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                📦 <strong>Warehouse</strong>
                <div style={{ fontSize: '0.675rem', color: '#cbd5e1' }}>Inventory & Stock</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('accounts@erp.com')}
                style={{
                  padding: '0.6rem 0.75rem',
                  background: email === 'accounts@erp.com' ? '#4f46e5' : 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                🧾 <strong>Accounts</strong>
                <div style={{ fontSize: '0.675rem', color: '#cbd5e1' }}>Invoicing & Tax</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            >
              {isLoading ? 'Authenticating...' : (
                <>Sign In to Dashboard <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
