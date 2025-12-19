'use client';

import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlighted' | 'glass' | 'elevated' | 'interactive';
  hover?: boolean;
  animate?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', hover = false, animate = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl transition-all duration-300 ease-smooth';

    const variantStyles = {
      default: 'bg-surface border border-border shadow-sm',
      highlighted: 'bg-surface border-2 border-movement shadow-glow',
      glass: 'glass',
      elevated: 'bg-surface border border-border shadow-lg',
      interactive: 'bg-surface border border-border shadow-sm hover:shadow-lg hover:border-border-hover hover:-translate-y-0.5 cursor-pointer',
    };

    const hoverStyles = hover
      ? 'hover:shadow-lg hover:border-border-hover hover:-translate-y-0.5'
      : '';

    const animateStyles = animate ? 'animate-fade-in-up' : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${animateStyles} p-5 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-between mb-5 ${className}`}
        {...props}
      >
        <div className="flex items-center gap-3">{children}</div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  subtitle?: string;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = '', as: Tag = 'h3', subtitle, children, ...props }, ref) => {
    const sizeStyles = {
      h1: 'text-2xl',
      h2: 'text-xl',
      h3: 'text-lg',
      h4: 'text-base',
    };

    return (
      <div className="flex flex-col">
        <Tag
          ref={ref}
          className={`${sizeStyles[Tag]} font-semibold text-text-primary tracking-tight ${className}`}
          {...props}
        >
          {children}
        </Tag>
        {subtitle && (
          <span className="text-sm text-text-muted mt-0.5">{subtitle}</span>
        )}
      </div>
    );
  }
);

CardTitle.displayName = 'CardTitle';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`text-text-secondary ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between';
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', align = 'right', children, ...props }, ref) => {
    const alignStyles = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={`flex items-center gap-3 mt-5 pt-5 border-t border-border ${alignStyles[align]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// New: Stat Card for dashboard metrics
export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  sparkline?: number[];
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className = '', label, value, change, icon, sparkline, ...props }, ref) => {
    const trendColors = {
      increase: 'text-success',
      decrease: 'text-error',
      neutral: 'text-text-muted',
    };

    const trendIcons = {
      increase: '↑',
      decrease: '↓',
      neutral: '→',
    };

    return (
      <Card
        ref={ref}
        variant="default"
        hover
        className={`relative overflow-hidden ${className}`}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-muted">{label}</p>
            <p className="text-3xl font-bold text-text-primary tracking-tight">
              {value}
            </p>
            {change && (
              <div className={`flex items-center gap-1 text-sm font-medium ${trendColors[change.type]}`}>
                <span>{trendIcons[change.type]}</span>
                <span>{Math.abs(change.value)}%</span>
                <span className="text-text-muted font-normal">vs last period</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="p-3 rounded-xl bg-movement/10 text-movement">
              {icon}
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparkline && sparkline.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="sparkline h-8">
              {sparkline.map((value, index) => {
                const max = Math.max(...sparkline);
                const height = max > 0 ? (value / max) * 100 : 0;
                return (
                  <div
                    key={index}
                    className="sparkline-bar"
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </Card>
    );
  }
);

StatCard.displayName = 'StatCard';
