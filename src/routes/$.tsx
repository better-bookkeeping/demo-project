import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/$")({
  component: CatchAllPage,
});

function CatchAllPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg px-4 font-sans">
      <Card className="w-full max-w-lg border-steel-700 bg-card-elevated">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-steel-400">The page you're looking for doesn't exist.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => window.history.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go back
            </Button>
            <Link to="/" className="inline-flex">
              <Button className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
