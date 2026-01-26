import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { z } from "zod";

export const createWeightServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ value: z.number().positive(), recordedAt: z.date().optional() }))
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();
    const weight = await prisma.weight.create({
      data: {
        userId: context.user.id,
        value: data.value,
        recordedAt: data.recordedAt ?? new Date(),
      },
    });
    return { success: true, weight };
  });

export const getWeightHistoryServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const weights = await prisma.weight.findMany({
      where: { userId: context.user.id },
      orderBy: { recordedAt: "desc" },
    });
    return weights;
  });

export const getLatestWeightServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const weight = await prisma.weight.findFirst({
      where: { userId: context.user.id },
      orderBy: { recordedAt: "desc" },
    });
    return weight;
  });

export const deleteWeightServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();
    await prisma.weight.deleteMany({
      where: { id: data.id, userId: context.user.id },
    });
    return { success: true };
  });

export const getWeightGoalServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: context.user.id },
      select: {
        goalWeight: true,
        goalType: true,
        heightFeet: true,
        heightInches: true,
      },
    });
    return user;
  });

export const updateUserWeightGoalServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      goalWeight: z.number().optional(),
      goalType: z.enum(["cutting", "bulking", "maintenance"]).optional(),
      heightFeet: z.number().int().min(3).max(8).optional(),
      heightInches: z.number().int().min(0).max(11).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();
    await prisma.user.update({
      where: { id: context.user.id },
      data: {
        ...(data.goalWeight !== undefined && { goalWeight: data.goalWeight }),
        ...(data.goalType && { goalType: data.goalType }),
        ...(data.heightFeet !== undefined && { heightFeet: data.heightFeet }),
        ...(data.heightInches !== undefined && { heightInches: data.heightInches }),
      },
    });
    return { success: true };
  });
