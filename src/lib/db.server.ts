import { getServerConfigServerFn } from "./get-server-config.server";
import { PrismaClient } from "../../prisma/generated/client/client";

let _prismaClient: PrismaClient | null = null;

export const getServerSidePrismaClient = async () => {
  if (typeof window !== "undefined") {
    throw new Error("getServerSidePrismaClient should only be called on the server");
  }
  if (!_prismaClient) {
    _prismaClient = new PrismaClient({
      datasourceUrl: (await getServerConfigServerFn()).database.url,
      errorFormat: "pretty",
    });
  }
  return _prismaClient;
};
