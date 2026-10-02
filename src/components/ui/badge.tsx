import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "outline" | "sage";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-sage text-charcoal",
    sage: "bg-sage-dark/60 text-forest-dark font-medium",
    success: "bg-status-success-bg text-status-success font-medium",
    warning: "bg-status-warning-bg text-status-warning font-medium",
    error: "bg-status-error-bg text-status-error font-medium",
    outline: "border border-border-subtle text-charcoal-muted",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
