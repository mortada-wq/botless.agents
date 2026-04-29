import React from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ShieldCheck, Users, Bot, ArrowLeft, LogOut } from "lucide-react";

export default function AdminShell() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--ink)]">
      <aside className="relative w-64 shrink-0 border-r border-[var(--border)] p-5 flex flex-col bg-[var(--surface)] min-h-screen">
        <Link to="/" className="flex items-center gap-2" data-testid="admin-logo">
          <img src="/logo.svg" alt="Botless" className="h-7 w-auto brightness-0 invert opacity-95" />
          <span className="serif text-xl text-muted">admin</span>
        </Link>
        <div className="text-xs uppercase tracking-widest text-muted mt-6">Moderation</div>
        <nav className="space-y-1 mt-2">
          <NavLink to="/admin" end data-testid="admin-nav-home" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive ? "bg-[var(--surface-2)] text-ink" : "text-muted hover:bg-[var(--surface-2)]"}`}>
            <ShieldCheck className="w-4 h-4" /> Overview
          </NavLink>
          <NavLink to="/admin/users" data-testid="admin-nav-users" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive ? "bg-[var(--surface-2)] text-ink" : "text-muted hover:bg-[var(--surface-2)]"}`}>
            <Users className="w-4 h-4" /> Users
          </NavLink>
          <NavLink to="/admin/agents" data-testid="admin-nav-agents" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive ? "bg-[var(--surface-2)] text-ink" : "text-muted hover:bg-[var(--surface-2)]"}`}>
            <Bot className="w-4 h-4" /> Agents
          </NavLink>
        </nav>
        <div className="mt-auto pt-8 space-y-2">
          <Link to="/app/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink" data-testid="admin-back">
            <ArrowLeft className="w-4 h-4" /> Back to app
          </Link>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-muted hover:text-ink" data-testid="admin-logout">
            <LogOut className="w-4 h-4" /> {user?.email}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
