'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = '', label, helperText, id, checked, ...props }, ref) => {
    const switchId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <div className="relative inline-block">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <label
            htmlFor={switchId}
            className="
              flex items-center h-6 w-11 cursor-pointer rounded-full
              bg-text-muted/20
              peer-checked:bg-movement
              peer-focus:ring-2 peer-focus:ring-movement peer-focus:ring-offset-2 peer-focus:ring-offset-foundation
              peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
              transition-colors
            "
          >
            <span
              className={`
                inline-block h-5 w-5 rounded-full bg-white shadow-md
                transition-transform
                ${checked ? 'translate-x-6' : 'translate-x-0.5'}
              `}
            />
          </label>
        </div>
        {(label || helperText) && (
          <div className="flex-1">
            {label && (
              <label
                htmlFor={switchId}
                className="block text-sm font-medium text-text-primary cursor-pointer"
              >
                {label}
              </label>
            )}
            {helperText && (
              <p className="text-xs text-text-muted mt-0.5">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
