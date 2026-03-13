import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { getAuthMe } from "@/lib/api";
import type { StaffUser } from "@/lib/api";
import { Target, Lock, Unlock } from "lucide-react";

type CompanyTarget = {
  month: number;
  year: number;
  totalBudget: string;
  totalLeads: number;
  isLocked: number;
};

type LeaderRow = {
  userId: string;
  fullName: string;
  username: string;
  assignedBudget: string;
  assignedLeads: number;
};

type EmployeeRow = {
  userId: string;
  fullName: string;
  username: string;
  employeeNumber: string | null;
  assignedBudget: string;
  assignedLeads: number;
};

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const currentYear = new Date().getFullYear();

export default function StaffTargetAllocation() {
  const { toast } = useToast();
  const [user, setUser] = useState<StaffUser | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [companyBudget, setCompanyBudget] = useState("");
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    getAuthMe().then((r) => setUser(r?.user ?? null));
  }, []);

  const isAdmin = user?.role === "admin";
  const isLeader = user?.role === "team_lead";

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = `month=${month}&year=${year}`;
    Promise.all([
      isAdmin ? staffJson<CompanyTarget>(`/staff/targets/company?${q}`).catch(() => null) : Promise.resolve(null),
      isAdmin ? staffJson<{ leaders: LeaderRow[] }>(`/staff/targets/leaders?${q}`).then((r) => r.leaders).catch(() => []) : Promise.resolve([]),
      isLeader ? staffJson<{ employees: EmployeeRow[] }>(`/staff/targets/employees?${q}`).then((r) => r.employees).catch(() => []) : Promise.resolve([]),
    ])
      .then(([company, leaderList, employeeList]) => {
        if (company) {
          setCompanyBudget(String(company.totalBudget || "0"));
          setIsLocked(company.isLocked === 1);
        }
        const companyZero = company && Number(company.totalBudget) === 0;
        if (companyZero && leaderList.length > 0) {
          setLeaders(
            leaderList.map((r) => ({ ...r, assignedBudget: "0", assignedLeads: 0 }))
          );
        } else {
          setLeaders(leaderList);
        }
        setEmployees(employeeList);
      })
      .catch(() => toast({ title: "Failed to load targets", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [user, month, year, isAdmin, isLeader, toast]);

  const totalBudget = parseFloat(companyBudget) || 0;
  const leaderSumBudget = leaders.reduce((s, r) => s + (parseFloat(r.assignedBudget) || 0), 0);

  useEffect(() => {
    if (!isAdmin || loading || leaders.length === 0) return;
    if (totalBudget <= 0) return;
    const hasNoAllocation = Math.abs(leaderSumBudget) < 0.01;
    if (!hasNoAllocation) return;
    const n = leaders.length;
    const budgetPerLeader = totalBudget / n;
    setLeaders((prev) =>
      prev.map((r) => ({
        ...r,
        assignedBudget: budgetPerLeader.toFixed(2),
        assignedLeads: 0,
      }))
    );
  }, [isAdmin, loading, totalBudget, leaders.length, leaderSumBudget]);
  const employeeSumBudget = employees.reduce((s, r) => s + (parseFloat(r.assignedBudget) || 0), 0);
  const leaderBudgetMatch = Math.abs(leaderSumBudget - totalBudget) < 0.01;
  const leaderValid = leaderBudgetMatch;
  const leaderBudgetRemain = totalBudget - leaderSumBudget;

  const [leaderMyBudget, setLeaderMyBudget] = useState(0);
  useEffect(() => {
    if (!isLeader || !user) return;
    staffJson<{ assignedBudget: string; assignedLeads: number }>(`/staff/targets/performance?month=${month}&year=${year}&userId=${user.id}`)
      .then((r) => setLeaderMyBudget(parseFloat(r.assignedBudget) || 0))
      .catch(() => setLeaderMyBudget(0));
  }, [isLeader, user, month, year]);
  const employeeValid = !isLeader || Math.abs(employeeSumBudget - leaderMyBudget) < 0.01;
  const employeeBudgetRemain = isLeader ? leaderMyBudget - employeeSumBudget : 0;

  async function saveCompany() {
    if (!isAdmin) return;
    setSaving(true);
    const budget = parseFloat(companyBudget) || 0;
    try {
      await staffJson("/staff/targets/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          totalBudget: budget,
          totalLeads: 0,
        }),
      });
      if (budget === 0 && leaders.length > 0) {
        await staffJson("/staff/targets/leaders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            month,
            year,
            leaderTargets: leaders.map((l) => ({
              userId: l.userId,
              assignedBudget: 0,
              assignedLeads: 0,
            })),
          }),
        });
        setLeaders((prev) =>
          prev.map((r) => ({ ...r, assignedBudget: "0", assignedLeads: 0 }))
        );
        toast({ title: "Company target and leader allocations cleared" });
      } else {
        toast({ title: "Company target saved" });
      }
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function saveLeaders() {
    if (!isAdmin || !leaderValid) return;
    setSaving(true);
    try {
      await staffJson("/staff/targets/leaders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          leaderTargets: leaders.map((l) => ({
            userId: l.userId,
            assignedBudget: parseFloat(l.assignedBudget) || 0,
            assignedLeads: 0,
          })),
        }),
      });
      toast({ title: "Leader targets saved" });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function saveEmployees() {
    if ((!isAdmin && !isLeader) || !employeeValid) return;
    setSaving(true);
    try {
      await staffJson("/staff/targets/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          employeeTargets: employees.map((e) => ({
            userId: e.userId,
            assignedBudget: parseFloat(e.assignedBudget) || 0,
            assignedLeads: 0,
          })),
        }),
      });
      toast({ title: "Employee targets saved" });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleLock() {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await staffJson("/staff/targets/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, locked: !isLocked }),
      });
      setIsLocked(!isLocked);
      toast({ title: isLocked ? "Targets unlocked" : "Targets locked" });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const updateLeader = (userId: string, field: "assignedBudget" | "assignedLeads", value: string | number) => {
    setLeaders((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, [field]: value } : r))
    );
  };

  function distributeEquallyToLeaders() {
    const budget = parseFloat(companyBudget) || 0;
    const n = leaders.length;
    if (n === 0) return;
    const budgetPerLeader = budget / n;
    setLeaders((prev) =>
      prev.map((r) => ({
        ...r,
        assignedBudget: budgetPerLeader.toFixed(2),
        assignedLeads: 0,
      }))
    );
  }
  const updateEmployee = (userId: string, field: "assignedBudget" | "assignedLeads", value: string | number) => {
    setEmployees((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, [field]: value } : r))
    );
  };

  if (loading && !leaders.length && !employees.length) {
    return <p className="text-slate-500">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Monthly Target Allocation</h1>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v, 10))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v, 10))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={toggleLock} disabled={saving}>
              {isLocked ? <Unlock className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
              {isLocked ? "Unlock" : "Lock"}
            </Button>
          )}
        </div>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" /> Step 1: Overall company target
            </CardTitle>
            <CardDescription>Set total budget (₹) for the month. Then split it to leaders below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Total budget (₹)</Label>
              <Input
                type="number"
                min={0}
                value={companyBudget}
                onChange={(e) => setCompanyBudget(e.target.value)}
                disabled={!!isLocked}
                placeholder="e.g. 50000000"
              />
            </div>
            <Button onClick={saveCompany} disabled={saving || !!isLocked}>
              Save company target
            </Button>
          </CardContent>
        </Card>
      )}

      {isAdmin && leaders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Split to leaders</CardTitle>
            <CardDescription>
              Sum of leader budgets must equal company budget ({totalBudget.toLocaleString("en-IN")} ₹).
            </CardDescription>
            <div className="text-sm font-medium mt-2">
              Remaining: ₹ {leaderBudgetRemain.toLocaleString("en-IN")}
              {!leaderValid && <span className="text-amber-600 ml-2">(Must match to save)</span>}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={distributeEquallyToLeaders}
                disabled={!!isLocked || leaders.length === 0}
              >
                Distribute equally to all leaders
              </Button>
              <span className="text-sm text-slate-500">
                Splits total budget from Step 1 equally among {leaders.length} leader{leaders.length !== 1 ? "s" : ""}. Edit any value below if needed, then Save.
              </span>
            </div>
            {leaders.map((l) => (
              <div key={l.userId} className="flex flex-wrap items-center gap-2 border-b pb-2">
                <span className="font-medium min-w-[140px]">{l.fullName || l.username}</span>
                <Input
                  type="number"
                  min={0}
                  className="w-40"
                  value={l.assignedBudget}
                  onChange={(e) => updateLeader(l.userId, "assignedBudget", e.target.value)}
                  disabled={!!isLocked}
                  placeholder="Budget (₹)"
                />
              </div>
            ))}
            <Button onClick={saveLeaders} disabled={saving || !leaderValid || !!isLocked}>
              Save leader targets
            </Button>
          </CardContent>
        </Card>
      )}

      {isLeader && employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Split to your team (Sales Managers)</CardTitle>
            <CardDescription>
              Sum must equal your assigned budget. Remaining: ₹ {employeeBudgetRemain.toLocaleString("en-IN")}
              {!employeeValid && <span className="text-amber-600 ml-2">(Must match to save)</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {employees.map((e) => (
              <div key={e.userId} className="flex flex-wrap items-center gap-2 border-b pb-2">
                <span className="font-medium min-w-[140px]">{e.fullName || e.username} {e.employeeNumber && `(${e.employeeNumber})`}</span>
                <Input
                  type="number"
                  min={0}
                  className="w-40"
                  value={e.assignedBudget}
                  onChange={(ev) => updateEmployee(e.userId, "assignedBudget", ev.target.value)}
                  disabled={!!isLocked}
                  placeholder="Budget (₹)"
                />
              </div>
            ))}
            <Button onClick={saveEmployees} disabled={saving || !employeeValid || !!isLocked}>
              Save employee targets
            </Button>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-600">Leaders split targets to their team from this same page (Target allocation) when logged in as Leader.</p>
          </CardContent>
        </Card>
      )}

      {!isAdmin && !isLeader && (
        <Card>
          <CardContent className="py-6">
            <p className="text-slate-600">Target allocation is for Admin and Leaders. Your assigned targets appear on My dashboard.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
