import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Calendar,
  User,
} from "lucide-react";

const path = (base: string, p: string) => (base ? `${base}${p}` : p);

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Analytics", icon: BarChart3 },
  { href: "/leads", label: "Leads", icon: FileText },
  { href: "/attendance", label: "Attendance", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User },
];

type SidebarProps = {
  basePath?: string;
};

export function Sidebar({ basePath = "/staff" }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-[#F8FAFC] border-r border-slate-200/80">
      <div className="p-5 border-b border-slate-200/80">
        <Link href={path(basePath, "/dashboard")} className="block">
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ExpressFin
          </span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const to = path(basePath, item.href);
          const isActive = location === to || (item.href === "/dashboard" && location === basePath);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={to}>
              <motion.span
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer block ${
                  isActive
                    ? "text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/25"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </span>
              </motion.span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
