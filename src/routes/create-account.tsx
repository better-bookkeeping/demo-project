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
      const message = error && typeof error === "object" && "message" in error
        ? (error as { message: string }).message
        : "An unexpected error occurred";

      setError(
        message.includes("Password") || message.includes("must contain")
          ? "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character"
          : message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg px-4">
      <Card variant="elevated" className="w-full max-w-md border border-border">
        <CardHeader className="text-center space-y-2">
          <img src="/wordmark.svg" alt="Logo" className="h-8 mx-auto invert" />
          <CardTitle className="text-2xl font-semibold text-white">Create your account</CardTitle>
          <p className="text-sm text-steel-400">Get started with your new account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-error bg-error/10 border border-error/20 rounded-lg">{error}</div>
            )}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-steel-300">
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
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-steel-300">
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
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-steel-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-steel-500">Password must be at least 8 characters with uppercase, lowercase, number, and special character</p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-steel-400">
            Already have an account?{" "}
            <Link to="/sign-in" className="text-primary hover:text-primary/80 hover:underline font-bold tracking-wide">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
