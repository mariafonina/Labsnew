import React from 'react';

type ProductStatus = 'not_for_sale' | 'pre_registration' | 'for_sale' | 'active';

interface ProductStatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

const statusConfig: Record<ProductStatus, { label: string; className: string }> = {
  not_for_sale: {
    label: 'Не продается',
    className: 'bg-gray-100 text-gray-700',
  },
  pre_registration: {
    label: 'Предрегистрация',
    className: 'bg-blue-100 text-blue-700',
  },
  for_sale: {
    label: 'В продаже',
    className: 'bg-green-100 text-green-700',
  },
  active: {
    label: 'Проведение проекта',
    className: 'bg-purple-100 text-purple-700',
  },
};

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status] || statusConfig.not_for_sale;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`}>
      {config.label}
    </span>
  );
};
