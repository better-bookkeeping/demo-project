import { useState } from "react";
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Dumbbell, History, BicepsFlexed, LogOut, TrendingUp, Menu, X, Activity } from "lucide-react";
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
  { to: "/progression", label: "Progression", icon: Activity },
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
    <div className="h-screen flex bg-page-bg font-sans">
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center px-4 z-40 overflow-hidden">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-2 text-steel-400 hover:text-white flex-shrink-0"
          aria-label="Open menu">
          <Menu className="w-6 h-6" />
        </button>
        <img src="/wordmark.svg" alt="Logo" className="h-5 ml-3 max-w-[180px] object-contain invert" />
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <nav
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-72 bg-card border-r border-border p-4 flex flex-col overflow-hidden
          transform transition-transform duration-200 ease-out md:transform-none
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}>
        <div className="flex items-center justify-between gap-2 mb-10 px-2">
          <img src="/wordmark.svg" alt="Logo" className="h-8 max-w-[170px] flex-shrink min-w-0 invert" />
          <button
            className="md:hidden p-1.5 text-steel-500 hover:text-white flex-shrink-0"
            onClick={closeMobileMenu}
            aria-label="Close menu">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMobileMenu}
              className="group flex items-center gap-4 px-4 py-3 rounded-md text-base font-bold uppercase tracking-wide text-steel-400 hover:bg-white/5 hover:text-white transition-all
              [&.active]:bg-white/5 [&.active]:text-primary [&.active]:accent-border-left [&.active]:pl-[calc(1rem-4px)]">
              <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {label}
            </Link>
          ))}
        </div>
        <div className="border-t border-border pt-6 mt-4 space-y-4">
          <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-lg border border-white/5">
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-orange-500/20">
              {initials}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs text-steel-400 uppercase tracking-wider font-bold">Athlete</p>
              <p className="text-sm font-bold text-white truncate">{user.name || user.email}</p>
            </div>
          </div>
          <a href="/logout">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-steel-400 hover:text-error hover:bg-error/10 uppercase font-bold tracking-wide">
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
          </a>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto p-4 md:px-8 md:pb-8 pt-14 md:pt-0 bg-page-bg scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        <Outlet />
      </main>
    </div>
  );
}
