import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { staffJson } from "@/lib/api";
import { logout } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, FileText, CheckCircle, TrendingUp } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  BarChartCard,
  RadialProgressCard,
  DonutChartCard,
} from "@/components/dashboard/ChartsSection";
import { Timeline, type TimelineItem } from "@/components/dashboard/Timeline";
import type { StaffUser } from "@/lib/api";

const basePath = "/staff";

type DashboardData = {
  today: string;
  employeeCount: number;
  attendanceToday: {
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    date: string;
    loginAt: string | null;
    logoutAt: string | null;
    leadsCount: number;
    status: string;
  }[];
  leadsToday: { id: string; employeeId: string; date: string }[];
  totalClosures: number;
  leadsLast14Days?: { date: string; count: number }[];
  leadsByStatus?: { status: string; count: number }[];
  leadsByEmployee?: { employeeId: string; employeeName: string; employeeNumber: string; count: number }[];
};

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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffJson<DashboardData>("/staff/dashboard")
      .then(setData)
      .catch(() => {
        toast({ title: "Failed to load dashboard", variant: "destructive" });
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleLogout() {
    try {
      await logout();
      window.location.href = bp + "/login";
    } catch {
      toast({ title: "Logout failed", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <p className="text-slate-500">Loading dashboard…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <p className="text-slate-500">Failed to load dashboard.</p>
      </div>
    );
  }

  const present = data.attendanceToday.filter((a) => (a.status || "").toLowerCase() === "present").length;
  const totalLeads30 = (data.leadsByEmployee ?? []).reduce((s, e) => s + e.count, 0);
  const completionPct = totalLeads30 > 0 ? Math.round((data.totalClosures / totalLeads30) * 100) : 0;
  const activeStaff = (data.leadsByEmployee ?? []).length;

  const timelineItems: TimelineItem[] = data.attendanceToday.map((a) => {
    const inTime = a.loginAt ? new Date(a.loginAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
    const outTime = a.logoutAt ? new Date(a.logoutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
    const desc = [inTime && `In ${inTime}`, outTime && `Out ${outTime}`].filter(Boolean).join(" · ") || "No log";
    return {
      id: a.employeeId + a.date,
      title: a.employeeName || a.employeeNumber || a.employeeId,
      desc: `${desc} · ${a.leadsCount} leads · ${a.status}`,
      time: data.today,
    };
  });

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
                    title="Employees"
                    value={data.employeeCount}
                    delay={0}
                    icon={<Users className="h-5 w-5" />}
                    light
                    glassShine
                  />
                  <KpiCard
                    title="Present today"
                    value={present}
                    delay={100}
                    icon={<Calendar className="h-5 w-5" />}
                    light
                  />
                  <KpiCard
                    title="Leads today"
                    value={data.leadsToday.length}
                    delay={200}
                    icon={<FileText className="h-5 w-5" />}
                    light
                  />
                  <KpiCard
                    title="Total closures"
                    value={data.totalClosures}
                    delay={300}
                    icon={<CheckCircle className="h-5 w-5" />}
                    light
                  />
                </div>
                <div className="space-y-6">
                  <BarChartCard
                    delay={150}
                    data={data.leadsLast14Days ?? []}
                    title="Leads trend (last 14 days)"
                  />
                  <DonutChartCard
                    delay={250}
                    data={data.leadsByStatus ?? []}
                    title="Leads by status (last 30 days)"
                  />
                </div>
              </div>
              <div className="bg-[#0F172A] p-6 rounded-r-2xl min-h-[60vh] border-l border-slate-700/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <KpiCard
                    title="Leads (30 days)"
                    value={totalLeads30}
                    delay={50}
                    icon={<FileText className="h-5 w-5" />}
                    light={false}
                  />
                  <KpiCard
                    title="Active staff"
                    value={activeStaff}
                    delay={150}
                    icon={<Users className="h-5 w-5" />}
                    light={false}
                  />
                  <KpiCard
                    title="Closure rate"
                    value={completionPct}
                    delay={250}
                    variant="radial"
                    radialPercent={completionPct}
                    icon={<TrendingUp className="h-5 w-5" />}
                    light={false}
                  />
                  <KpiCard
                    title="Total closures"
                    value={data.totalClosures}
                    delay={350}
                    icon={<CheckCircle className="h-5 w-5" />}
                    light={false}
                  />
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <RadialProgressCard
                    delay={200}
                    value={completionPct}
                    title="Closure rate (last 30 days)"
                  />
                  <Timeline delay={300} items={timelineItems} title="Attendance today" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
