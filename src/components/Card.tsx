import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm shadow-blue-900/5 border border-blue-100 p-5 ${className}`}>
      {title && (
        <h3 className="text-sm font-semibold text-blue-900/70 uppercase tracking-wide mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
}
