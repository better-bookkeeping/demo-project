import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInServerFn } from "@/lib/auth.server";

export const Route = createFileRoute("/sign-in")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/" });
    }
  },
  component: SignInPage,
});

function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signInServerFn({ data: { email, password } });
      if (result.success) {
        router.navigate({ to: "/" });
      } else {
        setError(result.error || "Sign in failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-3 pb-2">
          <img src="/wordmark.svg" alt="Logo" className="h-6 mx-auto brightness-0 invert opacity-90" />
          <div>
            <CardTitle className="text-lg">Sign in</CardTitle>
            <p className="text-xs text-text-muted mt-1">Enter your credentials to continue</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-2.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-text-muted">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-text-muted">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-text-muted">
            Don't have an account?{" "}
            <Link to="/create-account" className="text-primary hover:underline font-medium">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
