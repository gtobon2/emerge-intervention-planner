'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading,
      disabled,
      leftIcon,
      rightIcon,
      fullWidth,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-xl
      transition-all duration-200 ease-smooth
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-foundation
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      active:scale-[0.98]
    `;

    const variantStyles = {
      primary: `
        bg-gradient-to-r from-movement to-movement-hover
        text-white
        shadow-md hover:shadow-lg hover:shadow-movement/25
        hover:-translate-y-0.5
        focus-visible:ring-movement
      `,
      secondary: `
        bg-surface text-text-primary
        border border-border
        hover:border-border-hover hover:bg-surface-elevated
        focus-visible:ring-border
      `,
      ghost: `
        bg-transparent text-text-secondary
        hover:bg-surface-elevated hover:text-text-primary
        focus-visible:ring-border
      `,
      danger: `
        bg-gradient-to-r from-error to-red-600
        text-white
        shadow-md hover:shadow-lg hover:shadow-error/25
        hover:-translate-y-0.5
        focus-visible:ring-error
      `,
      success: `
        bg-gradient-to-r from-success to-emerald-600
        text-white
        shadow-md hover:shadow-lg hover:shadow-success/25
        hover:-translate-y-0.5
        focus-visible:ring-success
      `,
      outline: `
        bg-transparent text-movement
        border-2 border-movement
        hover:bg-movement hover:text-white
        focus-visible:ring-movement
      `,
    };

    const sizeStyles = {
      xs: 'px-2.5 py-1 text-xs min-h-[28px]',
      sm: 'px-3 py-1.5 text-sm min-h-[32px]',
      md: 'px-4 py-2 text-sm min-h-[40px]',
      lg: 'px-5 py-2.5 text-base min-h-[44px]',
      xl: 'px-6 py-3 text-lg min-h-[52px]',
    };

    const iconSizeStyles = {
      xs: 'w-3 h-3',
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className={`animate-spin ${iconSizeStyles[size]}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className={iconSizeStyles[size]}>{leftIcon}</span>}
            {children}
            {rightIcon && <span className={iconSizeStyles[size]}>{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Icon Button variant for icon-only buttons
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className = '', variant = 'ghost', size = 'md', icon, ...props }, ref) => {
    const sizeStyles = {
      xs: 'w-7 h-7',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-11 h-11',
      xl: 'w-12 h-12',
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        className={`!p-0 ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
