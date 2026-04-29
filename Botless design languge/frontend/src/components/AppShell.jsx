import React from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, Bot, BookOpen, Code2, BarChart3, Settings as SettingsIcon, Plus, LogOut, ShieldCheck } from "lucide-react";

const links = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { to: "/app/agents", label: "My Agents", icon: Bot, id: "agents" },
  { to: "/app/knowledge", label: "Knowledge", icon: BookOpen, id: "knowledge" },
  { to: "/app/embed", label: "Embed", icon: Code2, id: "embed" },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, id: "analytics" },
  { to: "/app/settings", label: "Settings", icon: SettingsIcon, id: "settings" },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-soft bg-[var(--surface)]" data-testid="app-sidebar">
        <Link to="/" className="flex items-center gap-2 px-6 py-6">
          <img src="/logo.svg" alt="Botless" className="h-8 w-auto brightness-0 invert opacity-95" />
        </Link>
        <nav className="flex-1 px-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`sidebar-${l.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-[#E26D5C]/15 text-[#f09082] font-medium" : "text-muted hover:bg-surface-2 hover:text-ink"
                }`
              }
              end
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink to="/admin" data-testid="sidebar-admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-surface-2 hover:text-ink">
              <ShieldCheck className="w-4 h-4" /> Admin
            </NavLink>
          )}
        </nav>
        <div className="p-3 border-t border-soft">
          <button
            className="bk-btn-primary w-full justify-center"
            data-testid="sidebar-new-agent"
            onClick={() => navigate("/app/agents/new")}
          >
            <Plus className="w-4 h-4" /> New agent
          </button>
        </div>
        <div className="px-5 py-4 border-t border-soft flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-surface-2 grid place-items-center overflow-hidden">
            {user?.picture ? <img alt="" src={user.picture} className="w-full h-full object-cover" /> : <span className="text-muted">{(user?.name || "U").slice(0,1)}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-ink truncate">{user?.name}</div>
            <div className="text-xs text-muted truncate">{user?.email}</div>
          </div>
          <button onClick={logout} data-testid="sidebar-logout" className="text-muted hover:text-ink">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
