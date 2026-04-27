import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Onboarding from "./pages/onboarding/page.tsx";
import DashboardLayout from "./pages/dashboard/_components/layout.tsx";
import DashboardHome from "./pages/dashboard/page.tsx";
import AgentsPage from "./pages/dashboard/agents/page.tsx";
import NewAgentPage from "./pages/dashboard/agents/new/page.tsx";
import SettingsPage from "./pages/dashboard/settings/page.tsx";
import StudioPage from "./pages/dashboard/studio/page.tsx";
import ChatPage from "./pages/dashboard/chat/page.tsx";
import MarketplacePage from "./pages/marketplace/page.tsx";
import AgentSharePage from "./pages/agent/[agentId].tsx";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Spinner } from "@/components/ui/spinner.tsx";

function DashboardGuard() {
  const user = useQuery(api.users.getCurrentUser);

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (user && !user.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <DashboardLayout />;
}

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/onboarding"
            element={
              <>
                <AuthLoading>
                  <div className="flex items-center justify-center h-screen bg-background">
                    <Spinner className="size-8" />
                  </div>
                </AuthLoading>
                <Authenticated>
                  <Onboarding />
                </Authenticated>
                <Unauthenticated>
                  <Navigate to="/" replace />
                </Unauthenticated>
              </>
            }
          />
          <Route
            path="/dashboard"
            element={
              <>
                <AuthLoading>
                  <div className="flex items-center justify-center h-screen bg-background">
                    <Spinner className="size-8" />
                  </div>
                </AuthLoading>
                <Authenticated>
                  <DashboardGuard />
                </Authenticated>
                <Unauthenticated>
                  <Navigate to="/" replace />
                </Unauthenticated>
              </>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="agents/new" element={<NewAgentPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="studio" element={<StudioPage />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/agent/:agentId" element={<AgentSharePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
