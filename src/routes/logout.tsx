import { getUserServerFn } from "@/lib/auth.server";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { deleteCookie } from "@tanstack/react-start/server";

export const Route = createFileRoute("/logout")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getUserServerFn();
        if (!user) {
          return redirect({
            href: "/sign-in",
          });
        }
        const prisma = await getServerSidePrismaClient();
        await prisma.user.update({
          where: { id: user.id },
          data: {
            currentToken: null,
            tokenExpiresAt: new Date(),
          },
        });
        deleteCookie("access_token");
        deleteCookie("id_token");
        return;
      },
    },
  },
  component: () => {
    return <div>Logging out...</div>;
  },
});
