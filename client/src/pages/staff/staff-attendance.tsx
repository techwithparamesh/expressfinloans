import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { staffJson } from "@/lib/api";

type Log = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  date: string;
  loginAt: string | null;
  logoutAt: string | null;
  leadsCount: number;
  status: string;
};

type EmployeeOption = {
  id: string;
  fullName: string | null;
  employeeNumber: string | null;
  username: string;
};

const today = () => new Date().toISOString().slice(0, 10);

function fetchEmployees() {
  return staffJson<EmployeeOption[]>("/staff/employees").catch(() => []);
}

export default function StaffAttendance() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(getMonthStart());
  const [to, setTo] = useState(today());

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
          <CardTitle>Filters</CardTitle>
          <CardDescription>View attendance by date range and staff member.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
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
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
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
                  <th className="text-left py-2 px-2 min-w-[56px]">Leads</th>
                  <th className="text-left py-2 px-2 min-w-[88px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
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

function getMonthStart(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}
