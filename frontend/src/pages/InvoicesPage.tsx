import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { Invoice } from '../types';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices', {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilter
        }
      });
      if (res.data.success) {
        setInvoices(res.data.data.invoices);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotal(res.data.data.pagination.total);
      }
    } catch {
      error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, error]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await api.put(`/invoices/${id}/status`, { status });
      if (res.data.success) {
        success(`Invoice marked as ${status}`);
        fetchInvoices();
      }
    } catch (err: any) {
      error('Failed to update invoice status');
    }
  };

  return (
    <div className="page-body">
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Invoices & Accounts Billing</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            GST Invoicing generated from confirmed delivery challans, payment settlement, and ledger tracking
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by invoice number, customer business, or challan ref..."
              className="search-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-group">
            <select
              className="select-input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Payment</option>
              <option value="PAID">Paid / Settled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading accounts invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No invoices found. Generate an invoice from a Confirmed Sales Challan.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Customer / Business</th>
                    <th>Challan Ref</th>
                    <th>Subtotal</th>
                    <th>GST (18%)</th>
                    <th>Grand Total</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td><span className="code-badge">{inv.invoiceNumber}</span></td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.customer?.businessName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.customer?.name}</div>
                      </td>
                      <td>
                        <span className="code-badge" style={{ background: '#eef2ff', color: '#4338ca' }}>
                          {inv.challan?.challanNumber}
                        </span>
                      </td>
                      <td className="currency">${inv.subTotal.toFixed(2)}</td>
                      <td className="currency" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        +${inv.taxAmount.toFixed(2)}
                      </td>
                      <td className="currency" style={{ fontWeight: 800, color: '#0f172a' }}>
                        ${inv.grandTotal.toFixed(2)}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Net 15'}
                      </td>
                      <td><Badge status={inv.status} /></td>
                      <td style={{ textAlign: 'right' }}>
                        {hasRole('ADMIN', 'ACCOUNTS') && inv.status === 'PENDING' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleUpdateStatus(inv.id, 'PAID')}
                          >
                            <CheckCircle2 size={14} /> Mark as Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={10}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};
