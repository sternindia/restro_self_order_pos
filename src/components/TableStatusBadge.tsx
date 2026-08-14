import React from 'react';

interface TableStatusBadgeProps {
  status: string;
  className?: string;
  variant?: 'corner' | 'pill';
}

export const getTableStatusStyle = (status: string) => {
  const s = (status || '').toUpperCase().trim();

  if (s === 'OCCUPIED' || s === 'BUSY' || s === 'IN_USE') {
    return {
      label: 'OCCUPIED',
      badgeClass: 'bg-[#e63946] text-white',
    };
  }

  if (s === 'RESERVED' || s === 'DISABLED' || s === 'INACTIVE' || s === 'UNAVAILABLE') {
    return {
      label: s === 'DISABLED' ? 'DISABLED' : 'RESERVED',
      badgeClass: 'bg-purple-600 text-white',
    };
  }

  // Default: AVAILABLE
  return {
    label: 'AVAILABLE',
    badgeClass: 'bg-[#00966d] text-white',
  };
};

const TableStatusBadge: React.FC<TableStatusBadgeProps> = ({ status, className = '', variant = 'corner' }) => {
  const { label, badgeClass } = getTableStatusStyle(status);

  if (variant === 'corner') {
    return (
      <span className={`inline-block px-3 py-1 rounded-bl-xl rounded-tr-xl text-[10px] font-black uppercase tracking-wider text-white shadow-2xs ${badgeClass} ${className}`}>
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-2xs ${badgeClass} ${className}`}>
      {label}
    </span>
  );
};

export default TableStatusBadge;
