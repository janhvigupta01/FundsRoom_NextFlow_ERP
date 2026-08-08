import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toUpperCase();

  let badgeClass = 'badge-neutral';

  switch (normalized) {
    case 'ACTIVE':
    case 'CONFIRMED':
    case 'PAID':
    case 'IN':
      badgeClass = 'badge-success';
      break;
    case 'LEAD':
    case 'PENDING':
    case 'DRAFT':
    case 'WHOLESALE':
      badgeClass = 'badge-warning';
      break;
    case 'INACTIVE':
    case 'CANCELLED':
    case 'OUT':
      badgeClass = 'badge-danger';
      break;
    case 'DISTRIBUTOR':
    case 'ADMIN':
      badgeClass = 'badge-primary';
      break;
    case 'RETAIL':
    case 'SALES':
    case 'WAREHOUSE':
    case 'ACCOUNTS':
      badgeClass = 'badge-info';
      break;
    default:
      badgeClass = 'badge-neutral';
  }

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {status}
    </span>
  );
};
