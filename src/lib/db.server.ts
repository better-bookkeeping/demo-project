import { PrismaPg } from "@prisma/adapter-pg";
import { getServerConfigServerFn } from "./get-server-config.server";
import { PrismaClient } from "../../prisma/generated/client/client";

let _prismaClient: PrismaClient | null = null;

export const getServerSidePrismaClient = async () => {
  if (typeof window !== "undefined") {
    throw new Error("getServerSidePrismaClient should only be called on the server");
  }
  if (!_prismaClient) {
    const config = await getServerConfigServerFn();
    const adapter = new PrismaPg({ connectionString: config.database.url });
    _prismaClient = new PrismaClient({ adapter });
  }
  return _prismaClient;
};
