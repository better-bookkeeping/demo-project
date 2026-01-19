import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex items-center gap-3 cursor-pointer select-none",
          props.disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <div className="relative flex items-center justify-center w-5 h-5">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={cn(
              "peer absolute inset-0 w-5 h-5 rounded-md border-2 border-border bg-surface-elevated appearance-none cursor-pointer",
              "transition-all duration-200",
              "hover:border-text-muted hover:bg-surface",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
              "checked:bg-primary checked:border-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            {...props}
          />
          <Check
            className={cn(
              "w-3 h-3 text-white stroke-[3]",
              "opacity-0 scale-50 transition-all duration-200 pointer-events-none",
              "peer-checked:opacity-100 peer-checked:scale-100",
            )}
          />
        </div>
        {label && <span className="text-sm text-text-secondary">{label}</span>}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
export type { CheckboxProps };
