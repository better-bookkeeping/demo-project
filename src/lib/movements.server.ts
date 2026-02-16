import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { csrfMiddleware } from "@/lib/csrf.server";
import { z } from "zod";

export const createMovementServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authMiddleware])
  .inputValidator(z.object({ name: z.string().trim().min(1).max(100), bodyWeight: z.boolean().optional() }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { name: string; bodyWeight?: boolean } }) => {
    const prisma = await getServerSidePrismaClient();
    const movement = await prisma.movement.create({
      data: { name: data.name, bodyWeight: data.bodyWeight ?? false, userId: context.user.id },
    });
    return { success: true, movement };
  });

export const deleteMovementServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authMiddleware])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { id: string } }) => {
    const prisma = await getServerSidePrismaClient();
    // Delete associated sets explicitly rather than using onDelete: Cascade on the
    // Movement→Set relation. Cascading deletes would silently remove sets from
    // completed workouts when a movement is deleted, which could corrupt workout
    // history. Explicit deletion keeps this side-effect visible and intentional.
    // Wrapped in a transaction so a failure in movement deletion doesn't leave
    // orphaned state (sets deleted but movement still present).
    await prisma.$transaction(async (tx) => {
      await tx.set.deleteMany({ where: { movementId: data.id } });
      await tx.movement.delete({ where: { id: data.id, userId: context.user.id } });
    });
    return { success: true };
  });

export const getMovementsServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    return prisma.movement.findMany({
      where: { userId: context.user.id },
      orderBy: { name: "asc" },
    });
  });
