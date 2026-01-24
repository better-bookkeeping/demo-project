import { HeadContent, Scripts, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import styles from "../styles.css?url";
import { type QueryClient } from "@tanstack/react-query";
import { getUserServerFn } from "@/lib/auth.server";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { useClientConfig } from "@/lib/config.client";
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from "lucide-react";
import { getServerConfigServerFn } from "@/lib/get-server-config.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ToastContainer } from "react-toastify";
import toastifyStyles from "react-toastify/dist/ReactToastify.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

function RootErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const clientConfig = useClientConfig();
  const isDev = clientConfig.environment === "development";
  const [copied, setCopied] = useState(false);

  const copyErrorToClipboard = async () => {
    const errorInfo = `Error Name: ${error.name}
Error Message: ${error.message}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}

Stack Trace:
${error.stack || "No stack trace available"}`;

    try {
      await navigator.clipboard.writeText(errorInfo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy error to clipboard:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg px-4 font-sans">
      <Card className="w-full max-w-lg border-error/50 bg-card-elevated">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-4 border border-error/20">
            <AlertTriangle className="w-8 h-8 text-error" />
          </div>
          <CardTitle className="text-xl text-white">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive" className="bg-error/10 border-error/20 text-error">
            <Bug className="h-4 w-4" />
            <div className="flex items-start justify-between">
              <AlertTitle className="text-error font-bold uppercase">Error Details</AlertTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyErrorToClipboard}
                className="h-6 px-2 text-error hover:bg-error/20 hover:text-white">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <AlertDescription className="mt-2 text-error/90">
              {isDev ? (
                <div className="space-y-2">
                  <p className="font-medium font-heading">{error.name}</p>
                  <p className="text-sm font-mono">{error.message}</p>
                  {error.stack && (
                    <details className="mt-2" open>
                      <summary className="cursor-pointer text-sm font-medium hover:underline">Stack trace</summary>
                      <pre className="mt-2 text-xs overflow-x-auto bg-black/50 p-2 rounded whitespace-pre-wrap break-words max-w-full font-mono text-white/80 border border-white/10">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <p>
                  We encountered an unexpected error. Please try refreshing the page or contact support if the problem
                  persists.
                </p>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
            <Button variant="outline" onClick={() => router.navigate({ to: "/" })} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to home
            </Button>
          </div>

          {!isDev && (
            <div className="text-center">
              <p className="text-sm text-steel-500">Error ID: {Date.now().toString(36)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    await getServerConfigServerFn();
    const user = await getUserServerFn();
    return { user };
  },
  errorComponent: RootErrorComponent,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },

      {
        title: "Better Bookkeeping - Onboarding",
      },
    ],
    scripts: [
      {
        src: "/config.js",
        type: "text/javascript",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.png",
      },
      {
        rel: "stylesheet",
        href: styles,
      },
      {
        rel: "stylesheet",
        href: toastifyStyles,
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const config = useClientConfig();
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <ToastContainer position="top-right" autoClose={4000} theme="light" />
        {config.environment === "development" && (
          <TanStackDevtools
            config={{
              position: "bottom-left",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
              {
                name: "TanStack Query",
                render: <ReactQueryDevtoolsPanel />,
              },
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  );
}
