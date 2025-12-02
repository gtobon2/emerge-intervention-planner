'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, id, checked, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <label
        htmlFor={checkboxId}
        className={`inline-flex items-center gap-2 cursor-pointer ${className}`}
      >
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <div className="
            w-5 h-5 rounded
            border border-text-muted/30
            bg-foundation
            peer-checked:bg-movement peer-checked:border-movement
            peer-focus:ring-2 peer-focus:ring-movement peer-focus:ring-offset-2 peer-focus:ring-offset-foundation
            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
            transition-colors
          ">
            <Check
              className={`
                w-4 h-4 text-white absolute top-0.5 left-0.5
                ${checked ? 'opacity-100' : 'opacity-0'}
                transition-opacity
              `}
            />
          </div>
        </div>
        {label && (
          <span className="text-sm text-text-primary">{label}</span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
