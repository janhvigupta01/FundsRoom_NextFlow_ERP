import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Boxes,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import api from '../services/api';
import { Product, MovementType } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ProductsPage: React.FC<{ setCurrentTab?: (tab: string) => void }> = ({ setCurrentTab }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Product Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 10,
    location: ''
  });

  // Stock Adjustment Form State
  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 1,
    movementType: 'IN' as MovementType,
    reason: ''
  });

  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: {
          page,
          limit: 10,
          search,
          category: categoryFilter,
          lowStock: lowStockFilter ? 'true' : 'false'
        }
      });
      if (res.data.success) {
        setProducts(res.data.data.products);
        setCategories(res.data.data.categories);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotal(res.data.data.pagination.total);
      }
    } catch (err) {
      error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, lowStockFilter, error]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAddModal = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minStockAlert: 10,
      location: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: product.unitPrice,
      currentStock: product.currentStock,
      minStockAlert: product.minStockAlert,
      location: product.location
    });
    setIsEditModalOpen(true);
  };

  const openStockModal = (product: Product) => {
    setSelectedProduct(product);
    setStockAdjustment({
      quantity: 5,
      movementType: 'IN',
      reason: 'Purchase Receipt Batch Delivery'
    });
    setIsStockModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditModalOpen && selectedProduct) {
        const res = await api.put(`/products/${selectedProduct.id}`, {
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          unitPrice: Number(formData.unitPrice),
          minStockAlert: Number(formData.minStockAlert),
          location: formData.location
        });
        if (res.data.success) {
          success('Product updated successfully');
          setIsEditModalOpen(false);
          fetchProducts();
        }
      } else {
        const res = await api.post('/products', {
          ...formData,
          unitPrice: Number(formData.unitPrice),
          currentStock: Number(formData.currentStock),
          minStockAlert: Number(formData.minStockAlert)
        });
        if (res.data.success) {
          success('Product created with initial opening stock');
          setIsAddModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (stockAdjustment.movementType === 'OUT' && selectedProduct.currentStock < stockAdjustment.quantity) {
      error(`Cannot adjust OUT: Only ${selectedProduct.currentStock} units available.`);
      return;
    }

    try {
      const res = await api.post(`/products/${selectedProduct.id}/stock`, {
        quantity: Number(stockAdjustment.quantity),
        movementType: stockAdjustment.movementType,
        reason: stockAdjustment.reason
      });

      if (res.data.success) {
        success(res.data.message);
        setIsStockModalOpen(false);
        fetchProducts();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  return (
    <div className="page-body">
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Products & Inventory Catalog</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Real-time multi-warehouse stock levels, SKU tracking, unit valuations, and restock alerts
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {setCurrentTab && hasRole('ADMIN', 'WAREHOUSE') && (
            <button className="btn btn-secondary" onClick={() => setCurrentTab('stock-movements')}>
              <ArrowUpDown size={16} /> Movement Log
            </button>
          )}
          {hasRole('ADMIN', 'WAREHOUSE') && (
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={16} /> Add New SKU
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by product name, SKU, category, or location..."
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
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button
              className={`btn btn-sm ${lowStockFilter ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => {
                setLowStockFilter(!lowStockFilter);
                setPage(1);
              }}
            >
              <AlertTriangle size={14} /> Low Stock Only
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading inventory catalog...
            </div>
          ) : products.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No products found matching the criteria.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product & SKU</th>
                    <th>Category</th>
                    <th>Unit Price</th>
                    <th>Current Stock</th>
                    <th>Stock Status</th>
                    <th>Warehouse Location</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isLow = p.currentStock <= p.minStockAlert && p.currentStock > 0;
                    const isOut = p.currentStock === 0;

                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                          <span className="code-badge">{p.sku}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 600, color: '#475569' }}>
                            {p.category}
                          </span>
                        </td>
                        <td className="currency" style={{ fontWeight: 700 }}>
                          ${p.unitPrice.toFixed(2)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                            <span style={{
                              fontSize: '1.05rem',
                              fontWeight: 800,
                              color: isOut ? '#dc2626' : isLow ? '#d97706' : '#059669'
                            }}>
                              {p.currentStock}
                            </span>
                            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                              / min {p.minStockAlert}
                            </span>
                          </div>
                        </td>
                        <td>
                          {isOut ? (
                            <span className="badge badge-danger">Out of Stock</span>
                          ) : isLow ? (
                            <span className="badge badge-warning">Low Stock</span>
                          ) : (
                            <span className="badge badge-success">Optimal</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          📍 {p.location}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            {hasRole('ADMIN', 'WAREHOUSE') && (
                              <>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => openStockModal(p)}
                                  title="Adjust Stock (IN / OUT)"
                                >
                                  <Boxes size={14} /> Adjust Stock
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => openEditModal(p)}
                                  title="Edit Product"
                                >
                                  <Edit2 size={14} />
                                </button>
                              </>
                            )}
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
        limit={10}
        onPageChange={(p) => setPage(p)}
      />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? `Edit SKU: ${selectedProduct?.sku}` : 'Register New Product SKU'}
        size="lg"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveProduct}>
              {isEditModalOpen ? 'Save Changes' : 'Register Product'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveProduct} className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Heavy Duty Drill Machine 850W"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">SKU / Product Code *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. PWR-DRL-850"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Power Tools, Fasteners, Safety PPE"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unit Selling Price ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              min="0.01"
              className="form-input"
              placeholder="0.00"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>

          {!isEditModalOpen && (
            <div className="form-group">
              <label className="form-label">Initial Opening Stock *</label>
              <input
                type="number"
                required
                min="0"
                className="form-input"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
              />
              <span className="form-hint">Will log initial IN movement automatically</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Minimum Stock Alert Threshold *</label>
            <input
              type="number"
              required
              min="1"
              className="form-input"
              value={formData.minStockAlert}
              onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Warehouse Physical Location *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Warehouse A - Bay 04, Rack 2"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal (IN / OUT) */}
      {selectedProduct && (
        <Modal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          title={`Adjust Inventory: ${selectedProduct.name}`}
          size="md"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setIsStockModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAdjustStock}>
                Confirm Stock Adjustment
              </button>
            </>
          }
        >
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>SKU: <strong className="code-badge">{selectedProduct.sku}</strong></span>
              <span>Current Stock: <strong style={{ color: '#059669', fontSize: '1rem' }}>{selectedProduct.currentStock} units</strong></span>
            </div>
          </div>

          <form onSubmit={handleAdjustStock} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Movement Direction *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  className={`btn ${stockAdjustment.movementType === 'IN' ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setStockAdjustment({ ...stockAdjustment, movementType: 'IN' })}
                >
                  📥 Stock IN (Received)
                </button>
                <button
                  type="button"
                  className={`btn ${stockAdjustment.movementType === 'OUT' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => setStockAdjustment({ ...stockAdjustment, movementType: 'OUT' })}
                >
                  📤 Stock OUT (Adjustment)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity to Change *</label>
              <input
                type="number"
                min="1"
                required
                className="form-input"
                value={stockAdjustment.quantity}
                onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: parseInt(e.target.value) || 1 })}
              />
              <span className="form-hint">
                Calculated New Balance:{' '}
                <strong>
                  {stockAdjustment.movementType === 'IN'
                    ? selectedProduct.currentStock + (stockAdjustment.quantity || 0)
                    : selectedProduct.currentStock - (stockAdjustment.quantity || 0)}{' '}
                  units
                </strong>
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Reason / Reference *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Purchase Order Batch #109, Damaged goods return..."
                value={stockAdjustment.reason}
                onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
