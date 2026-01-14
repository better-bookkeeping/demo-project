// =============================================================================
// Leave this file here, it will be replaced by the entrypoint script, but the file needs to exist at build time
// =============================================================================
window.APP_CONFIG = {
  environment: "${VITE_ENVIRONMENT}",
  auth0: {
    domain: "${VITE_AUTH0_DOMAIN}",
    clientId: "${VITE_AUTH0_CLIENT_ID}",
  },
  documentParser: {
    apiUrl: "${VITE_DOCUMENT_PARSER_API_URL}",
  },
};

// Make it available as ES module too
if (typeof module !== "undefined" && module.exports) {
  module.exports = window.APP_CONFIG;
}
