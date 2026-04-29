import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import Landing from "@/pages/Landing";
import Marketplace from "@/pages/Marketplace";
import AgentDetail from "@/pages/AgentDetail";
import SignIn from "@/pages/SignIn";
import AppShell from "@/components/AppShell";
import Dashboard from "@/pages/Dashboard";
import NewAgent from "@/pages/NewAgent";
import Onboarding from "@/pages/Onboarding";
import Builder from "@/pages/Builder";
import MyAgents from "@/pages/MyAgents";
import Knowledge from "@/pages/Knowledge";
import Embed from "@/pages/Embed";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import AdminShell from "@/components/AdminShell";
import AdminHome from "@/pages/AdminHome";
import AdminUsers from "@/pages/AdminUsers";
import AdminModeration from "@/pages/AdminModeration";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted" data-testid="auth-loading">
        <span className="serif italic text-2xl">one moment…</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth/sign-in" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/app/dashboard" replace />;
  return children;
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/agents/:id" element={<AgentDetail />} />
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignIn mode="signup" />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="agents" element={<MyAgents />} />
        <Route path="agents/new" element={<NewAgent />} />
        <Route path="agents/onboarding" element={<Onboarding />} />
        <Route path="agents/:id/edit" element={<Builder />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="embed" element={<Embed />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="agents" element={<AdminModeration />} />
        <Route path="moderation" element={<AdminModeration />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  );
}
