import {
  ConvexProviderWithAuth,
  ConvexReactClient,
} from "convex/react";
import { useAuth } from "react-oidc-context";
import { useCallback, useMemo } from "react";

const convexUrl = import.meta.env.VITE_CONVEX_URL ?? "http://localhost:3000";
const convex = new ConvexReactClient(convexUrl);

function useAuthFromOidcForConvex() {
  const auth = useAuth();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        if (!auth.user) return null;
        if (forceRefreshToken || auth.user.expired) {
          const user = await auth.signinSilent();
          return user?.access_token ?? null;
        }
        return auth.user.access_token ?? null;
      } catch {
        return null;
      }
    },
    [auth],
  );

  return useMemo(
    () => ({
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated,
      fetchAccessToken,
    }),
    [auth.isLoading, auth.isAuthenticated, fetchAccessToken],
  );
}

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthFromOidcForConvex}>
      {children}
    </ConvexProviderWithAuth>
  );
}
