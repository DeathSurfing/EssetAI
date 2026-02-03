// Convex Auth Configuration
// Uses WORKOS_CLIENT_ID from Convex environment variables
const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID;

if (!WORKOS_CLIENT_ID) {
  throw new Error("WORKOS_CLIENT_ID environment variable is required");
}

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
