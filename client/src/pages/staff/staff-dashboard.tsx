import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getAuthMe, staffJson } from "@/lib/api";
import type { StaffUser } from "@/lib/api";
import { useMonthlyTargetPopup, useConveyancePolicyPopup } from "./staff-layout";
import { Calendar, Download, Target, TrendingUp, Percent, DollarSign, Car, Activity, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type TeamMemberSummary = {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  monthlyTarget: number;
  leadsThisMonth: number;
  achievementPct: number;
  leadsConverted: number;
};

type AdminKpi = {
  companyTargetYtd: number;
  companyAchievedYtd: number;
  companyTargetMtd: number;
  companyAchievedMtd: number;
  monthLabel: string;
};

type TargetAchievementRow = {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  monthlyTarget: number;
  assignedBudget: number;
  achievedLeads: number;
  achievedBudget: number;
  achievementPct: number;
  leadsConverted: number;
};

type ConveyanceRow = {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  isTeamLead: boolean;
  teamLeadsThisMonth: number;
  achievementPct: number;
  jointVisits: number;
  conveyancePct: number;
};

type ExpenditureData = {
  loans: number;
  miscellaneous: number;
  total: number;
  monthLabel: string;
};

type FtdPeriod = { ftd: number; mtd: number; ytd: number };

type FtdAchieved = {
  loans: {
    logged: FtdPeriod;
    sanctioned: FtdPeriod;
    disbursed: FtdPeriod;
    rejected: FtdPeriod;
  };
  insurance: {
    new: FtdPeriod;
    rollover: FtdPeriod;
    ownRenewal: FtdPeriod;
    nonMotor: FtdPeriod;
    life: FtdPeriod;
    health: FtdPeriod;
  };
};

type AttendanceRow = {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  date: string;
  loginAt: string | null;
  logoutAt: string | null;
  leadsCount: number;
  status: string;
  monthlyTarget?: number;
  leadsThisMonth?: number;
  achievementPct?: number;
};

type Dashboard = {
  today: string;
  employeeCount: number;
  attendanceToday: AttendanceRow[];
  leadsToday: { id: string; employeeId: string; employeeName: string; employeeNumber: string; date: string; customerName: string | null; status: string }[];
  totalClosures: number;
  leadsByEmployee?: { employeeId: string; employeeName: string; employeeNumber: string; count: number }[];
  overallTarget?: number;
  teamLeadsThisMonth?: number;
  achievementPct?: number;
  conveyancePct?: number;
  leaderAssignedBudget?: number;
  teamMembersSummary?: TeamMemberSummary[];
  monthLabel?: string;
  adminKpi?: AdminKpi;
  allEmployeeTargetAchievement?: TargetAchievementRow[];
  conveyanceReport?: ConveyanceRow[];
  expenditure?: ExpenditureData;
  ftdAchieved?: FtdAchieved;
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
  const { openMonthlyTargetPopup } = useMonthlyTargetPopup() ?? {};
  const { openConveyancePolicyPopup } = useConveyancePolicyPopup() ?? {};
  const [loading, setLoading] = useState(true);
  const [targetAchievementSearch, setTargetAchievementSearch] = useState("");
  const [conveyanceSearch, setConveyanceSearch] = useState("");
  const [conveyanceTeamLeadsOnly, setConveyanceTeamLeadsOnly] = useState(false);
  const [exportMonth, setExportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [exporting, setExporting] = useState<string | null>(null);
  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [reportMonthLabel, setReportMonthLabel] = useState<string>("");
  const [targetAchievementRows, setTargetAchievementRows] = useState<TargetAchievementRow[]>([]);
  const [conveyanceRows, setConveyanceRows] = useState<ConveyanceRow[]>([]);
  const [expenditureData, setExpenditureData] = useState<ExpenditureData | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [exportRangeMode, setExportRangeMode] = useState<"month" | "custom">("month");
  const [exportFrom, setExportFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [exportTo, setExportTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportsRangeMode, setReportsRangeMode] = useState<"month" | "custom">("month");
  const [reportsFrom, setReportsFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [reportsTo, setReportsTo] = useState(() => new Date().toISOString().slice(0, 10));

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
      if (dashboard?.adminKpi) {
        setTargetAchievementRows(dashboard.allEmployeeTargetAchievement ?? []);
        setConveyanceRows(dashboard.conveyanceReport ?? []);
        setExpenditureData(dashboard.expenditure ?? null);
        setReportMonthLabel(dashboard.adminKpi.monthLabel);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    if (reportsRangeMode === "month") {
      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
      if (reportMonth === currentMonth && data?.adminKpi) {
        setTargetAchievementRows(data.allEmployeeTargetAchievement ?? []);
        setConveyanceRows(data.conveyanceReport ?? []);
        setExpenditureData(data.expenditure ?? null);
        setReportMonthLabel(data.adminKpi.monthLabel);
        return;
      }
      if (reportMonth === currentMonth) return;
    }
    setReportsLoading(true);
    const params = reportsRangeMode === "month"
      ? `month=${reportMonth}`
      : `from=${reportsFrom}&to=${reportsTo}`;
    Promise.all([
      staffJson<{ month?: string; monthLabel: string; rows: TargetAchievementRow[] }>(`/staff/reports/target-achievement?${params}`).catch(() => ({ monthLabel: "", rows: [] })),
      staffJson<{ month?: string; monthLabel: string; rows: ConveyanceRow[] }>(`/staff/reports/conveyance?${params}`).catch(() => ({ monthLabel: "", rows: [] })),
      staffJson<{ month?: string; monthLabel: string; loans: number; miscellaneous: number; total: number }>(`/staff/reports/expenditure?${params}`).catch(() => null),
    ]).then(([ta, conv, exp]) => {
      setTargetAchievementRows(ta.rows ?? []);
      setConveyanceRows(conv.rows ?? []);
      setReportMonthLabel(ta.monthLabel || conv.monthLabel || (reportsRangeMode === "custom" ? `${reportsFrom} to ${reportsTo}` : ""));
      if (exp) setExpenditureData({ ...exp, monthLabel: exp.monthLabel || "" });
      else setExpenditureData(null);
    }).finally(() => setReportsLoading(false));
  }, [user?.role, reportsRangeMode, reportMonth, reportsFrom, reportsTo, data?.adminKpi]);

  const filteredTargetAchievementRows = useMemo(() => {
    const q = targetAchievementSearch.trim().toLowerCase();
    if (!q) return targetAchievementRows;
    return targetAchievementRows.filter(
      (r) =>
        (r.employeeName || "").toLowerCase().includes(q) ||
        (r.employeeNumber || "").toLowerCase().includes(q)
    );
  }, [targetAchievementRows, targetAchievementSearch]);

  const filteredConveyanceRows = useMemo(() => {
    let rows = conveyanceRows;
    if (conveyanceTeamLeadsOnly) rows = rows.filter((r) => r.isTeamLead);
    const q = conveyanceSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.employeeName || "").toLowerCase().includes(q) ||
        (r.employeeNumber || "").toLowerCase().includes(q)
    );
  }, [conveyanceRows, conveyanceSearch, conveyanceTeamLeadsOnly]);

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!data) return <p className="text-slate-500">Failed to load dashboard.</p>;

  const displayName = user?.fullName || user?.username || "Admin";
  const roleLabel = user?.role === "team_lead" ? "Team Lead" : "Admin";

  async function handleExport(format: "xlsx" | "pdf") {
    setExporting(format);
    try {
      const params = new URLSearchParams({ format });
      if (exportRangeMode === "month") {
        params.set("month", exportMonth);
      } else {
        params.set("from", exportFrom);
        params.set("to", exportTo);
      }
      const url = `/api/staff/export/monthly?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const ext = format === "xlsx" ? "xlsx" : "pdf";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = exportRangeMode === "month"
        ? `monthly-report-${exportMonth}.${ext}`
        : `report-${exportFrom}-to-${exportTo}.${ext}`;
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
      {user?.role === "admin" && data.adminKpi && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-800">Company KPIs</h2>
            {openMonthlyTargetPopup && (
              <Button variant="outline" size="sm" onClick={openMonthlyTargetPopup}>
                <Target className="h-4 w-4 mr-2" />
                Monthly target
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">YTD Budget target</CardTitle>
                <Target className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(data.adminKpi.companyTargetYtd)}
                </p>
                <p className="text-xs text-slate-500">Jan – current month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">YTD Achieved</CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(data.adminKpi.companyAchievedYtd)}
                </p>
                <p className="text-xs text-slate-500">Disbursed / sanctioned</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">MTD Budget target</CardTitle>
                <Target className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(data.adminKpi.companyTargetMtd)}
                </p>
                <p className="text-xs text-slate-500">{data.adminKpi.monthLabel}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">MTD Achieved</CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(data.adminKpi.companyAchievedMtd)}
                </p>
                <p className="text-xs text-slate-500">{data.adminKpi.monthLabel}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {user?.role === "admin" && data.ftdAchieved && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-amber-50/80 border-b border-amber-100/80">
            <CardTitle className="text-base font-semibold text-slate-800">FTD Achieved</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Loan and insurance performance by period — FTD (today), MTD (month-to-date), YTD (year-to-date)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-700 w-[180px]">Metric</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700 tabular-nums">FTD</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700 tabular-nums">MTD</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700 tabular-nums">YTD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <td colSpan={4} className="py-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Loans</td>
                  </tr>
                  {(["logged", "sanctioned", "disbursed", "rejected"] as const).map((key) => (
                    <tr key={key} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4 text-slate-700 capitalize">{key === "logged" ? "Logged" : key}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-medium">{data.ftdAchieved.loans[key].ftd}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-medium">{data.ftdAchieved.loans[key].mtd}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-medium">{data.ftdAchieved.loans[key].ytd}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <td colSpan={4} className="py-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Insurance</td>
                  </tr>
                  {[
                    { key: "new" as const, label: "New" },
                    { key: "rollover" as const, label: "Rollover" },
                    { key: "ownRenewal" as const, label: "Own Renewal" },
                    { key: "nonMotor" as const, label: "Non Motor" },
                    { key: "life" as const, label: "Life" },
                    { key: "health" as const, label: "Health" },
                  ].map(({ key, label }) => (
                    <tr key={key} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4 text-slate-700">{label}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-medium">{data.ftdAchieved.insurance[key].ftd}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-medium">{data.ftdAchieved.insurance[key].mtd}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-medium">{data.ftdAchieved.insurance[key].ytd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.role === "admin" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Reports</h2>
              <p className="text-sm text-slate-600">Target vs achievement, conveyance and expenditure. Choose by month or custom date range.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {openConveyancePolicyPopup && (
                <Button variant="outline" size="sm" onClick={openConveyancePolicyPopup}>
                  Conveyance policy
                </Button>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="reports-mode-month"
                    name="reports-mode"
                    checked={reportsRangeMode === "month"}
                    onChange={() => setReportsRangeMode("month")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="reports-mode-month" className="cursor-pointer font-normal text-sm">Month</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="reports-mode-custom"
                    name="reports-mode"
                    checked={reportsRangeMode === "custom"}
                    onChange={() => setReportsRangeMode("custom")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="reports-mode-custom" className="cursor-pointer font-normal text-sm">Custom dates</Label>
                </div>
              </div>
              {reportsRangeMode === "month" ? (
                <div className="flex items-center gap-2">
                  <Label htmlFor="report-month" className="text-sm text-slate-600 shrink-0">Month</Label>
                  <Input
                    id="report-month"
                    type="month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="min-w-[180px] h-10 px-3 text-base [color-scheme:light]"
                    style={{ colorScheme: "light" }}
                    aria-label="Select month for reports"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="reports-from" className="text-sm text-slate-600 shrink-0">From</Label>
                    <Input
                      id="reports-from"
                      type="date"
                      value={reportsFrom}
                      onChange={(e) => setReportsFrom(e.target.value)}
                      className="min-w-[140px] h-10 text-base [color-scheme:light]"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="reports-to" className="text-sm text-slate-600 shrink-0">To</Label>
                    <Input
                      id="reports-to"
                      type="date"
                      value={reportsTo}
                      onChange={(e) => setReportsTo(e.target.value)}
                      className="min-w-[140px] h-10 text-base [color-scheme:light]"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          {reportsLoading && (
            <p className="text-sm text-slate-500">Loading reports…</p>
          )}
        </>
      )}

      {user?.role === "admin" && !reportsLoading && (
        <>
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Every employee target vs achievement
                  </CardTitle>
                  <CardDescription>
                    {reportMonthLabel || reportMonth} – Target, achieved leads, achieved budget and achievement %.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Search className="h-4 w-4 text-slate-500" aria-hidden />
                  <Input
                    type="search"
                    placeholder="Filter by name or ID..."
                    value={targetAchievementSearch}
                    onChange={(e) => setTargetAchievementSearch(e.target.value)}
                    className="w-full sm:w-[200px] h-9"
                    aria-label="Filter target vs achievement by employee name or ID"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left p-3 font-medium">ID</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-right p-3 font-medium">Target (leads)</th>
                      <th className="text-right p-3 font-medium">Budget</th>
                      <th className="text-right p-3 font-medium">Achieved (leads)</th>
                      <th className="text-right p-3 font-medium">Achieved (₹)</th>
                      <th className="text-right p-3 font-medium">Achievement %</th>
                      <th className="text-right p-3 font-medium">Converted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTargetAchievementRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-500">
                          {targetAchievementRows.length === 0 ? "No data for this month." : "No employees match the filter."}
                        </td>
                      </tr>
                    ) : (
                      filteredTargetAchievementRows.map((r) => (
                        <tr key={r.employeeId} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="p-3 font-medium">{r.employeeNumber || "—"}</td>
                          <td className="p-3">{r.employeeName}</td>
                          <td className="p-3 text-right">{r.monthlyTarget}</td>
                          <td className="p-3 text-right">{r.assignedBudget > 0 ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(r.assignedBudget) : "—"}</td>
                          <td className="p-3 text-right">{r.achievedLeads}</td>
                          <td className="p-3 text-right">{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(r.achievedBudget)}</td>
                          <td className="p-3 text-right">{r.achievementPct}%</td>
                          <td className="p-3 text-right">{r.leadsConverted}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Conveyance report
                  </CardTitle>
                  <CardDescription>
                    {reportMonthLabel || reportMonth} – Team lead conveyance eligibility (joint visits &amp; team achievement).
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-slate-500" aria-hidden />
                    <Input
                      type="search"
                      placeholder="Filter by name or ID..."
                      value={conveyanceSearch}
                      onChange={(e) => setConveyanceSearch(e.target.value)}
                      className="w-full sm:w-[200px] h-9"
                      aria-label="Filter conveyance report by employee name or ID"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <Checkbox
                      checked={conveyanceTeamLeadsOnly}
                      onCheckedChange={(v) => setConveyanceTeamLeadsOnly(v === true)}
                      aria-label="Show team leads only"
                    />
                    Team leads only
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left p-3 font-medium">ID</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-center p-3 font-medium">Team lead</th>
                      <th className="text-right p-3 font-medium">Team leads (month)</th>
                      <th className="text-right p-3 font-medium">Achievement %</th>
                      <th className="text-right p-3 font-medium">Joint visits</th>
                      <th className="text-right p-3 font-medium">Conveyance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConveyanceRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-500">
                          {conveyanceRows.length === 0 ? "No data." : "No employees match the filter."}
                        </td>
                      </tr>
                    ) : (
                      filteredConveyanceRows.map((r) => (
                        <tr key={r.employeeId} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="p-3 font-medium">{r.employeeNumber || "—"}</td>
                          <td className="p-3">{r.employeeName}</td>
                          <td className="p-3 text-center">{r.isTeamLead ? "Yes" : "—"}</td>
                          <td className="p-3 text-right">{r.isTeamLead ? r.teamLeadsThisMonth : "—"}</td>
                          <td className="p-3 text-right">{r.isTeamLead ? `${r.achievementPct}%` : "—"}</td>
                          <td className="p-3 text-right">{r.isTeamLead ? r.jointVisits : "—"}</td>
                          <td className="p-3 text-right font-medium">{r.conveyancePct > 0 ? `${r.conveyancePct}%` : "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Expenditure
              </CardTitle>
              <CardDescription>
                {expenditureData?.monthLabel || reportMonth} – Loans (disbursed/sanctioned) and miscellaneous (insurance).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-slate-50/50 p-4">
                  <p className="text-sm font-medium text-slate-600">Loans</p>
                  <p className="text-xl font-bold mt-1">
                    {expenditureData ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(expenditureData.loans) : "—"}
                  </p>
                </div>
                <div className="rounded-lg border bg-slate-50/50 p-4">
                  <p className="text-sm font-medium text-slate-600">Miscellaneous</p>
                  <p className="text-xl font-bold mt-1">
                    {expenditureData ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(expenditureData.miscellaneous) : "—"}
                  </p>
                </div>
                <div className="rounded-lg border bg-primary/5 p-4">
                  <p className="text-sm font-medium text-slate-600">Total</p>
                  <p className="text-xl font-bold mt-1">
                    {expenditureData ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(expenditureData.total) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {user?.role === "team_lead" && (data.overallTarget != null || (data.leaderAssignedBudget != null && data.leaderAssignedBudget > 0)) && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Team targets &amp; achievement</h2>
              <p className="text-sm text-slate-600 -mt-2 mb-1">Your assigned budget and lead target from admin. Individual target, achievement and conveyance for your team this month. Add members in My team to set targets.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {openMonthlyTargetPopup && (
                <Button variant="outline" size="sm" onClick={openMonthlyTargetPopup}>
                  <Target className="h-4 w-4 mr-2" />
                  View monthly target
                </Button>
              )}
              {openConveyancePolicyPopup && (
                <Button variant="outline" size="sm" onClick={openConveyancePolicyPopup}>
                  Conveyance Policy
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Your assigned budget (₹)</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {data.leaderAssignedBudget != null && data.leaderAssignedBudget > 0
                  ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(data.leaderAssignedBudget)
                  : "—"}
              </p>
              <p className="text-xs text-slate-500">{data.monthLabel ?? "This month"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overall target (leads)</CardTitle>
              <Target className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.overallTarget ?? "—"}</p>
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
              <p className="text-xs text-slate-500">{data.teamLeadsThisMonth ?? 0} of {data.overallTarget ?? 0} leads</p>
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
        </>
      )}

      {user?.role === "team_lead" && data.teamMembersSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Individual target</CardTitle>
            <CardDescription>Per-member target, leads this month, achievement and converted count for {data.monthLabel ?? "this month"}.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.teamMembersSummary.length === 0 ? (
              <p className="text-slate-500 py-4">No team members yet. Add employees in My team to see individual targets here.</p>
            ) : (
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
                    {data.teamMembersSummary.map((m) => (
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
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export monthly data
          </CardTitle>
          <CardDescription>Download employee data (attendance, leads, leave) in Excel or PDF. Choose by month or custom date range.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="export-mode-month"
                name="export-mode"
                checked={exportRangeMode === "month"}
                onChange={() => setExportRangeMode("month")}
                className="h-4 w-4"
              />
              <Label htmlFor="export-mode-month" className="cursor-pointer font-normal">By month</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="export-mode-custom"
                name="export-mode"
                checked={exportRangeMode === "custom"}
                onChange={() => setExportRangeMode("custom")}
                className="h-4 w-4"
              />
              <Label htmlFor="export-mode-custom" className="cursor-pointer font-normal">Custom dates</Label>
            </div>
          </div>
          {exportRangeMode === "month" ? (
            <div className="space-y-2">
              <Label htmlFor="export-month">Month</Label>
              <div className="relative flex items-center overflow-visible">
                <Calendar className="absolute left-3 h-4 w-4 text-slate-500 pointer-events-none" aria-hidden />
                <Input
                  id="export-month"
                  type="month"
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  className="min-w-[180px] h-10 pl-10 pr-4 py-2.5 text-base [color-scheme:light]"
                  style={{ colorScheme: "light" }}
                  aria-label="Select month for export"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="export-from">From date</Label>
                <Input
                  id="export-from"
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  className="min-w-[160px] h-10 text-base [color-scheme:light]"
                  style={{ colorScheme: "light" }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="export-to">To date</Label>
                <Input
                  id="export-to"
                  type="date"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="min-w-[160px] h-10 text-base [color-scheme:light]"
                  style={{ colorScheme: "light" }}
                />
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => handleExport("xlsx")} disabled={!!exporting} variant="outline">
              {exporting === "xlsx" ? "Exporting…" : "Download Excel"}
            </Button>
            <Button onClick={() => handleExport("pdf")} disabled={!!exporting}>
              {exporting === "pdf" ? "Exporting…" : "Download PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
