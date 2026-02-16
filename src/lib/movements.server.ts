import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { csrfMiddleware } from "@/lib/csrf.server";
import { z } from "zod";

export const createMovementServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authMiddleware])
  .inputValidator(z.object({ name: z.string().min(1), bodyWeight: z.boolean().optional() }))
  .handler(async ({ data }: { data: { name: string; bodyWeight?: boolean } }) => {
    const prisma = await getServerSidePrismaClient();
    const movement = await prisma.movement.create({
      data: { name: data.name, bodyWeight: data.bodyWeight ?? false },
    });
    return { success: true, movement };
  });

export const deleteMovementServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authMiddleware])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }: { data: { id: string } }) => {
    const prisma = await getServerSidePrismaClient();
    await prisma.movement.delete({ where: { id: data.id } });
    return { success: true };
  });

export const getMovementsServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
  const prisma = await getServerSidePrismaClient();
  return prisma.movement.findMany({
    orderBy: { name: "asc" },
  });
});
