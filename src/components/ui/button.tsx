import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "outline" | "ghost" | "destructive" | "secondary" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon" | "athletic";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-primary text-white font-medium hover:bg-primary-hover active:scale-[0.98]",
  outline:
    "border border-border bg-transparent text-text-primary font-medium hover:bg-surface-elevated hover:border-text-muted",
  ghost:
    "text-text-secondary font-medium hover:bg-surface-elevated hover:text-text-primary",
  destructive:
    "bg-destructive text-white font-medium hover:bg-destructive/90 active:scale-[0.98]",
  secondary:
    "bg-surface-elevated text-text-primary font-medium hover:bg-border",
  link: "text-primary hover:underline underline-offset-4 font-medium",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-10 px-4 text-sm",
  sm: "h-10 px-3 text-xs",
  lg: "h-11 px-5 text-sm",
  icon: "h-10 w-10",
  athletic: "h-11 px-6 text-sm",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
