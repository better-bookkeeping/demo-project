import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { z } from "zod";

export const searchFoodsServerFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      query: z.string().min(1),
    })
  )
  .handler(
    async ({
      data,
    }: {
      context: { user: { id: string } };
      data: { query: string };
    }) => {
      const prisma = await getServerSidePrismaClient();
      const searchTerm = data.query.toLowerCase().trim();

      const foods = await prisma.food.findMany({
        where: {
          OR: [
            { name: { startsWith: searchTerm, mode: "insensitive" } },
            { name: { contains: searchTerm, mode: "insensitive" } },
            { category: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        orderBy: [{ isCustom: "desc" }, { name: "asc" }],
        take: 20,
      });

      return foods;
    }
  );

export const getFoodByIdServerFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }: { context: { user: { id: string } }; data: { id: string } }) => {
      const prisma = await getServerSidePrismaClient();
      const food = await prisma.food.findUnique({
        where: { id: data.id },
      });

      if (!food) {
        throw new Error("Food not found");
      }

      return food;
    }
  );

export const createCustomFoodServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      name: z.string().min(1),
      category: z.string().min(1),
      calories: z.number().positive(),
      protein: z.number().nonnegative(),
      carbs: z.number().nonnegative(),
      fat: z.number().nonnegative(),
      servingSize: z.string().optional(),
    })
  )
  .handler(
    async ({
      context,
      data,
    }: {
      context: { user: { id: string } };
      data: {
        name: string;
        category: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        servingSize?: string;
      };
    }) => {
      const prisma = await getServerSidePrismaClient();
      const food = await prisma.food.create({
        data: {
          name: data.name,
          category: data.category,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          servingSize: data.servingSize,
          isCustom: true,
          userId: context.user.id,
        },
      });

      return { success: true, food };
    }
  );

export const getCustomFoodsServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }: { context: { user: { id: string } } }) => {
    const prisma = await getServerSidePrismaClient();
    const foods = await prisma.food.findMany({
      where: {
        userId: context.user.id,
        isCustom: true,
      },
      orderBy: { name: "asc" },
    });

    return foods;
  });

export const deleteCustomFoodServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(
    async ({ context, data }: { context: { user: { id: string } }; data: { id: string } }) => {
      const prisma = await getServerSidePrismaClient();
      await prisma.food.deleteMany({
        where: { id: data.id, userId: context.user.id },
      });
      return { success: true };
    }
  );
