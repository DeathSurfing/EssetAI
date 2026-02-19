// HARDCODED: This file is evaluated at build time by Convex
// process.env is NOT available here - you must hardcode the values
// Get your Client ID from: https://dashboard.workos.com
const WORKOS_CLIENT_ID = "client_01KGHY0A6MHMDET7Z1NS3CKV3M";

const authConfig = {
  providers: [
    {
      type: "customJwt",
      issuer: `https://api.workos.com/`,
      algorithm: "RS256",
      jwks: `https://api.workos.com/sso/jwks/${WORKOS_CLIENT_ID}`,
      applicationID: WORKOS_CLIENT_ID,
    },
    {
      type: "customJwt",
      issuer: `https://api.workos.com/user_management/${WORKOS_CLIENT_ID}`,
      algorithm: "RS256",
      jwks: `https://api.workos.com/sso/jwks/${WORKOS_CLIENT_ID}`,
    },
  ],
};

export default authConfig;
