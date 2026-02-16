import { createServerFn } from "@tanstack/react-start";
import { configService } from "./config.server";

export const getServerConfigServerFn = createServerFn().handler(async () => {
  if (!configService.isInitialized()) {
    await configService.initialize();
  }
  const { environment } = configService.getAppConfig();
  return { environment };
});
