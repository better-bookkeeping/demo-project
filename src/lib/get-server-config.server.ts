import { createServerFn } from "@tanstack/react-start";
import { configService } from "./config.server";

export const getServerConfigServerFn = createServerFn().handler(async () => {
  const { environment } = configService.getAppConfig();
  return { environment };
});
