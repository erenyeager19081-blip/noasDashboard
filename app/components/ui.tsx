import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: string;
  prefix?: string;
  suffix?: string;
}

export function StatCard({ title, value, change, prefix = '', suffix = '' }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className="p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-50"></div>
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-3 tracking-tight">
              {prefix}{value}{suffix}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isPositive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 
                  isNegative ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 
                  'bg-slate-50 text-slate-700 ring-1 ring-slate-200'
                }`}>
                  {isPositive && '↑'}{isNegative && '↓'} {Math.abs(change)}%
                </span>
                <span className="text-xs text-slate-500 font-medium">vs last week</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '',
  type = 'button',
  disabled = false
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-95';
  
  const variants = {
    primary: 'bg-gradient-to-r from-slate-800 to-slate-700 text-white hover:from-slate-700 hover:to-slate-600 focus:ring-slate-500 shadow-sm hover:shadow',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400 shadow-sm',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus:ring-slate-400'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-slate-200 animate-slideUp">
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-xl z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-3xl leading-none hover:rotate-90 transition-transform duration-200 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                ×
              </button>
            </div>
          </div>
          <div className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-5rem)] custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-slate-600 mt-2 font-medium">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
