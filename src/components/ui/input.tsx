import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-border-subtle bg-white px-3 py-1 text-sm shadow-subtle transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-charcoal-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-forest focus-visible:border-forest disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-status-error focus-visible:ring-status-error",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-status-error mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
