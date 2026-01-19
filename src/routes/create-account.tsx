import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAccountServerFn } from "@/lib/auth.server";

export const Route = createFileRoute("/create-account")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/" });
    }
  },
  component: CreateAccountPage,
});

function CreateAccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await createAccountServerFn({ data: { email, name, password } });
      if (result.success) {
        router.navigate({ to: "/" });
      } else {
        setError(result.error || "Account creation failed");
      }
    } catch (error) {
      console.error("Error creating account", error);
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
            <CardTitle className="text-lg">Create account</CardTitle>
            <p className="text-xs text-text-muted mt-1">Get started with your new account</p>
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
              <label htmlFor="name" className="text-xs font-medium text-text-muted">
                Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
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
                minLength={6}
                autoComplete="new-password"
              />
              <p className="text-[10px] text-text-muted">Must be at least 6 characters</p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-text-muted">
            Already have an account?{" "}
            <Link to="/sign-in" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
