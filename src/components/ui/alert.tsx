import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

type AlertVariant = "default" | "destructive" | "warning" | "success";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantStyles: Record<AlertVariant, string> = {
  default: "bg-slate-50 border-slate-200 text-slate-900 [&>svg]:text-slate-600",
  destructive: "bg-red-50 border-red-200 text-red-900 [&>svg]:text-red-600",
  warning: "bg-amber-50 border-amber-200 text-amber-900 [&>svg]:text-amber-600",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900 [&>svg]:text-emerald-600",
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
