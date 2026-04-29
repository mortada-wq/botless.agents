import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Spinner } from "@/components/ui/spinner.tsx";

export default function AuthCallback() {
  const navigate = useNavigate();
  const oidc = useAuth();
  const { isAuthenticated: convexAuthenticated, isLoading: convexLoading } =
    useConvexAuth();
  const updateCurrentUser = useMutation(api.users.updateCurrentUser);
  const finished = useRef(false);

  useEffect(() => {
    if (finished.current) return;
    if (oidc.isLoading || convexLoading) return;

    if (!oidc.isAuthenticated) {
      navigate("/", { replace: true });
      return;
    }

    if (!convexAuthenticated) {
      return;
    }

    finished.current = true;
    void (async () => {
      try {
        await updateCurrentUser();
      } finally {
        navigate("/", { replace: true });
      }
    })();
  }, [
    oidc.isLoading,
    oidc.isAuthenticated,
    convexAuthenticated,
    convexLoading,
    navigate,
    updateCurrentUser,
  ]);

  if (oidc.error) {
    return (
      <div className="flex flex-col items-center justify-center h-svh gap-6 px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-destructive font-medium">Sign-in failed</p>
          <p className="text-sm text-muted-foreground max-w-md">
            {oidc.error.message}
          </p>
        </div>
        <button
          type="button"
          className="text-sm text-primary underline"
          onClick={() => navigate("/", { replace: true })}
        >
          Return home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-svh gap-4">
      <Spinner className="size-8" />
      <p className="text-sm text-muted-foreground">Completing sign-in…</p>
    </div>
  );
}
