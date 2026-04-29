import { AuthProvider as OidcAuthProvider } from "react-oidc-context";

function MissingOidcConfig() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="max-w-md space-y-3 rounded-lg border border-border p-6 font-sans text-sm">
        <p className="text-base font-semibold text-foreground">
          OIDC is not configured
        </p>
        <p className="text-muted-foreground">
          Copy{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
            .env.example
          </code>{" "}
          to{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
            .env.local
          </code>
          , set{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
            VITE_OIDC_AUTHORITY
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
            VITE_OIDC_CLIENT_ID
          </code>{" "}
          to your OIDC provider values (must match Convex{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
            auth.config.ts
          </code>
          ). Restart the dev server after saving.
        </p>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authority = import.meta.env.VITE_OIDC_AUTHORITY;
  const client_id = import.meta.env.VITE_OIDC_CLIENT_ID;

  if (!authority?.trim() || !client_id?.trim()) {
    return <MissingOidcConfig />;
  }

  const redirect_uri = `${window.location.origin}/auth/callback`;

  return (
    <OidcAuthProvider
      authority={authority}
      client_id={client_id}
      redirect_uri={redirect_uri}
      response_type={
        import.meta.env.VITE_OIDC_RESPONSE_TYPE ?? "code"
      }
      scope={
        import.meta.env.VITE_OIDC_SCOPE ??
        "openid profile email offline_access"
      }
      prompt={import.meta.env.VITE_OIDC_PROMPT ?? "select_account"}
      automaticSilentRenew
      onSigninCallback={() =>
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    >
      {children}
    </OidcAuthProvider>
  );
}
