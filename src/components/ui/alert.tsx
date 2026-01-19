import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

type AlertVariant = "default" | "destructive" | "warning" | "success";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantStyles: Record<AlertVariant, string> = {
  default: "bg-surface-elevated border-border-subtle text-text-primary [&>svg]:text-text-muted",
  destructive: "bg-red-950/50 border-red-900/50 text-red-200 [&>svg]:text-red-400",
  warning: "bg-amber-950/50 border-amber-900/50 text-amber-200 [&>svg]:text-amber-400",
  success: "bg-emerald-950/50 border-emerald-900/50 text-emerald-200 [&>svg]:text-emerald-400",
};

const Alert = forwardRef<HTMLDivElement, AlertProps>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      "relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7",
      variantStyles[variant],
      className,
    )}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
export type { AlertVariant, AlertProps };
