import * as React from "react";
import { cn } from "@/lib/cn";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "mb-1.5 block text-[12px] font-medium text-[var(--text-muted)] select-none",
          className,
        )}
        {...props}
      >
        {children}
        {required && <span className="ml-1 text-[var(--critical)]">*</span>}
      </label>
    );
  },
);

Label.displayName = "Label";
