import { useState } from "react";
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Dumbbell, History, BicepsFlexed, LogOut, TrendingUp, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/__index/_layout")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: "/sign-in" });
    return { user: context.user! };
  },
});

const navItems = [
  { to: "/current-workout", label: "Current Workout", icon: Dumbbell },
  { to: "/workout-history", label: "Workout History", icon: History },
  { to: "/movements", label: "Movements", icon: BicepsFlexed },
  { to: "/weight-tracking", label: "Weight Tracking", icon: TrendingUp },
] as const;

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function RouteComponent() {
  const { user } = Route.useRouteContext();
  const initials = getInitials(user.name, user.email);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="h-screen flex bg-page-bg">
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-stone-200 flex items-center px-4 z-40 overflow-hidden">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-2 text-stone-600 hover:text-stone-900 flex-shrink-0"
          aria-label="Open menu">
          <Menu className="w-6 h-6" />
        </button>
        <img src="/wordmark.svg" alt="Logo" className="h-5 ml-3 max-w-[180px] object-contain" />
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <nav
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-gradient-to-b from-stone-100 to-stone-50 p-4 flex flex-col overflow-hidden
          transform transition-transform duration-200 ease-out md:transform-none
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}>
        <div className="flex items-center justify-between gap-2 mb-8">
          <img src="/wordmark.svg" alt="Logo" className="h-7 max-w-[170px] flex-shrink min-w-0" />
          <button
            className="md:hidden p-1.5 text-stone-400 hover:text-stone-600 flex-shrink-0"
            onClick={closeMobileMenu}
            aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMobileMenu}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-white/60 hover:text-stone-900 transition-colors [&.active]:bg-white [&.active]:text-stone-900 [&.active]:shadow-[var(--shadow-warm-sm)] [&.active]:border-l-3 [&.active]:border-l-accent [&.active]:-ml-0.5 [&.active]:pl-[calc(0.75rem+2px)]">
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
        <div className="border-t border-stone-200 pt-4 mt-4 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-sm font-semibold shadow-[var(--shadow-warm-sm)]">
              {initials}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs text-stone-400">Logged in as</p>
              <p className="text-sm font-medium text-stone-700 truncate">{user.name || user.email}</p>
            </div>
          </div>
          <a href="/logout">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-stone-600">
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
          </a>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto p-6 pt-20 md:pt-6 bg-page-bg">
        <Outlet />
      </main>
    </div>
  );
}
