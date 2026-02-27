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
  loginLocation: string | null;
  leadsCount: number;
  status: string;
};

/** Get current position if user allows; returns null on deny/error so server can fall back to IP. */
function getCurrentPositionAsync(): Promise<{ latitude: number; longitude: number } | null> {
  if (!navigator?.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 8000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
    );
  });
}

export default function StaffMyAttendance() {
  const { toast } = useToast();
  const [todayLog, setTodayLog] = useState<Log | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

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
    setLoginLoading(true);
    try {
      const coords = await getCurrentPositionAsync();
      const body: { date: string; latitude?: number; longitude?: number } = { date: today };
      if (coords) {
        body.latitude = coords.latitude;
        body.longitude = coords.longitude;
      }
      const log = await staffJson<Log>("/staff/attendance/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setTodayLog(log);
      toast({ title: "Logged in" });
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  }

  async function doLogout() {
    setLogoutLoading(true);
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
      setLogoutLoading(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-5 w-5 shrink-0" />
            Today ({today})
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Mark login and logout. You need 2 or more leads to be marked present. Location is recorded when you tap Log in (from browser or IP).</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={doLogin}
              disabled={loginLoading || logoutLoading || !!todayLog?.loginAt}
              className="min-h-[44px] min-w-[120px] touch-manipulation"
            >
              <LogIn className="h-4 w-4 mr-2 shrink-0" />
              {loginLoading ? "Logging in…" : todayLog?.loginAt ? "Logged in" : "Log in"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={doLogout}
              disabled={loginLoading || logoutLoading || !!todayLog?.logoutAt}
              className="min-h-[44px] min-w-[120px] touch-manipulation"
            >
              <LogOut className="h-4 w-4 mr-2 shrink-0" />
              {logoutLoading ? "Logging out…" : todayLog?.logoutAt ? "Logged out" : "Log out"}
            </Button>
          </div>
          {todayLog && (
            <div className="text-sm text-slate-600 space-y-1">
              <div>
                {todayLog.loginAt && <span>In: {new Date(todayLog.loginAt).toLocaleTimeString()}</span>}
                {todayLog.logoutAt && <span className="ml-4">Out: {new Date(todayLog.logoutAt).toLocaleTimeString()}</span>}
                <span className="ml-4">Leads: {todayLog.leadsCount}</span>
                <span className="ml-4">Status: {todayLog.status}</span>
              </div>
              <p className="text-slate-500">Login location: {todayLog.loginLocation ?? "—"}</p>
              {todayLog.loginAt && todayLog.logoutAt && (
                <p className="text-slate-500">You’ve already logged in and out for today. Buttons will be available again tomorrow.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">History</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Recent attendance.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {/* Mobile: card list so each value sits under its label */}
          <div className="space-y-3 md:hidden">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No attendance records.</p>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="rounded-lg border bg-card p-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground shrink-0 w-[90px]">Date</span>
                    <span className="text-right font-medium">{formatShortDate(l.date)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground shrink-0 w-[90px]">Login</span>
                    <span className="text-right">{l.loginAt ? new Date(l.loginAt).toLocaleTimeString() : "—"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground shrink-0 w-[90px]">Logout</span>
                    <span className="text-right">{l.logoutAt ? new Date(l.logoutAt).toLocaleTimeString() : "—"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground shrink-0 w-[90px]">Location</span>
                    <span className="text-right truncate min-w-0" title={l.loginLocation ?? undefined}>{l.loginLocation ?? "—"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground shrink-0 w-[90px]">Leads</span>
                    <span className="text-right">{l.leadsCount}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground shrink-0 w-[90px]">Status</span>
                    <span className="text-right font-medium">{l.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block w-full min-w-0 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Login</th>
                  <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Logout</th>
                  <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Location</th>
                  <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Leads</th>
                  <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="py-2.5 pr-3" title={l.date}>{formatShortDate(l.date)}</td>
                    <td className="py-2.5 pr-3">{l.loginAt ? new Date(l.loginAt).toLocaleTimeString() : "—"}</td>
                    <td className="py-2.5 pr-3">{l.logoutAt ? new Date(l.logoutAt).toLocaleTimeString() : "—"}</td>
                    <td className="py-2.5 pr-3 max-w-[200px] truncate" title={l.loginLocation ?? undefined}>{l.loginLocation ?? "—"}</td>
                    <td className="py-2.5 pr-3">{l.leadsCount}</td>
                    <td className="py-2.5 pr-3">{l.status}</td>
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

/** Format date string (YYYY-MM-DD or ISO) to short form for mobile table. */
function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
