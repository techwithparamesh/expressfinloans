import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { staffJson } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { LogIn, LogOut, Calendar } from "lucide-react";

type Log = {
  id: string;
  date: string;
  loginAt: string | null;
  logoutAt: string | null;
  leadsCount: number;
  status: string;
};

export default function StaffMyAttendance() {
  const { toast } = useToast();
  const [todayLog, setTodayLog] = useState<Log | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  function load() {
    setLoading(true);
    Promise.all([
      staffJson<Log[]>("/staff/attendance/me?from=" + today + "&to=" + today),
      staffJson<Log[]>("/staff/attendance/me?from=" + getMonthStart() + "&to=" + today),
    ])
      .then(([todayList, allList]) => {
        setTodayLog(todayList[0] ?? null);
        setLogs(allList);
      })
      .catch(() => toast({ title: "Failed to load attendance", variant: "destructive" }))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  async function doLogin() {
    setActionLoading(true);
    try {
      const log = await staffJson<Log>("/staff/attendance/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });
      setTodayLog(log);
      toast({ title: "Logged in" });
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  }

  async function doLogout() {
    setActionLoading(true);
    try {
      const log = await staffJson<Log>("/staff/attendance/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });
      setTodayLog(log);
      toast({ title: "Logged out" });
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today ({today})
          </CardTitle>
          <CardDescription>Mark login and logout. You need 2+ leads to be marked present.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={doLogin} disabled={actionLoading || !!todayLog?.loginAt}>
            <LogIn className="h-4 w-4 mr-2" />
            Log in
          </Button>
          <Button variant="outline" onClick={doLogout} disabled={actionLoading || !!todayLog?.logoutAt}>
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </Button>
          {todayLog && (
            <div className="text-sm text-slate-600">
              {todayLog.loginAt && <span>In: {new Date(todayLog.loginAt).toLocaleTimeString()}</span>}
              {todayLog.logoutAt && <span className="ml-4">Out: {new Date(todayLog.logoutAt).toLocaleTimeString()}</span>}
              <span className="ml-4">Leads: {todayLog.leadsCount}</span>
              <span className="ml-4">Status: {todayLog.status}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Recent attendance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
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
