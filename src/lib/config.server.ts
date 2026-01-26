class AppConfigService<ConfigType> {
  private config: ConfigType;
  constructor(inputFig: ConfigType) {
    this.config = inputFig;
  }
  isInitialized() {
    return !!this.config;
  }
  initialize() {
    this.config = this.config;
  }
  getAppConfig() {
    return this.config;
  }
}

export const configService = new AppConfigService({
  environment: (process.env.VITE_ENVIRONMENT || process.env.ENVIRONMENT || process.env.NODE_ENV || "development") as
    | "development"
    | "test"
    | "staging"
    | "production",
  database: { url: process.env.DATABASE_URL },
});
