import { logoutServerFn } from "@/lib/auth.server";
import { createFileRoute, redirect } from "@tanstack/react-router";

// Logout is handled in beforeLoad so it completes before rendering.
// This avoids the useEffect approach which can fire twice in React strict mode
// and leaves a dangling "Logging out..." UI on errors.
export const Route = createFileRoute("/logout")({
  beforeLoad: async () => {
    await logoutServerFn();
    throw redirect({ to: "/sign-in" });
  },
  component: () => <div>Logging out...</div>,
});
