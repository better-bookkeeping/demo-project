import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-10 w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary",
      "placeholder:text-text-muted",
      "hover:border-text-muted",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "transition-colors duration-150",
      type === "number" && "font-mono tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
export type { InputProps };
