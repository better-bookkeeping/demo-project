import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

type CardVariant = "default" | "elevated" | "stat";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-card border-none",
  elevated: "bg-card-elevated border-none shadow-lg",
  stat: "bg-card border-l-4 border-l-primary shadow-lg",
};

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant = "default", ...props }, ref) => (
  <div ref={ref} className={cn("rounded-md", variantStyles[variant], className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-xl font-heading font-bold uppercase leading-none tracking-wide text-white", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
export type { CardVariant, CardProps };
