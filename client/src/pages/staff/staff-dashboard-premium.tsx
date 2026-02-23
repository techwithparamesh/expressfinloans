import { useState } from "react";
import { useLocation } from "wouter";
import { logout } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Users, ShoppingBag, Ticket, TrendingUp } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  BarChartCard,
  RadialProgressCard,
  DonutChartCard,
} from "@/components/dashboard/ChartsSection";
import { Timeline } from "@/components/dashboard/Timeline";
import type { StaffUser } from "@/lib/api";

const basePath = "/staff";

type PremiumDashboardProps = {
  user: StaffUser;
  basePath?: string;
};

export default function StaffDashboardPremium({
  user,
  basePath: bp = basePath,
}: PremiumDashboardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [themeTransition, setThemeTransition] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      window.location.href = bp + "/login";
    } catch {
      toast({ title: "Logout failed", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <Sidebar basePath={bp} />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-200/30 via-purple-100/20 to-transparent rounded-full blur-3xl [animation:dashboard-mesh_8s_ease-in-out_infinite]"
            style={{ width: "80%", height: "80%" }}
          />
        </div>
        <Topbar title="Dashboard" user={user} onLogout={handleLogout} />
        <main className="flex-1 relative z-10 p-6 overflow-auto">
          <div className="relative">
            <div
              className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-500 ${themeTransition ? "opacity-100" : "opacity-0"}`}
              style={{
                background: "linear-gradient(105deg, transparent 0%, transparent 48%, rgba(15, 23, 42, 0.03) 50%, transparent 52%, transparent 100%)",
                animation: "dashboard-divider 1.5s ease-out",
              }}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 relative">
              <div
                className="absolute top-0 bottom-0 w-px lg:block hidden z-10 pointer-events-none"
                style={{
                  left: "50%",
                  transform: "translateX(-50%) rotate(-2deg)",
                  background: "linear-gradient(180deg, transparent, rgba(99, 102, 241, 0.3) 20%, rgba(139, 92, 246, 0.4) 50%, rgba(99, 102, 241, 0.3) 80%, transparent)",
                  animation: "dashboard-divider 2s ease-out both",
                }}
              />
              <div
                className="bg-[#F8FAFC] p-6 rounded-l-2xl min-h-[60vh]"
                onMouseEnter={() => setThemeTransition(true)}
                onMouseLeave={() => setThemeTransition(false)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <KpiCard
                    title="Subscribers"
                    value={1248}
                    delay={0}
                    icon={<Users className="h-5 w-5" />}
                    light
                    glassShine
                  />
                  <KpiCard
                    title="Orders Received"
                    value={386}
                    delay={100}
                    icon={<ShoppingBag className="h-5 w-5" />}
                    light
                  />
                  <KpiCard
                    title="Completed Tickets"
                    value={83}
                    delay={200}
                    variant="radial"
                    radialPercent={83}
                    icon={<Ticket className="h-5 w-5" />}
                    light
                  />
                  <KpiCard
                    title="Revenue"
                    value={9240}
                    delay={300}
                    variant="trend"
                    trendUp
                    icon={<TrendingUp className="h-5 w-5" />}
                    light
                  />
                </div>
                <div className="space-y-6">
                  <BarChartCard delay={150} />
                  <DonutChartCard delay={250} />
                </div>
              </div>
              <div className="bg-[#0F172A] p-6 rounded-r-2xl min-h-[60vh] border-l border-slate-700/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <KpiCard
                    title="Active Users"
                    value={562}
                    delay={50}
                    icon={<Users className="h-5 w-5" />}
                    light={false}
                  />
                  <KpiCard
                    title="Pending"
                    value={28}
                    delay={150}
                    icon={<Ticket className="h-5 w-5" />}
                    light={false}
                  />
                  <KpiCard
                    title="Conversion"
                    value={12}
                    delay={250}
                    variant="radial"
                    radialPercent={67}
                    icon={<TrendingUp className="h-5 w-5" />}
                    light={false}
                  />
                  <KpiCard
                    title="Growth"
                    value={18}
                    delay={350}
                    variant="trend"
                    trendUp
                    icon={<TrendingUp className="h-5 w-5" />}
                    light={false}
                  />
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <RadialProgressCard delay={200} />
                  <Timeline delay={300} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
