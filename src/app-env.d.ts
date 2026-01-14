import { ClientConfig } from "./lib/get-server-config.server";

declare global {
  interface Window {
    APP_CONFIG: ClientConfig;
  }
}
