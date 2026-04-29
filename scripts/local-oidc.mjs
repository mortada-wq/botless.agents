/**
 * Local OIDC issuer for development only (no Auth0 signup required).
 * Run: pnpm local:oidc
 *
 * Then start Convex + Vite. Convex must use the same issuer URL for JWT validation.
 * Note: Convex Cloud cannot reach http://127.0.0.1 — use local Convex (`npx convex dev`)
 * with Node.js 18–24 (not Node 25+) so `"use node"` actions deploy.
 */
import Provider from "oidc-provider";

const port = Number(process.env.OIDC_PORT ?? "9100");
const host = process.env.OIDC_HOST ?? "127.0.0.1";
const issuer = process.env.OIDC_ISSUER ?? `http://${host}:${port}`;

const redirectOrigin =
  process.env.VITE_DEV_ORIGIN ?? "http://127.0.0.1:5173";

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
};

const provider = new Provider(issuer, configuration);

provider.listen(port, host, () => {
  console.log(`[local-oidc] issuer: ${issuer}`);
  console.log(`[local-oidc] redirect_uri: ${redirectOrigin}/auth/callback`);
  console.log(`[local-oidc] client_id: local-spa`);
});
