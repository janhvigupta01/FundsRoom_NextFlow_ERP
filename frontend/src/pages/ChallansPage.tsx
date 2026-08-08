import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Eye,
  FileDown,
  CheckCircle2,
  XCircle,
  Receipt,
  Trash2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { SalesChallan, Customer, Product } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface LineItemForm {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export const ChallansPage: React.FC<{ setCurrentTab?: (tab: string) => void }> = ({ setCurrentTab }) => {
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Reference data for creation modal
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<SalesChallan | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [challanStatus, setChallanStatus] = useState<'DRAFT' | 'CONFIRMED'>('CONFIRMED');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItemForm[]>([
    { productId: '', quantity: 1, unitPrice: 0 }
  ]);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const fetchChallans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/challans', {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilter
        }
      });
      if (res.data.success) {
        setChallans(res.data.data.challans);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotal(res.data.data.pagination.total);
      }
    } catch {
      error('Failed to load sales challans');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, error]);

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  const loadReferenceData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers', { params: { limit: 100 } }),
        api.get('/products', { params: { limit: 100 } })
      ]);
      if (custRes.data.success) setCustomers(custRes.data.data.customers);
      if (prodRes.data.success) setProducts(prodRes.data.data.products);
    } catch {
      console.error('Failed to load reference data');
    }
  };

  const openCreateModal = async () => {
    await loadReferenceData();
    setCustomerId('');
    setChallanStatus('CONFIRMED');
    setNotes('');
    setItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
    setFormErrors([]);
    setIsCreateModalOpen(true);
  };

  const openDetailModal = async (challan: SalesChallan) => {
    try {
      const res = await api.get(`/challans/${challan.id}`);
      if (res.data.success) {
        setSelectedChallan(res.data.data);
        setIsDetailModalOpen(true);
      }
    } catch {
      error('Failed to load challan details');
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const newItems = [...items];
    newItems[index].productId = productId;
    newItems[index].unitPrice = prod ? prod.unitPrice : 0;
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  const handlePriceChange = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index].unitPrice = price;
    setItems(newItems);
  };

  const addLineItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    if (!customerId) {
      error('Please select a customer');
      return;
    }

    const invalidItems = items.some((i) => !i.productId || i.quantity <= 0);
    if (invalidItems) {
      error('Please select valid products and positive quantities for all line items.');
      return;
    }

    try {
      const res = await api.post('/challans', {
        customerId,
        status: challanStatus,
        notes,
        items
      });

      if (res.data.success) {
        success(res.data.message);
        setIsCreateModalOpen(false);
        fetchChallans();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error creating challan';
      const itemErrors = err.response?.data?.errors || [];
      setFormErrors(itemErrors);
      error(errorMsg);
    }
  };

  const handleConfirmChallan = async (id: string) => {
    if (!window.confirm('Are you sure you want to CONFIRM this challan? Stock will be atomically reduced in the warehouse inventory.')) {
      return;
    }

    try {
      const res = await api.post(`/challans/${id}/confirm`);
      if (res.data.success) {
        success(res.data.message);
        setIsDetailModalOpen(false);
        fetchChallans();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to confirm challan');
    }
  };

  const handleCancelChallan = async (id: string) => {
    if (!window.confirm('Are you sure you want to CANCEL this challan? If it was confirmed, items will be restocked.')) {
      return;
    }

    try {
      const res = await api.post(`/challans/${id}/cancel`);
      if (res.data.success) {
        success(res.data.message);
        setIsDetailModalOpen(false);
        fetchChallans();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to cancel challan');
    }
  };

  const handleDownloadPDF = async (id: string, challanNumber: string) => {
    try {
      const response = await api.get(`/challans/${id}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${challanNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      success(`Downloaded official dispatch PDF for ${challanNumber}`);
    } catch {
      error('Failed to download PDF');
    }
  };

  const handleGenerateInvoice = async (challan: SalesChallan) => {
    try {
      const res = await api.post('/invoices', {
        challanId: challan.id,
        taxPercent: 18
      });

      if (res.data.success) {
        success(`Invoice ${res.data.data.invoiceNumber} generated!`);
        setIsDetailModalOpen(false);
        if (setCurrentTab) setCurrentTab('invoices');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to generate invoice');
    }
  };

  const totalCalculatedQuantity = items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const totalCalculatedValuation = items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);

  return (
    <div className="page-body">
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sales Delivery Challans</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Generate delivery vouchers, enforce live warehouse stock validation, and track dispatch orders
          </p>
        </div>

        {hasRole('ADMIN', 'SALES') && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Create Delivery Challan
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by challan number, customer business, or sales rep..."
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
              <option value="CONFIRMED">Confirmed</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Challans Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading sales challans...
            </div>
          ) : challans.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No delivery challans found.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Challan No</th>
                    <th>Customer / Consignee</th>
                    <th>Items Count</th>
                    <th>Order Valuation</th>
                    <th>Status</th>
                    <th>Prepared By</th>
                    <th>Created Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.map((ch) => (
                    <tr key={ch.id}>
                      <td><span className="code-badge">{ch.challanNumber}</span></td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ch.customer?.businessName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ch.customer?.name} ({ch.customer?.mobile})</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{ch.totalQuantity} units</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {ch.items?.length || 0} product line(s)
                        </div>
                      </td>
                      <td className="currency" style={{ fontWeight: 700 }}>
                        ${ch.totalAmount.toFixed(2)}
                      </td>
                      <td><Badge status={ch.status} /></td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{ch.createdBy?.name}</div>
                        <div style={{ fontSize: '0.725rem', color: '#818cf8', textTransform: 'uppercase' }}>{ch.createdBy?.role}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(ch.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openDetailModal(ch)}
                            title="View Voucher Details"
                          >
                            <Eye size={14} /> Details
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDownloadPDF(ch.id, ch.challanNumber)}
                            title="Download PDF"
                          >
                            <FileDown size={14} /> PDF
                          </button>
                        </div>
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

      {/* Create Delivery Challan Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Sales Delivery Challan"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateChallan}>
              Generate Challan ({challanStatus})
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateChallan} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {formErrors.length > 0 && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '1rem',
              color: '#b91c1c',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <AlertCircle size={16} /> Inventory Stock Issues Detected:
              </div>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {formErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Select Customer / Business *</label>
              <select
                required
                className="form-select"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">-- Choose Consignee --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} ({c.name} - {c.customerType})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial State *</label>
              <select
                className="form-select"
                value={challanStatus}
                onChange={(e) => setChallanStatus(e.target.value as 'DRAFT' | 'CONFIRMED')}
              >
                <option value="CONFIRMED">CONFIRMED (Atomically Deducts Stock)</option>
                <option value="DRAFT">DRAFT (Quotation / Reserve)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Line Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Product Line Items *</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLineItem}>
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((item, index) => {
                const prod = products.find((p) => p.id === item.productId);
                const isStockInsufficient = prod && prod.currentStock < item.quantity && challanStatus === 'CONFIRMED';

                return (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 1.2fr 1.2fr 1.2fr auto',
                      gap: '0.75rem',
                      alignItems: 'center',
                      background: isStockInsufficient ? '#fef2f2' : '#f8fafc',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: isStockInsufficient ? '1px solid #fecaca' : '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <select
                        required
                        className="form-select"
                        style={{ fontSize: '0.825rem' }}
                        value={item.productId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                      >
                        <option value="">-- Choose Product SKU --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) • Stock: {p.currentStock}
                          </option>
                        ))}
                      </select>
                      {prod && (
                        <div style={{ fontSize: '0.725rem', color: prod.currentStock < item.quantity ? '#dc2626' : '#059669', marginTop: '0.2rem', fontWeight: 600 }}>
                          Avail: {prod.currentStock} units | Loc: {prod.location}
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        type="number"
                        min="1"
                        required
                        className="form-input"
                        style={{ fontSize: '0.85rem' }}
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="form-input"
                        style={{ fontSize: '0.85rem' }}
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'right' }} className="currency">
                      ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      style={{ padding: '0.4rem' }}
                      onClick={() => removeLineItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 size={15} color="#ef4444" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Total Summary Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f1f5f9',
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              marginTop: '1rem'
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Total Items: <strong>{totalCalculatedQuantity} units</strong>
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4f46e5' }} className="currency">
                Valuation: ${totalCalculatedValuation.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dispatch Notes & Logistics Instructions</label>
            <textarea
              rows={2}
              className="form-textarea"
              placeholder="e.g. Priority dispatch via Bluedart Express, gate pass required..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Challan Detail & PDF Drawer Modal */}
      {selectedChallan && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Delivery Challan: ${selectedChallan.challanNumber}`}
          size="lg"
        >
          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Consignee Info</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.2rem' }}>{selectedChallan.customer?.businessName}</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Attn: {selectedChallan.customer?.name} ({selectedChallan.customer?.mobile})</div>
              {selectedChallan.customer?.gstNumber && <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>GSTIN: <span className="code-badge">{selectedChallan.customer?.gstNumber}</span></div>}
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Order Status & Prep</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <Badge status={selectedChallan.status} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  By: {selectedChallan.createdBy?.name}
                </span>
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Created: {new Date(selectedChallan.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Product Snapshot Items Table */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Itemized Product Manifest (Snapshot Data)</div>
            <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>SKU Code</th>
                    <th>Dispatched Qty</th>
                    <th>Unit Rate</th>
                    <th style={{ textAlign: 'right' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedChallan.items.map((item, idx) => {
                    let snap: any = {};
                    try {
                      snap = item.productSnapshot ? JSON.parse(item.productSnapshot) : {};
                    } catch {
                      snap = { name: 'Item', sku: 'N/A' };
                    }

                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{snap.name || item.product?.name}</td>
                        <td><span className="code-badge">{snap.sku || item.product?.sku}</span></td>
                        <td><strong>{item.quantity}</strong> units</td>
                        <td className="currency">${item.unitPrice.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }} className="currency">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Valuation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f1f5f9',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem'
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Quantities:</span>
              <strong style={{ marginLeft: '0.35rem' }}>{selectedChallan.totalQuantity} items</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Grand Total Valuation:</span>
              <strong style={{ fontSize: '1.25rem', color: '#4f46e5', marginLeft: '0.5rem' }} className="currency">
                ${selectedChallan.totalAmount.toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => handleDownloadPDF(selectedChallan.id, selectedChallan.challanNumber)}
            >
              <FileDown size={16} /> Download Official PDF Voucher
            </button>

            {selectedChallan.status === 'DRAFT' && hasRole('ADMIN', 'SALES', 'WAREHOUSE') && (
              <button
                className="btn btn-success"
                onClick={() => handleConfirmChallan(selectedChallan.id)}
              >
                <CheckCircle2 size={16} /> Confirm & Deduct Warehouse Stock
              </button>
            )}

            {selectedChallan.status === 'CONFIRMED' && hasRole('ADMIN', 'ACCOUNTS') && (
              <button
                className="btn btn-primary"
                onClick={() => handleGenerateInvoice(selectedChallan)}
              >
                <Receipt size={16} /> Generate Invoice (Accounts)
              </button>
            )}

            {selectedChallan.status !== 'CANCELLED' && hasRole('ADMIN', 'SALES') && (
              <button
                className="btn btn-danger"
                onClick={() => handleCancelChallan(selectedChallan.id)}
              >
                <XCircle size={16} /> Cancel Challan
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
