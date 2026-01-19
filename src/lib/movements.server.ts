import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { z } from "zod";

export const createMovementServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ name: z.string().min(1), isBodyWeight: z.boolean().optional() }))
  .handler(async ({ data }: { data: { name: string; isBodyWeight?: boolean } }) => {
    const prisma = await getServerSidePrismaClient();
    const movement = await prisma.movement.create({
      data: { name: data.name, isBodyWeight: data.isBodyWeight ?? false },
    });
    return { success: true, movement };
  });

export const getMovementsServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
  const prisma = await getServerSidePrismaClient();
  return prisma.movement.findMany({
    orderBy: { name: "asc" },
  });
});

export const updateMovementServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      isBodyWeight: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }: { data: { id: string; name?: string; isBodyWeight?: boolean } }) => {
    const prisma = await getServerSidePrismaClient();
    const movement = await prisma.movement.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isBodyWeight !== undefined && { isBodyWeight: data.isBodyWeight }),
      },
    });
    return { success: true, movement };
  });
