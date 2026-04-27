import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Bot, LayoutDashboard, Settings, LogOut, ChevronRight, Sparkles, Menu, X, Wand2, MessageSquare, BarChart2, FlaskConical, Zap, Palette } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth.ts";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "convex/react";
import { cn } from "@/lib/utils.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import Logo from "@/components/logo.tsx";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "My Agents", icon: Bot, href: "/dashboard/agents" },
  { label: "Chat", icon: MessageSquare, href: "/dashboard/chat" },
  { label: "Media Studio", icon: Wand2, href: "/dashboard/studio" },
  { label: "Analytics", icon: BarChart2, href: "/dashboard/analytics" },
  { label: "Marketplace", icon: Sparkles, href: "/marketplace" },
  { label: "Playground", icon: FlaskConical, href: "/dashboard/playground" },
  { label: "Pipeline", icon: Zap, href: "/dashboard/pipeline" },
  { label: "Design Language", icon: Palette, href: "/dashboard/design" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { pathname } = useLocation();
  const { removeUser } = useAuth();
  const user = useQuery(api.users.getCurrentUser);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await removeUser();
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-border">
        <Link to="/" className="flex items-center cursor-pointer">
          <Logo height={28} />
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 pb-4 border-t border-border pt-4">
        {user === undefined ? (
          <div className="flex items-center gap-3 px-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name ?? "User"} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                {(user?.name ?? "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.companyName ?? user?.email ?? ""}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Authenticated>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-60 flex-col border-r border-border bg-sidebar shrink-0">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-border">
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile topbar */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar">
            <button onClick={() => setMobileOpen(true)} className="text-muted-foreground cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <Logo height={22} />
            </div>
            <div className="w-5" />
          </header>

          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </Authenticated>
  );
}
