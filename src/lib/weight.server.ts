import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { csrfMiddleware } from "@/lib/csrf.server";
import { z } from "zod";

export const addWeightServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authMiddleware])
  .inputValidator(z.object({ weight: z.number().min(1).max(1500) }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { weight: number } }) => {
    const prisma = await getServerSidePrismaClient();
    const entry = await prisma.userWeight.create({
      data: {
        userId: context.user.id,
        weight: data.weight,
      },
    });
    return { success: true as const, entry };
  });

export const getWeightHistoryServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    return prisma.userWeight.findMany({
      where: { userId: context.user.id },
      orderBy: { recordedAt: "desc" },
    });
  });

export const getLatestWeightServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    return prisma.userWeight.findFirst({
      where: { userId: context.user.id },
      orderBy: { recordedAt: "desc" },
    });
  });
