import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { z } from "zod";

export const createWeightServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ value: z.number().positive(), recordedAt: z.date().optional() }))
  .handler(
    async ({ context, data }: { context: { user: { id: string } }; data: { value: number; recordedAt?: Date } }) => {
      const prisma = await getServerSidePrismaClient();
      const weight = await prisma.weight.create({
        data: {
          userId: context.user.id,
          value: data.value,
          recordedAt: data.recordedAt ?? new Date(),
        },
      });
      return { success: true, weight };
    },
  );

export const getWeightHistoryServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }: { context: { user: { id: string } } }) => {
    const prisma = await getServerSidePrismaClient();
    const weights = await prisma.weight.findMany({
      where: { userId: context.user.id },
      orderBy: { recordedAt: "desc" },
    });
    return weights;
  });

export const getLatestWeightServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }: { context: { user: { id: string } } }) => {
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
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { id: string } }) => {
    const prisma = await getServerSidePrismaClient();
    await prisma.weight.deleteMany({
      where: { id: data.id, userId: context.user.id },
    });
    return { success: true };
  });
