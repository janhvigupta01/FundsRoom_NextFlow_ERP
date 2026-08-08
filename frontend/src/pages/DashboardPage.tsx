import React, { useEffect, useState } from 'react';
import {
  Users,
  Package,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  ArrowUpRight,
  Boxes,
  PlusCircle,
  Truck
} from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

interface DashboardStats {
  kpis: {
    totalCustomers: number;
    leadCustomers: number;
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalChallans: number;
    confirmedChallans: number;
    draftChallans: number;
    totalSalesValuation: number;
  };
  lowStockAlerts: Array<{
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStockAlert: number;
    location: string;
  }>;
  pendingFollowUps: Array<{
    id: string;
    name: string;
    businessName: string;
    mobile: string;
    followUpDate: string;
    status: string;
  }>;
  recentChallans: Array<{
    id: string;
    challanNumber: string;
    totalQuantity: number;
    totalAmount: number;
    status: string;
    createdAt: string;
    customer: { name: string; businessName: string };
    createdBy: { name: string };
  }>;
  recentStockMovements: Array<{
    id: string;
    quantity: number;
    movementType: string;
    reason: string;
    createdAt: string;
    product: { name: string; sku: string };
    createdBy: { name: string; role: string };
  }>;
}

export const DashboardPage: React.FC<{ setCurrentTab: (tab: string) => void }> = ({ setCurrentTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, hasRole } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading enterprise dashboard metrics...
      </div>
    );
  }

  const kpis = stats?.kpis;

  return (
    <div className="page-body">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        color: 'white',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Welcome, {user?.name}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Operational Role: <strong style={{ color: '#818cf8' }}>{user?.role}</strong> • Real-time warehouse & distribution status
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {hasRole('ADMIN', 'SALES') && (
            <button className="btn btn-primary btn-sm" onClick={() => setCurrentTab('challans')}>
              <PlusCircle size={15} /> Create Sales Challan
            </button>
          )}
          {hasRole('ADMIN', 'WAREHOUSE') && (
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('products')}>
              <Boxes size={15} /> Stock Adjustment
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-label">Total Customers</div>
            <div className="stat-val">{kpis?.totalCustomers || 0}</div>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
              {kpis?.leadCustomers} active leads
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <Package size={24} />
          </div>
          <div>
            <div className="stat-label">Product SKUs</div>
            <div className="stat-val">{kpis?.totalProducts || 0}</div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Catalog items</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-label">Low Stock Alerts</div>
            <div className="stat-val" style={{ color: (kpis?.lowStockCount || 0) > 0 ? '#dc2626' : 'inherit' }}>
              {kpis?.lowStockCount || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
              {kpis?.outOfStockCount} out of stock
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#f0f9ff', color: '#0ea5e9' }}>
            <Truck size={24} />
          </div>
          <div>
            <div className="stat-label">Sales Challans</div>
            <div className="stat-val">{kpis?.totalChallans || 0}</div>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
              {kpis?.confirmedChallans} dispatched
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#faf5ff', color: '#9333ea' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-label">Dispatched Revenue</div>
            <div className="stat-val currency">${(kpis?.totalSalesValuation || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span style={{ fontSize: '0.75rem', color: '#9333ea', fontWeight: 600 }}>Confirmed orders</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Low Stock Alert Box */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <AlertTriangle size={18} color="#f59e0b" />
              Warehouse Critical / Low Stock
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('products')}>
              View All <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {(!stats?.lowStockAlerts || stats.lowStockAlerts.length === 0) ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                All inventory items are well above minimum thresholds.
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Stock</th>
                      <th>Min Alert</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lowStockAlerts.map((prod) => (
                      <tr key={prod.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prod.name}</td>
                        <td><span className="code-badge">{prod.sku}</span></td>
                        <td>
                          <span style={{
                            fontWeight: 700,
                            color: prod.currentStock === 0 ? '#ef4444' : '#f59e0b'
                          }}>
                            {prod.currentStock} units
                          </span>
                        </td>
                        <td>{prod.minStockAlert}</td>
                        <td style={{ fontSize: '0.775rem' }}>{prod.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* CRM Follow-up Timeline */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Calendar size={18} color="#4f46e5" />
              Upcoming CRM Follow-ups
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('customers')}>
              Open CRM <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="card-body">
            {(!stats?.pendingFollowUps || stats.pendingFollowUps.length === 0) ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No pending follow-ups scheduled for today.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats.pendingFollowUps.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.businessName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Contact: {c.name} ({c.mobile})
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Badge status={c.status} />
                      <div style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600, marginTop: '0.25rem' }}>
                        📅 {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : 'Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Challans Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <FileText size={18} color="#0ea5e9" />
            Recent Sales Challans & Dispatches
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('challans')}>
            View All Challans <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {(!stats?.recentChallans || stats.recentChallans.length === 0) ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No recent sales challans recorded.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Challan No</th>
                    <th>Customer / Business</th>
                    <th>Qty</th>
                    <th>Valuation</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentChallans.map((ch) => (
                    <tr key={ch.id}>
                      <td><span className="code-badge">{ch.challanNumber}</span></td>
                      <td style={{ fontWeight: 600 }}>{ch.customer.businessName}</td>
                      <td>{ch.totalQuantity} items</td>
                      <td className="currency">${ch.totalAmount.toFixed(2)}</td>
                      <td><Badge status={ch.status} /></td>
                      <td>{ch.createdBy.name}</td>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(ch.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
