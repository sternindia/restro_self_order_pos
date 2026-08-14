import React from 'react';

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export const getOrderStatusStyle = (status: string) => {
  const s = (status || '').toUpperCase().trim();

  if (s === 'CANCELLED' || s === 'REJECTED') {
    return {
      label: 'CANCELLED',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dotClass: 'bg-rose-500'
    };
  }

  if (s === 'COMPLETED' || s === 'PAID') {
    return {
      label: 'COMPLETED',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dotClass: 'bg-emerald-500'
    };
  }

  if (s === 'READY' || s === 'SERVED') {
    return {
      label: 'READY TO SERVE',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
      dotClass: 'bg-sky-500'
    };
  }

  if (s === 'PREPARING' || s === 'CONFIRMED' || s === 'IN_PROGRESS' || s === 'KITCHEN') {
    return {
      label: 'PREPARING',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
      dotClass: 'bg-amber-500'
    };
  }

  // Default: PENDING / PLACED / ACTIVE
  return {
    label: s === 'PLACED' ? 'ORDER PLACED' : 'PENDING',
    badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200/80',
    dotClass: 'bg-yellow-500'
  };
};

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className = '' }) => {
  const { label, badgeClass, dotClass } = getOrderStatusStyle(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${badgeClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
};

export default OrderStatusBadge;
