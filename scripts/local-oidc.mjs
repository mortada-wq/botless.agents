/**
 * Local OIDC issuer for development only (no Auth0 signup required).
 * Run: pnpm local:oidc
 *
 * Then start Convex + Vite. Convex must use the same issuer URL for JWT validation.
 * In Replit, the OIDC server is publicly accessible so Convex Cloud can reach it.
 */
import Provider from "oidc-provider";

const replitDomain = process.env.REPLIT_DEV_DOMAIN;
const defaultPort = 3000;
const port = Number(process.env.OIDC_PORT ?? defaultPort);

// In Replit, use the public domain. Otherwise fall back to localhost.
const defaultHost = replitDomain ? "0.0.0.0" : "127.0.0.1";
const host = process.env.OIDC_HOST ?? defaultHost;

// Replit exposes ports at https://<port>-<domain>
const defaultIssuer = replitDomain
  ? `https://${port}-${replitDomain}`
  : `http://127.0.0.1:${port}`;
const issuer = process.env.OIDC_ISSUER ?? defaultIssuer;

// The Vite app public origin
const replitAppDomain = replitDomain
  ? `https://${replitDomain}`
  : null;
const redirectOrigin =
  process.env.VITE_DEV_ORIGIN ?? replitAppDomain ?? "http://127.0.0.1:5000";

const configuration = {
  clients: [
    {
      client_id: "local-spa",
      redirect_uris: [`${redirectOrigin}/auth/callback`],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
  ],
  pkce: {
    required: () => true,
  },
};

const provider = new Provider(issuer, configuration);

provider.listen(port, host, () => {
  console.log(`[local-oidc] issuer: ${issuer}`);
  console.log(`[local-oidc] redirect_uri: ${redirectOrigin}/auth/callback`);
  console.log(`[local-oidc] client_id: local-spa`);
});
