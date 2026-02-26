import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { getAuthMe, staffJson } from "@/lib/api";
import type { StaffUser } from "@/lib/api";
import { FileText, Target, Calendar, TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { useMonthlyTargetPopup, useConveyancePolicyPopup } from "./staff-layout";

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
  const [user, setUser] = useState<StaffUser | null>(null);
  const [data, setData] = useState<MyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openMonthlyTargetPopup } = useMonthlyTargetPopup() ?? {};
  const { openConveyancePolicyPopup } = useConveyancePolicyPopup() ?? {};

  useEffect(() => {
    getAuthMe().then((res) => setUser(res?.user ?? null));
  }, []);

  useEffect(() => {
    setError(null);
    staffJson<MyDashboard>("/staff/my-dashboard")
      .then((d) => { setData(d); setError(null); })
      .catch((err: unknown) => {
        setData(null);
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!data) {
    return (
      <div className="space-y-2">
        <p className="text-slate-500">Failed to load dashboard.</p>
        {error && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 max-w-xl">{error}</p>}
      </div>
    );
  }

  const displayName = user?.fullName || user?.username || "Employee";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
        <p className="text-slate-600 mt-0.5">Employee · Monitor your leads and attendance for {data.monthLabel}</p>
      </div>

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
            <p className="text-xs text-slate-500">{data.daysLogged} days logged (2 or more leads = present)</p>
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
        <CardContent className="space-y-3 text-sm text-slate-600">
          {(openMonthlyTargetPopup || openConveyancePolicyPopup) && (
            <div className="pb-2 border-b border-slate-200 space-y-2">
              {openMonthlyTargetPopup && (
                <>
                  <Button variant="outline" size="sm" onClick={openMonthlyTargetPopup}>
                    <Target className="h-4 w-4 mr-2" />
                    View monthly target
                  </Button>
                  <p className="text-xs text-slate-500">See your live achievement, leads converted, and conveyance.</p>
                </>
              )}
              {openConveyancePolicyPopup && (
                <Button variant="outline" size="sm" onClick={openConveyancePolicyPopup}>
                  Conveyance Policy
                </Button>
              )}
            </div>
          )}
          <p>• <strong>My leads</strong> – Add loan and insurance leads, view your list.</p>
          <p>• <strong>My attendance</strong> – Login/logout and see your attendance history.</p>
          <p>• Add 2 or more loan leads per day to be marked <strong>present</strong>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
