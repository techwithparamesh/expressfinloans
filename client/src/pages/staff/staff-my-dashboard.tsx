import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { staffJson } from "@/lib/api";
import { FileText, Target, Calendar, TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

type MyDashboard = {
  monthLabel: string;
  leadsThisMonth: number;
  monthTarget: number;
  achievementPct: number;
  daysPresent: number;
  daysLogged: number;
  leadsLast7Days: { date: string; count: number }[];
};

export default function StaffMyDashboard() {
  const [data, setData] = useState<MyDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffJson<MyDashboard>("/staff/my-dashboard")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!data) return <p className="text-slate-500">Failed to load dashboard.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My dashboard</h1>
      <p className="text-slate-600">Monitor your leads and attendance for {data.monthLabel}.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leads this month</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.leadsThisMonth}</p>
            <p className="text-xs text-slate-500">{data.monthLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly target</CardTitle>
            <Target className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.monthTarget}</p>
            <p className="text-xs text-slate-500">Allocated by admin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Achievement</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.achievementPct}%</p>
            <p className="text-xs text-slate-500">{data.leadsThisMonth} of {data.monthTarget} leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.daysPresent} days present</p>
            <p className="text-xs text-slate-500">{data.daysLogged} days logged (2+ leads = present)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My leads – last 7 days</CardTitle>
          <CardDescription>Your daily lead count.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.leadsLast7Days && data.leadsLast7Days.length > 0 ? (
            <ChartContainer config={{ count: { label: "Leads" }, date: { label: "Date" } }} className="h-[200px] w-full">
              <BarChart data={data.leadsLast7Days} margin={{ left: 12, right: 12 }}>
                <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5)} />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-slate-500 py-8 text-center">No leads in the last 7 days.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
          <CardDescription>Add leads and track attendance from the menu.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          <p>• <strong>My leads</strong> – Add loan and insurance leads, view your list.</p>
          <p>• <strong>My attendance</strong> – Login/logout and see your attendance history.</p>
          <p>• Add 2+ loan leads per day to be marked <strong>present</strong>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
