import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { z } from "zod";

export const createMovementServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ name: z.string().min(1), isBodyWeight: z.boolean().default(false) }))
  .handler(async ({ data, context }) => {
    const prisma = await getServerSidePrismaClient();
    const movement = await prisma.movement.create({
      data: {
        name: data.name,
        userId: context.user.id,
        isBodyWeight: data.isBodyWeight,
      },
    });
    return { success: true, movement };
  });

export const getMovementsServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    let movements = await prisma.movement.findMany({
      where: { userId: context.user.id },
      orderBy: { name: "asc" },
    });

    if (movements.length === 0) {
      const defaults = [
        { name: "Bench Press", isBodyWeight: false },
        { name: "Squat", isBodyWeight: false },
        { name: "Deadlift", isBodyWeight: false },
        { name: "Overhead Press", isBodyWeight: false },
        { name: "Pull Up", isBodyWeight: true },
        { name: "Push Up", isBodyWeight: true },
        { name: "Dip", isBodyWeight: true },
        { name: "Dumbbell Curl", isBodyWeight: false },
        { name: "Tricep Extension", isBodyWeight: false },
        { name: "Leg Press", isBodyWeight: false },
        { name: "Lat Pulldown", isBodyWeight: false },
        { name: "Seated Row", isBodyWeight: false },
      ];

      await prisma.movement.createMany({
        data: defaults.map((movement) => ({
          name: movement.name,
          isBodyWeight: movement.isBodyWeight,
          userId: context.user.id,
        })),
      });

      movements = await prisma.movement.findMany({
        where: { userId: context.user.id },
        orderBy: { name: "asc" },
      });
    }

    return movements;
  });

export const deleteMovementServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const prisma = await getServerSidePrismaClient();

    const movement = await prisma.movement.findFirst({
      where: {
        id: data.id,
        userId: context.user.id,
      },
      include: {
        _count: {
          select: { sets: true },
        },
      },
    });

    if (!movement) {
      throw new Error("Movement not found");
    }

    if (movement._count.sets > 0) {
      throw new Error("Cannot delete movement with existing history");
    }

    await prisma.movement.delete({
      where: { id: data.id },
    });

    return { success: true };
  });
