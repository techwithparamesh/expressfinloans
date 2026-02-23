import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { staffJson } from "@/lib/api";
import { Users, Calendar, FileText, CheckCircle } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

type Dashboard = {
  today: string;
  employeeCount: number;
  attendanceToday: { employeeId: string; employeeName: string; employeeNumber: string; date: string; loginAt: string | null; logoutAt: string | null; leadsCount: number; status: string }[];
  leadsToday: { id: string; employeeId: string; employeeName: string; employeeNumber: string; date: string; customerName: string | null; status: string }[];
  totalClosures: number;
  leadsByEmployee?: { employeeId: string; employeeName: string; employeeNumber: string; count: number }[];
};

export default function StaffDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffJson<Dashboard>("/staff/dashboard")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!data) return <p className="text-slate-500">Failed to load dashboard.</p>;

  const present = data.attendanceToday.filter((a) => a.status === "present").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
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
            <p className="text-xs text-slate-500">2+ leads = present</p>
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

      {data.leadsByEmployee && data.leadsByEmployee.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Leads by staff</CardTitle>
            <CardDescription>Lead count per employee. Last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Leads" } }} className="h-[240px] w-full">
              <BarChart
                data={data.leadsByEmployee.map((e) => ({ name: e.employeeNumber || e.employeeName || e.employeeId, count: e.count }))}
                layout="vertical"
                margin={{ left: 12, right: 12 }}
              >
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={48} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Leads by staff</CardTitle>
            <CardDescription>Lead count per employee. Last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 py-8 text-center">No leads in the last 30 days.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Attendance today ({data.today})</CardTitle>
          <CardDescription>Login/logout and status (present = 2+ leads).</CardDescription>
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
