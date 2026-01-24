import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-10 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900",
      "placeholder:text-stone-400",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-stone-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
export type { InputProps };
