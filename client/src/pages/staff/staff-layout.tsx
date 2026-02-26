import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { getAuthMe, logout, type StaffUser } from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarCheck,
  FileText,
  User,
  LogOut,
  ClipboardList,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import MonthlyTargetPopup, { clearMonthlyTargetPopupShown } from "@/components/staff/MonthlyTargetPopup";

const path = (base: string, p: string) => (base ? `${base}${p}` : p);

function CompanyLogo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const isDark = variant === "dark";
  // One line: larger font on mobile (light = header), slightly smaller in sidebar (dark)
  const fontSize = isDark ? "0.85rem" : "1.1rem";
  return (
    <div className="flex items-baseline gap-1 flex-nowrap leading-tight tracking-tight whitespace-nowrap">
      <span className="font-bold text-[#1A4EC9]" style={{ fontSize }}>
        EXPRESS
      </span>
      <span className="font-bold text-[#E12428]" style={{ fontSize: `calc(${fontSize} * 0.7)` }}>
        FINANCIAL SERVICES
      </span>
    </div>
  );
}

export default function StaffLayout({
  children,
  basePath = "/staff",
}: {
  children: React.ReactNode;
  basePath?: string;
}) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");
    return () => {
      meta?.setAttribute("content", "");
    };
  }, []);

  useEffect(() => {
    getAuthMe()
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [location]);

  async function handleLogout() {
    try {
      await logout();
      clearMonthlyTargetPopupShown();
      setUser(null);
      window.location.href = path(basePath, "/login");
    } catch {
      toast({ title: "Logout failed", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "admin";
  const isTeamLead = user.role === "team_lead";
  const isEmployee = user.role === "employee";
  const nav = [
    ...(isAdmin || isTeamLead ? [{ href: path(basePath, "/dashboard"), label: "Dashboard", icon: LayoutDashboard }] : []),
    ...(isEmployee ? [{ href: path(basePath, "/my-dashboard"), label: "My dashboard", icon: LayoutDashboard }] : []),
    ...(isAdmin ? [{ href: path(basePath, "/employees"), label: "Employees", icon: Users }] : []),
    ...(isTeamLead ? [{ href: path(basePath, "/my-team"), label: "My team", icon: Users }] : []),
    ...(isAdmin || isTeamLead ? [{ href: path(basePath, "/attendance"), label: "Attendance", icon: Calendar }] : []),
    ...(isAdmin || isTeamLead ? [{ href: path(basePath, "/leads"), label: "Loan leads", icon: FileText }] : []),
    ...(isAdmin || isTeamLead ? [{ href: path(basePath, "/insurance-leads"), label: "Insurance leads", icon: Shield }] : []),
    ...(isAdmin || isTeamLead ? [{ href: path(basePath, "/leave-requests"), label: "Leave requests", icon: CalendarCheck }] : []),
    ...(isEmployee ? [{ href: path(basePath, "/my-leads"), label: "My leads", icon: ClipboardList }] : []),
    ...(isEmployee ? [{ href: path(basePath, "/my-attendance"), label: "My attendance", icon: Calendar }] : []),
    ...(isEmployee ? [{ href: path(basePath, "/my-leave"), label: "My leave", icon: CalendarCheck }] : []),
    { href: path(basePath, "/profile"), label: "Profile", icon: User },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      {(isEmployee || isTeamLead) && <MonthlyTargetPopup />}
      <div className="min-h-screen flex bg-slate-100">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={closeSidebar}
          />
        )}
        <aside
          className={`
            fixed md:relative inset-y-0 left-0 z-40 w-72 max-w-[85vw] md:w-56
            bg-slate-800 text-white flex flex-col shrink-0
            transform transition-transform duration-200 ease-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <div className="p-3 border-b border-slate-700 shrink-0">
            <div className="flex items-center min-h-10">
              <CompanyLogo variant="dark" />
            </div>
          </div>
          <div className="p-4 border-b border-slate-700 flex items-center gap-3 min-h-[3.5rem]">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0 min-h-11 min-w-11 text-slate-300 hover:text-white hover:bg-slate-700"
              onClick={closeSidebar}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10 shrink-0 border border-slate-600">
              <AvatarImage src={user.avatarUrl || undefined} alt="" />
              <AvatarFallback className="bg-slate-700 text-slate-200 text-sm">
                {(user.fullName || user.username).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{user.fullName || user.username}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
          <nav className="p-2 flex-1 overflow-y-auto">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <a
                  onClick={closeSidebar}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    location === href ? "bg-primary text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </a>
              </Link>
            ))}
          </nav>
          <div className="p-2 border-t border-slate-700">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </Button>
          </div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 flex items-center gap-3 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] bg-slate-100 border-b border-slate-200 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 min-h-11 min-w-11"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6 text-slate-700" />
            </Button>
            <CompanyLogo variant="light" />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
