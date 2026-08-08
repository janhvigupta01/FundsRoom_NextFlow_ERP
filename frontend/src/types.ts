export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface CustomerNote {
  id: string;
  customerId: string;
  note: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    challans: number;
    followUpLogs: number;
  };
  followUpLogs?: CustomerNote[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    category: string;
    location: string;
  };
  createdBy?: {
    id: string;
    name: string;
    role: string;
  };
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  productSnapshot?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  notes?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    businessName: string;
    mobile: string;
    email: string;
    address?: string;
    gstNumber?: string | null;
  };
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  items: ChallanItem[];
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
  }>;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  challanId: string;
  customerId: string;
  subTotal: number;
  taxAmount: number;
  grandTotal: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  dueDate?: string | null;
  createdAt: string;
  customer: {
    name: string;
    businessName: string;
    mobile: string;
    email: string;
    gstNumber?: string;
  };
  challan: {
    id: string;
    challanNumber: string;
    status: string;
    totalQuantity: number;
  };
}
