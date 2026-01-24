import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

type CardVariant = "default" | "elevated" | "stat";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-card shadow-[var(--shadow-warm)]",
  elevated: "bg-card shadow-[var(--shadow-warm-lg)]",
  stat: "bg-card shadow-[var(--shadow-warm)] border-l-3 border-l-accent",
};

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant = "default", ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl", variantStyles[variant], className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight text-stone-900", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
export type { CardVariant, CardProps };
