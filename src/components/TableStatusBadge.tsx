import React from 'react';

interface TableStatusBadgeProps {
  status: string;
  className?: string;
}

export const getTableStatusStyle = (status: string) => {
  const s = (status || '').toUpperCase().trim();

  if (s === 'OCCUPIED' || s === 'BUSY' || s === 'IN_USE') {
    return {
      label: 'Occupied',
      badgeClass: 'bg-sky-50 text-[#0077b6] border-[#0077b6]/30',
      dotClass: 'bg-[#0077b6]'
    };
  }

  if (s === 'RESERVED' || s === 'DISABLED' || s === 'INACTIVE' || s === 'UNAVAILABLE') {
    return {
      label: s === 'DISABLED' ? 'Disabled' : 'Reserved',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dotClass: 'bg-rose-500'
    };
  }

  // Default: Available
  return {
    label: 'Available',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500'
  };
};

const TableStatusBadge: React.FC<TableStatusBadgeProps> = ({ status, className = '' }) => {
  const { label, badgeClass, dotClass } = getTableStatusStyle(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${badgeClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
};

export default TableStatusBadge;
