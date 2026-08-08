import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Eye,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import api from '../services/api';
import { Customer, CustomerType, CustomerStatus } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'WHOLESALE' as CustomerType,
    address: '',
    status: 'ACTIVE' as CustomerStatus,
    followUpDate: '',
    notes: ''
  });

  // Note log state for detail drawer
  const [newNote, setNewNote] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');

  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilter,
          customerType: typeFilter
        }
      });
      if (res.data.success) {
        setCustomers(res.data.data.customers);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotal(res.data.data.pagination.total);
      }
    } catch (err: any) {
      error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter, error]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openAddModal = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      address: '',
      status: 'ACTIVE',
      followUpDate: '',
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      businessName: customer.businessName,
      gstNumber: customer.gstNumber || '',
      customerType: customer.customerType,
      address: customer.address,
      status: customer.status,
      followUpDate: customer.followUpDate ? customer.followUpDate.slice(0, 10) : '',
      notes: customer.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const openDetailModal = async (customer: Customer) => {
    try {
      const res = await api.get(`/customers/${customer.id}`);
      if (res.data.success) {
        setSelectedCustomer(res.data.data);
        setNewNote('');
        setNewFollowUpDate(res.data.data.followUpDate ? res.data.data.followUpDate.slice(0, 10) : '');
        setIsDetailModalOpen(true);
      }
    } catch {
      error('Failed to load customer profile');
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditModalOpen && selectedCustomer) {
        const res = await api.put(`/customers/${selectedCustomer.id}`, formData);
        if (res.data.success) {
          success('Customer profile updated successfully');
          setIsEditModalOpen(false);
          fetchCustomers();
        }
      } else {
        const res = await api.post('/customers', formData);
        if (res.data.success) {
          success('Customer created successfully');
          setIsAddModalOpen(false);
          fetchCustomers();
        }
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Error saving customer');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNote.trim()) return;

    try {
      const res = await api.post(`/customers/${selectedCustomer.id}/notes`, {
        note: newNote,
        followUpDate: newFollowUpDate || null
      });

      if (res.data.success) {
        success('Follow-up note logged!');
        setNewNote('');
        // Refresh customer details
        openDetailModal(selectedCustomer);
        fetchCustomers();
      }
    } catch (err: any) {
      error('Failed to log note');
    }
  };

  return (
    <div className="page-body">
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Customer CRM Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Manage wholesale leads, active accounts, contact profiles, and sales follow-ups
          </p>
        </div>

        {hasRole('ADMIN', 'SALES') && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add New Customer
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
              placeholder="Search by name, business, mobile, email, or GST..."
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
              <option value="ACTIVE">Active</option>
              <option value="LEAD">Lead</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              className="select-input"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Types</option>
              <option value="DISTRIBUTOR">Distributor</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="RETAIL">Retail</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No customers found matching the search criteria.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Business / Name</th>
                    <th>Contact Info</th>
                    <th>Type</th>
                    <th>GSTIN</th>
                    <th>Status</th>
                    <th>Next Follow-up</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.businessName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attn: {c.name}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                          <Phone size={12} color="#64748b" /> {c.mobile}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Mail size={12} color="#64748b" /> {c.email}
                        </div>
                      </td>
                      <td><Badge status={c.customerType} /></td>
                      <td>
                        {c.gstNumber ? (
                          <span className="code-badge">{c.gstNumber}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>N/A</span>
                        )}
                      </td>
                      <td><Badge status={c.status} /></td>
                      <td>
                        {c.followUpDate ? (
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4f46e5' }}>
                            📅 {new Date(c.followUpDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No date</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openDetailModal(c)}
                            title="View Profile & Notes"
                          >
                            <Eye size={14} /> View
                          </button>
                          {hasRole('ADMIN', 'SALES') && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditModal(c)}
                              title="Edit Customer"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
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

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Customer Details' : 'Add New Customer Profile'}
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
            <button className="btn btn-primary" onClick={handleSaveCustomer}>
              {isEditModalOpen ? 'Save Changes' : 'Create Customer'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveCustomer} className="form-grid">
          <div className="form-group">
            <label className="form-label">Contact Person Name *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Rajesh Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Business / Enterprise Name *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Apex Industrial Supplies Pvt Ltd"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. +91 98200 12345"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="e.g. sales@apexsupplies.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Customer Tier / Type *</label>
            <select
              className="form-select"
              value={formData.customerType}
              onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
            >
              <option value="DISTRIBUTOR">Distributor</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="RETAIL">Retail</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">GST Number (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 27AABCA1234F1Z8"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Account Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
            >
              <option value="ACTIVE">Active</option>
              <option value="LEAD">Lead</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Next Scheduled Follow-up</label>
            <input
              type="date"
              className="form-input"
              value={formData.followUpDate}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Delivery Address *</label>
            <textarea
              required
              rows={2}
              className="form-textarea"
              placeholder="Warehouse / Delivery address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Initial Relationship Notes</label>
            <textarea
              rows={2}
              className="form-textarea"
              placeholder="Customer requirements, credit terms, regional context..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Customer Detail & Follow-up Timeline Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Customer Profile: ${selectedCustomer.businessName}`}
          size="lg"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Contact Overview */}
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Account Details</h3>
                <Badge status={selectedCustomer.status} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                <div><strong>Attn:</strong> {selectedCustomer.name}</div>
                <div><strong>Type:</strong> <Badge status={selectedCustomer.customerType} /></div>
                <div><strong>Mobile:</strong> {selectedCustomer.mobile}</div>
                <div><strong>Email:</strong> {selectedCustomer.email}</div>
                {selectedCustomer.gstNumber && <div><strong>GSTIN:</strong> <span className="code-badge">{selectedCustomer.gstNumber}</span></div>}
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Address:</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{selectedCustomer.address}</div>
                </div>
              </div>
            </div>

            {/* Quick Add Note Form */}
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageSquare size={16} color="#4f46e5" /> Log Follow-up Note
              </h3>
              {hasRole('ADMIN', 'SALES') ? (
                <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Enter call notes, quotation details, or meeting summary..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="date"
                      className="form-input"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                      value={newFollowUpDate}
                      onChange={(e) => setNewFollowUpDate(e.target.value)}
                      title="Next Follow-up Date"
                    />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                      Add Note
                    </button>
                  </div>
                </form>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Only Admin and Sales roles can log follow-up notes.
                </p>
              )}
            </div>
          </div>

          {/* Follow-up Notes Timeline */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>CRM Activity & Note History</h3>
            {(!selectedCustomer.followUpLogs || selectedCustomer.followUpLogs.length === 0) ? (
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No past follow-up notes logged yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedCustomer.followUpLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '0.85rem 1.1rem',
                      background: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      borderLeft: '4px solid #4f46e5'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.825rem', color: '#0f172a' }}>
                        {log.createdBy.name} ({log.createdBy.role})
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{log.note}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
