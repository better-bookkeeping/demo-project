import { cn } from "@/lib/utils";
import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    style={{ colorScheme: "dark" }}
    className={cn(
      "flex h-10 w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary",
      "hover:border-text-muted",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "transition-colors duration-150",
      "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export { Select };
export type { SelectProps };
