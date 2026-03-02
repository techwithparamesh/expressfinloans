import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { staffJson } from "@/lib/api";
import { Calendar } from "lucide-react";

type Log = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  date: string;
  loginAt: string | null;
  logoutAt: string | null;
  loginLocation: string | null;
  logoutLocation?: string | null;
  logout_location?: string | null;
  leadsCount: number;
  status: string;
};

type EmployeeOption = {
  id: string;
  fullName: string | null;
  employeeNumber: string | null;
  username: string;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

function getMonthStart(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function fetchEmployees() {
  return staffJson<EmployeeOption[]>("/staff/employees").catch(() => []);
}

export default function StaffAttendance() {
  const [location] = useLocation();
  const [logs, setLogs] = useState<Log[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(getMonthStart());
  const [to, setTo] = useState(todayStr());

  useEffect(() => {
    const qs = location.includes("?") ? location.slice(location.indexOf("?")) : "";
    const params = new URLSearchParams(qs);
    const fromParam = params.get("from");
    const toParam = params.get("to");
    if (fromParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam)) setFrom(fromParam);
    if (toParam && /^\d{4}-\d{2}-\d{2}$/.test(toParam)) setTo(toParam);
  }, [location]);

  function load() {
    setLoading(true);
    staffJson<Log[]>("/staff/attendance?from=" + from + "&to=" + to)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchEmployees().then(setEmployees);
  }, []);

  useEffect(() => load(), [from, to]);

  const filteredLogs = employeeId
    ? logs.filter((l) => l.employeeId === employeeId)
    : logs;

  if (loading && logs.length === 0) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Track employee attendance for any date range. Pick a preset or choose custom From / To dates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="att-from">From date</Label>
              <Input
                id="att-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="min-w-[160px] h-10 text-base [color-scheme:light]"
                style={{ colorScheme: "light" }}
                aria-label="From date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="att-to">To date</Label>
              <Input
                id="att-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="min-w-[160px] h-10 text-base [color-scheme:light]"
                style={{ colorScheme: "light" }}
                aria-label="To date"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFrom(getMonthStart());
                  setTo(todayStr());
                }}
              >
                This month
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFrom(getDaysAgo(6));
                  setTo(todayStr());
                }}
              >
                Last 7 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFrom(getDaysAgo(29));
                  setTo(todayStr());
                }}
              >
                Last 30 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const t = todayStr();
                  setFrom(t);
                  setTo(t);
                }}
              >
                Today
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Staff member</Label>
            <Select value={employeeId || "all"} onValueChange={(v) => setEmployeeId(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[220px]">
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
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
          <CardDescription>
            {employeeId
              ? `Showing attendance for ${employees.find((e) => e.id === employeeId)?.fullName || employees.find((e) => e.id === employeeId)?.username || "selected staff"}. Total: ${filteredLogs.length} log${filteredLogs.length !== 1 ? "s" : ""}.`
              : `Login, logout, leads count, status (present = 2 or more leads). Total: ${filteredLogs.length} log${filteredLogs.length !== 1 ? "s" : ""}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 sticky left-0 z-10 bg-white min-w-[72px]">Employee ID</th>
                  <th className="text-left py-2 px-2 sticky left-[72px] z-10 bg-white min-w-[120px]">Employee name</th>
                  <th className="text-left py-2 px-2 min-w-[96px]">Date</th>
                  <th className="text-left py-2 px-2 min-w-[70px]">Login</th>
                  <th className="text-left py-2 px-2 min-w-[70px]">Logout</th>
                  <th className="text-left py-2 px-2 min-w-[140px]">Login loc</th>
                  <th className="text-left py-2 px-2 min-w-[140px]">Logout loc</th>
                  <th className="text-left py-2 px-2 min-w-[56px]">Leads</th>
                  <th className="text-left py-2 px-2 min-w-[88px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      {employeeId ? "No attendance for this staff in the selected date range." : "No attendance recorded for this date range."}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className="py-2 px-2 sticky left-0 z-10 bg-white font-medium">{l.employeeNumber || "—"}</td>
                      <td className="py-2 px-2 sticky left-[72px] z-10 bg-white">{l.employeeName || l.employeeId}</td>
                      <td className="py-2 px-2 whitespace-nowrap">{l.date}</td>
                      <td className="py-2 px-2">{l.loginAt ? new Date(l.loginAt).toLocaleTimeString() : "—"}</td>
                      <td className="py-2 px-2">{l.logoutAt ? new Date(l.logoutAt).toLocaleTimeString() : "—"}</td>
                      <td className="py-2 px-2 max-w-[180px] truncate" title={l.loginLocation ?? undefined}>{l.loginLocation ?? "—"}</td>
                      <td className="py-2 px-2 max-w-[180px] truncate" title={(l as any).logoutLocation ?? (l as any).logout_location ?? undefined}>{(l as any).logoutLocation ?? (l as any).logout_location ?? "—"}</td>
                      <td className="py-2 px-2">{l.leadsCount}</td>
                      <td className="py-2 px-2">{l.status}</td>
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
