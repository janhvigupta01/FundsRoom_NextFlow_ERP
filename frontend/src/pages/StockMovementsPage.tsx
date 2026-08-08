import React, { useState, useEffect, useCallback } from 'react';
import { Search, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import api from '../services/api';
import { StockMovement } from '../types';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { useToast } from '../context/ToastContext';

export const StockMovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const { error } = useToast();

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/movements/log', {
        params: {
          page,
          limit: 15,
          search,
          movementType: typeFilter
        }
      });
      if (res.data.success) {
        setMovements(res.data.data.movements);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotal(res.data.data.pagination.total);
      }
    } catch {
      error('Failed to load stock movement log');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, error]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return (
    <div className="page-body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Stock Movement Audit Ledger</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Immutable chronological record of all stock additions (IN), sales dispatches (OUT), and warehouse adjustments
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
              placeholder="Search by product name, SKU, reason, or operator..."
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
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Movement Types</option>
              <option value="IN">IN (Stock Added)</option>
              <option value="OUT">OUT (Stock Deducted)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading audit log entries...
            </div>
          ) : movements.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No stock movements found matching your filters.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Product & SKU</th>
                    <th>Direction</th>
                    <th>Quantity Change</th>
                    <th>Reason / Reference</th>
                    <th>Warehouse Location</th>
                    <th>Authorized By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const isIN = m.movementType === 'IN';

                    return (
                      <tr key={m.id}>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {new Date(m.createdAt).toLocaleDateString()}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {new Date(m.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {m.product?.name || 'Deleted Product'}
                          </div>
                          <span className="code-badge">{m.product?.sku}</span>
                        </td>
                        <td>
                          <Badge status={m.movementType} />
                        </td>
                        <td>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            color: isIN ? '#059669' : '#dc2626'
                          }}>
                            {isIN ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                            {isIN ? `+${m.quantity}` : `-${m.quantity}`} units
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {m.reason}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {m.product?.location || 'N/A'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>
                            {m.createdBy?.name || 'System'}
                          </div>
                          <div style={{ fontSize: '0.725rem', color: '#818cf8', textTransform: 'uppercase' }}>
                            {m.createdBy?.role}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
        limit={15}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};
