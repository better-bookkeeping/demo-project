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

const timeRangeSchema = z.enum(["1W", "1M", "3M", "6M", "1Y", "All"]).optional();

export const getWeightHistoryServerFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.object({ range: timeRangeSchema }).optional())
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();
    const range = data?.range;
    let recordedAtFilter: { gte: Date } | undefined;
    if (range && range !== "All") {
      const days: Record<string, number> = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days[range]);
      recordedAtFilter = { gte: cutoff };
    }
    console.log(`[weight-history] range=${range ?? "All"} cutoff=${recordedAtFilter?.gte?.toISOString() ?? "none"}`);
    const results = await prisma.userWeight.findMany({
      where: { userId: context.user.id, ...(recordedAtFilter && { recordedAt: recordedAtFilter }) },
      orderBy: { recordedAt: "desc" },
    });
    console.log(`[weight-history] returned ${results.length} rows`);
    return results;
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
