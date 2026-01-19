import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { z } from "zod";

export const createMovementServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ name: z.string().min(1), isBodyWeight: z.boolean().optional() }))
  .handler(
    async ({
      context,
      data,
    }: {
      context: { user: { id: string } };
      data: { name: string; isBodyWeight?: boolean };
    }) => {
      const prisma = await getServerSidePrismaClient();
      const movement = await prisma.movement.create({
        data: { name: data.name, isBodyWeight: data.isBodyWeight ?? false, userId: context.user.id },
      });
      return { success: true, movement };
    },
  );

export const getMovementsServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }: { context: { user: { id: string } } }) => {
    const prisma = await getServerSidePrismaClient();
    return prisma.movement.findMany({
      where: { userId: context.user.id },
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
  .handler(
    async ({
      context,
      data,
    }: {
      context: { user: { id: string } };
      data: { id: string; name?: string; isBodyWeight?: boolean };
    }) => {
      const prisma = await getServerSidePrismaClient();
      const movement = await prisma.movement.update({
        where: { id: data.id, userId: context.user.id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.isBodyWeight !== undefined && { isBodyWeight: data.isBodyWeight }),
        },
      });
      return { success: true, movement };
    },
  );

export const deleteMovementServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { id: string } }) => {
    const prisma = await getServerSidePrismaClient();
    await prisma.movement.delete({
      where: { id: data.id, userId: context.user.id },
    });
    return { success: true };
  });
