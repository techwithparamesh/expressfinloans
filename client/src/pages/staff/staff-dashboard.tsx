import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getAuthMe, staffJson } from "@/lib/api";
import type { StaffUser } from "@/lib/api";
import { Users, Calendar, FileText, CheckCircle, Filter, Download, Target, TrendingUp, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

type TeamMemberSummary = {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  monthlyTarget: number;
  leadsThisMonth: number;
  achievementPct: number;
  leadsConverted: number;
};

type Dashboard = {
  today: string;
  employeeCount: number;
  attendanceToday: { employeeId: string; employeeName: string; employeeNumber: string; date: string; loginAt: string | null; logoutAt: string | null; leadsCount: number; status: string }[];
  leadsToday: { id: string; employeeId: string; employeeName: string; employeeNumber: string; date: string; customerName: string | null; status: string }[];
  totalClosures: number;
  leadsByEmployee?: { employeeId: string; employeeName: string; employeeNumber: string; count: number }[];
  overallTarget?: number;
  teamLeadsThisMonth?: number;
  achievementPct?: number;
  conveyancePct?: number;
  teamMembersSummary?: TeamMemberSummary[];
  monthLabel?: string;
};

type EmployeeOption = {
  id: string;
  fullName: string | null;
  employeeNumber: string | null;
  username: string;
};

export default function StaffDashboard() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [staffChartFilter, setStaffChartFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [exportMonth, setExportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    getAuthMe().then((res) => setUser(res?.user ?? null));
  }, []);

  useEffect(() => {
    Promise.all([
      staffJson<Dashboard>("/staff/dashboard").catch(() => null),
      staffJson<EmployeeOption[]>("/staff/employees").catch(() => []),
    ]).then(([dashboard, empList]) => {
      setData(dashboard ?? null);
      setEmployees(Array.isArray(empList) ? empList : []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!data) return <p className="text-slate-500">Failed to load dashboard.</p>;

  const present = data.attendanceToday.filter((a) => a.status === "present").length;

  // Merge all employees with lead counts (include 0 for those with no leads); fallback to dashboard data if employees list empty
  const countByEmployee = new Map(
    (data.leadsByEmployee ?? []).map((e) => [e.employeeId, e.count])
  );
  const chartDataAll =
    employees.length > 0
      ? employees.map((e) => ({
          employeeId: e.id,
          label: `${e.employeeNumber ?? "—"} · ${e.fullName || e.username}`,
          count: countByEmployee.get(e.id) ?? 0,
        }))
      : (data.leadsByEmployee ?? []).map((e) => ({
          employeeId: e.employeeId,
          label: `${e.employeeNumber || "—"} · ${e.employeeName || e.employeeId}`,
          count: e.count,
        }));
  const chartDataFiltered =
    staffChartFilter === "all"
      ? chartDataAll
      : chartDataAll.filter((r) => r.employeeId === staffChartFilter);
  const hasChartData = chartDataAll.length > 0;
  const chartHeight =
    chartDataFiltered.length <= 2 ? 160 : Math.min(400, Math.max(240, chartDataFiltered.length * 48));

  const displayName = user?.fullName || user?.username || "Admin";
  const roleLabel = user?.role === "team_lead" ? "Team Lead" : "Admin";

  async function handleExport(format: "xlsx" | "pdf") {
    setExporting(format);
    try {
      const url = `/api/staff/export/monthly?format=${format}&month=${exportMonth}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const ext = format === "xlsx" ? "xlsx" : "pdf";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `monthly-report-${exportMonth}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // ignore
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
        <p className="text-slate-600 mt-0.5">{roleLabel} · Dashboard</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.employeeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present today</CardTitle>
            <Calendar className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{present}</p>
            <p className="text-xs text-slate-500">2 or more leads = present</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leads today</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.leadsToday.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total closures</CardTitle>
            <CheckCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.totalClosures}</p>
          </CardContent>
        </Card>
      </div>

      {user?.role === "team_lead" && data.overallTarget != null && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overall target</CardTitle>
              <Target className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.overallTarget}</p>
              <p className="text-xs text-slate-500">{data.monthLabel ?? "This month"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Achievement</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.achievementPct ?? 0}%</p>
              <p className="text-xs text-slate-500">{data.teamLeadsThisMonth ?? 0} of {data.overallTarget} leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conveyance</CardTitle>
              <Percent className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.conveyancePct ?? 0}%</p>
              <p className="text-xs text-slate-500">Based on target &amp; converted leads</p>
            </CardContent>
          </Card>
        </div>
      )}

      {user?.role === "team_lead" && (data.teamMembersSummary?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Individual target</CardTitle>
            <CardDescription>Per-member target, leads this month, achievement and converted count for {data.monthLabel ?? "this month"}.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-3 font-medium min-w-[100px]">Employee ID</th>
                    <th className="text-left p-3 font-medium min-w-[140px]">Name</th>
                    <th className="text-left p-3 font-medium min-w-[90px]">Target</th>
                    <th className="text-left p-3 font-medium min-w-[100px]">Leads this month</th>
                    <th className="text-left p-3 font-medium min-w-[90px]">Achievement %</th>
                    <th className="text-left p-3 font-medium min-w-[80px]">Converted</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.teamMembersSummary ?? []).map((m) => (
                    <tr key={m.employeeId} className="border-b last:border-0">
                      <td className="p-3">{m.employeeNumber || "—"}</td>
                      <td className="p-3">{m.employeeName}</td>
                      <td className="p-3">{m.monthlyTarget}</td>
                      <td className="p-3">{m.leadsThisMonth}</td>
                      <td className="p-3">{m.achievementPct}%</td>
                      <td className="p-3">{m.leadsConverted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export monthly data
          </CardTitle>
          <CardDescription>Download employee monthly data (attendance, leads, leave) in Excel or PDF.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Month</Label>
            <Input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <Button onClick={() => handleExport("xlsx")} disabled={!!exporting} variant="outline">
            {exporting === "xlsx" ? "Exporting…" : "Download Excel"}
          </Button>
          <Button onClick={() => handleExport("pdf")} disabled={!!exporting}>
            {exporting === "pdf" ? "Exporting…" : "Download PDF"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Leads by staff</CardTitle>
              <CardDescription>Lead count per employee. Last 30 days.</CardDescription>
            </div>
            {employees.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500 shrink-0" />
                <Label htmlFor="staff-chart-filter" className="text-sm text-slate-600">
                  View:
                </Label>
                <Select
                  value={staffChartFilter}
                  onValueChange={setStaffChartFilter}
                >
                  <SelectTrigger id="staff-chart-filter" className="w-[220px]">
                    <SelectValue placeholder="All staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All staff</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.employeeNumber ?? "—"} · {e.fullName || e.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasChartData ? (
            <ChartContainer
              config={{ count: { label: "Leads" }, label: { label: "Employee" } }}
              className="w-full"
              style={{ height: chartHeight }}
            >
              <BarChart
                data={chartDataFiltered.map((r) => ({ name: r.label, count: r.count }))}
                layout="vertical"
                margin={{ left: 8, right: 24, top: 8, bottom: 8 }}
              >
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={200}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#16a34a" radius={[0, 4, 4, 0]} name="Leads" />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-slate-500 py-8 text-center">No employees or no leads in the last 30 days.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance today ({data.today})</CardTitle>
          <CardDescription>Login/logout and status (present = 2 or more leads).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 sticky left-0 z-10 bg-white min-w-[72px]">Employee ID</th>
                  <th className="text-left py-2 px-2 sticky left-[72px] z-10 bg-white min-w-[120px]">Employee name</th>
                  <th className="text-left py-2 px-2 min-w-[70px]">Login</th>
                  <th className="text-left py-2 px-2 min-w-[70px]">Logout</th>
                  <th className="text-left py-2 px-2 min-w-[56px]">Leads</th>
                  <th className="text-left py-2 px-2 min-w-[88px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.attendanceToday.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No attendance recorded for today yet.
                    </td>
                  </tr>
                ) : (
                  data.attendanceToday.map((a) => (
                    <tr key={a.employeeId + a.date} className="border-b">
                      <td className="py-2 px-2 sticky left-0 z-10 bg-white font-medium">{a.employeeNumber || "—"}</td>
                      <td className="py-2 px-2 sticky left-[72px] z-10 bg-white">{a.employeeName || a.employeeId}</td>
                      <td className="py-2 px-2">{a.loginAt ? new Date(a.loginAt).toLocaleTimeString() : "—"}</td>
                      <td className="py-2 px-2">{a.logoutAt ? new Date(a.logoutAt).toLocaleTimeString() : "—"}</td>
                      <td className="py-2 px-2">{a.leadsCount}</td>
                      <td className="py-2 px-2">{a.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
