import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { getAuthMe, logout, type StaffUser } from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  User,
  LogOut,
  ClipboardList,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import MonthlyTargetPopup from "@/components/staff/MonthlyTargetPopup";

const path = (base: string, p: string) => (base ? `${base}${p}` : p);

export default function StaffLayout({
  children,
  basePath = "/staff",
}: {
  children: React.ReactNode;
  basePath?: string;
}) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [location] = useLocation();
  const { toast } = useToast();

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
  const nav = [
    ...(isAdmin ? [{ href: path(basePath, "/dashboard"), label: "Dashboard", icon: LayoutDashboard }] : []),
    ...(!isAdmin ? [{ href: path(basePath, "/my-dashboard"), label: "My dashboard", icon: LayoutDashboard }] : []),
    ...(isAdmin ? [{ href: path(basePath, "/employees"), label: "Employees", icon: Users }] : []),
    ...(isAdmin ? [{ href: path(basePath, "/attendance"), label: "Attendance", icon: Calendar }] : []),
    ...(isAdmin ? [{ href: path(basePath, "/leads"), label: "Loan leads", icon: FileText }] : []),
    ...(isAdmin ? [{ href: path(basePath, "/insurance-leads"), label: "Insurance leads", icon: Shield }] : []),
    ...(!isAdmin ? [{ href: path(basePath, "/my-leads"), label: "My leads", icon: ClipboardList }] : []),
    ...(!isAdmin ? [{ href: path(basePath, "/my-attendance"), label: "My attendance", icon: Calendar }] : []),
    { href: path(basePath, "/profile"), label: "Profile", icon: User },
  ];

  return (
    <>
      {!isAdmin && <MonthlyTargetPopup />}
      <div className="min-h-screen flex bg-slate-100">
        <aside className="w-56 bg-slate-800 text-white flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-700 flex items-center gap-3">
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
          <nav className="p-2 flex-1">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <a
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    location === href ? "bg-primary text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
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
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </>
  );
}
