import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-11 w-full rounded-md border border-steel-800 bg-black/20 px-4 py-2 text-sm text-white font-medium",
      "placeholder:text-steel-600",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-steel-900",
      "transition-all duration-200",
      "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
export type { InputProps };
