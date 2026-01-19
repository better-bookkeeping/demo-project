import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Dumbbell, History, BicepsFlexed, Scale, Apple, Settings, User, Menu, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/__index/_layout")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: "/sign-in" });
    return { user: context.user! };
  },
});

const navItems = [
  { to: "/current-workout", label: "Current Workout", icon: Dumbbell },
  { to: "/workout-history", label: "History", icon: History },
  { to: "/movements", label: "Movements", icon: BicepsFlexed },
  { to: "/weight", label: "Weight", icon: Scale },
  { to: "/nutrition", label: "Nutrition", icon: Apple },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function RouteComponent() {
  const { user } = Route.useRouteContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-background overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border-subtle flex-shrink-0">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <img src="/wordmark.svg" alt="Better Bookkeeping" className="h-4 brightness-0 invert opacity-90" />
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 top-[49px] z-40 bg-background/80 backdrop-blur-md"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-surface border-r border-border-subtle
          transform transition-transform duration-200 ease-out
          lg:transform-none
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col
          top-[49px] lg:top-0 h-[calc(100vh-49px)] lg:h-screen
        `}
      >
        {/* Logo - Desktop */}
        <div className="hidden lg:block px-6 py-5 border-b border-border-subtle">
          <img src="/wordmark.svg" alt="Better Bookkeeping" className="h-6 brightness-0 invert opacity-90" />
        </div>

        {/* Navigation */}
        <div className="flex-1 min-h-0 overflow-y-auto py-4 px-3">
          <div className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-all duration-150 [&.active]:bg-primary-muted [&.active]:text-primary"
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0 transition-colors" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div className="border-t border-border-subtle p-3 flex-shrink-0">
          <Link
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user.name || user.email}</p>
            </div>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
