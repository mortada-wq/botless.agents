import { useAuth as useOidcAuth } from "react-oidc-context";

/**
 * Thin wrapper around react-oidc-context with naming aligned to prior hooks.
 */
export function useAuth() {
  const auth = useOidcAuth();
  return {
    ...auth,
    signin: () => auth.signinRedirect(),
    /** SPA-friendly logout without redirect round-trip */
    signout: () => auth.removeUser(),
    removeUser: () => auth.removeUser(),
  };
}

export function useUser() {
  const auth = useOidcAuth();
  return auth.user?.profile ?? null;
}
