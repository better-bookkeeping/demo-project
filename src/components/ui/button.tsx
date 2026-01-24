import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "outline" | "ghost" | "destructive" | "secondary" | "link" | "accent";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-primary text-white hover:bg-primary/90 glow-hover shadow-lg shadow-primary/20",
  outline: "border-2 border-border bg-transparent text-white hover:bg-white/5 hover:border-white hover:text-white",
  ghost: "text-steel-400 hover:bg-white/5 hover:text-white",
  destructive: "bg-error text-white hover:bg-error/90 shadow-lg shadow-error/20",
  secondary: "bg-steel-800 text-white hover:bg-steel-700 border border-steel-700",
  link: "text-primary underline-offset-4 hover:underline",
  accent: "bg-accent text-white hover:bg-accent/90 glow-hover",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-11 px-6 py-2",
  sm: "h-9 px-4 text-xs",
  lg: "h-14 px-8 text-lg",
  icon: "h-11 w-11",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export const buttonVariants = ({ variant = "default", size = "default", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string }) => cn(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-heading font-bold uppercase tracking-wider transition-all duration-200",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg",
  "disabled:pointer-events-none disabled:opacity-50",
  "[&>svg]:pointer-events-none [&>svg]:shrink-0",
  variantStyles[variant],
  sizeStyles[size],
  className,
);

export { Button };
export type { ButtonVariant, ButtonSize, ButtonProps };
