import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const today = () => new Date().toISOString().slice(0, 10);

export default function StaffAttendance() {
  const [logs, setLogs] = useState<Log[]>([]);
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

  useEffect(() => load(), [from, to]);

  if (loading && logs.length === 0) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>View attendance by date range.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
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
          <CardDescription>Login, logout, leads count, status (present = 2+ leads).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Employee name</th>
                  <th className="text-left py-2">Employee ID</th>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Login</th>
                  <th className="text-left py-2">Logout</th>
                  <th className="text-left py-2">Leads</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="py-2">{l.employeeName || l.employeeId}</td>
                    <td className="py-2">{l.employeeNumber || "—"}</td>
                    <td className="py-2">{l.date}</td>
                    <td className="py-2">{l.loginAt ? new Date(l.loginAt).toLocaleTimeString() : "—"}</td>
                    <td className="py-2">{l.logoutAt ? new Date(l.logoutAt).toLocaleTimeString() : "—"}</td>
                    <td className="py-2">{l.leadsCount}</td>
                    <td className="py-2">{l.status}</td>
                  </tr>
                ))}
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
