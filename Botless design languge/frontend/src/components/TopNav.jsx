import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function TopNav() {
  const loc = useLocation();
  const { user } = useAuth();
  const isPublic = true;
  void isPublic;
  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)]/90 backdrop-blur border-b border-soft">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
          <img src="/logo.svg" alt="Botless" className="h-8 w-auto brightness-0 invert opacity-95" />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm">
          <Link to="/marketplace" className={`transition-colors ${loc.pathname.startsWith("/marketplace") ? "text-ink" : "text-muted hover:text-ink"}`} data-testid="nav-marketplace">
            Marketplace
          </Link>
          <a href="/#how" className="text-muted hover:text-ink" data-testid="nav-how">How it works</a>
          <a href="/#pricing" className="text-muted hover:text-ink" data-testid="nav-pricing">Pricing</a>
          {user ? (
            <Link to="/app/dashboard" className="bk-btn-primary" data-testid="nav-app">Open app →</Link>
          ) : (
            <>
              <Link to="/auth/sign-in" className="text-muted hover:text-ink" data-testid="nav-signin">Sign in</Link>
              <Link to="/auth/sign-up" className="bk-btn-primary" data-testid="nav-create">Create agent</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
