import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "outline" | "ghost" | "destructive" | "secondary" | "link" | "accent";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-primary text-white hover:bg-primary/90 shadow-[var(--shadow-warm-sm)]",
  outline: "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-400",
  ghost: "text-stone-700 hover:bg-stone-100 hover:text-stone-900",
  destructive: "bg-error text-white hover:bg-error/90 shadow-[var(--shadow-warm-sm)]",
  secondary: "bg-stone-100 text-stone-900 hover:bg-stone-200",
  link: "text-primary underline-offset-4 hover:underline",
  accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-[var(--shadow-warm-sm)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-sm",
  lg: "h-12 px-6 text-lg",
  icon: "h-10 w-10",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&>svg]:pointer-events-none [&>svg]:shrink-0",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button };
export type { ButtonVariant, ButtonSize, ButtonProps };
