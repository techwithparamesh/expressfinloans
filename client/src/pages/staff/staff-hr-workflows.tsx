import { useEffect, useMemo, useState } from "react";
import { getAuthMe, staffFetch, staffJson, type StaffUser } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import StaffMyLeave from "./staff-my-leave";
import StaffMyPayslips from "./staff-my-payslips";
import { formatDateDdMmYyyy } from "@/lib/utils";

type ResignationItem = {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeNumber?: string;
  employeeRole?: string;
  reason: string | null;
  noticeDays: number;
  effectiveLastWorkingDay: string | null;
  status: string;
  daysLeft?: number;
  createdAt?: string | null;
};

type ProbationItem = {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeNumber?: string;
  probationCompletedOn: string | null;
  status: string;
  createdAt?: string | null;
};

function statusLabel(status: string): string {
  const s = String(status || "").toLowerCase();
  if (s === "pending_team_lead") return "Pending Team Lead Approval";
  if (s === "pending_admin") return "Pending Admin Approval";
  if (s === "approved") return "Approved";
  if (s === "rejected_by_team_lead") return "Rejected by Team Lead";
  if (s === "rejected_by_admin") return "Rejected by Admin";
  if (s === "withdrawn") return "Withdrawn";
  return status || "Unknown";
}

function statusBadgeClass(status: string): string {
  const s = String(status || "").toLowerCase();
  if (s === "approved") return "bg-green-100 text-green-800 border-green-200";
  if (s === "pending_team_lead") return "bg-amber-100 text-amber-800 border-amber-200";
  if (s === "pending_admin") return "bg-blue-100 text-blue-800 border-blue-200";
  if (s.startsWith("rejected")) return "bg-red-100 text-red-800 border-red-200";
  if (s === "withdrawn") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function calcDaysLeft(endDateStr: string | null | undefined): number {
  const s = String(endDateStr ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return -1;
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
  const end = new Date(s + "T00:00:00");
  if (Number.isNaN(today.getTime()) || Number.isNaN(end.getTime())) return -1;
  return Math.floor((end.getTime() - today.getTime()) / 86400000);
}

function daysLeftText(item: ResignationItem): string {
  const days = typeof item.daysLeft === "number" ? item.daysLeft : calcDaysLeft(item.effectiveLastWorkingDay);
  if (days < 0) return "Notice period completed";
  if (days === 0) return "Last working day is today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

function noticePriority(daysLeft: number): 0 | 1 | 2 | 3 {
  if (daysLeft < 0) return 3;
  if (daysLeft === 0) return 0;
  if (daysLeft <= 7) return 1;
  return 2;
}

export default function StaffHrWorkflows() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [resignationReason, setResignationReason] = useState("");
  const [resignationSaving, setResignationSaving] = useState(false);
  const [resignationMine, setResignationMine] = useState<ResignationItem[]>([]);
  const [probationMine, setProbationMine] = useState<ProbationItem[]>([]);
  const [pendingResignations, setPendingResignations] = useState<ResignationItem[]>([]);
  const [pendingProbations, setPendingProbations] = useState<ProbationItem[]>([]);
  const [onNoticeResignations, setOnNoticeResignations] = useState<ResignationItem[]>([]);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const isApprover = user?.role === "admin" || user?.role === "team_lead";
  const canSubmitResignation = user?.role === "employee" || user?.role === "team_lead";
  const isEmployee = user?.role === "employee";

  async function loadAll() {
    if (!user) return;
    setLoading(true);
    try {
      const tasks: Promise<unknown>[] = [];
      if (canSubmitResignation) {
        tasks.push(staffJson<ResignationItem[]>("/staff/resignations/me").then((x) => setResignationMine(Array.isArray(x) ? x : [])));
      } else {
        setResignationMine([]);
      }
      if (isEmployee) {
        tasks.push(staffJson<ProbationItem[]>("/staff/probation-confirmations/mine").then((x) => setProbationMine(Array.isArray(x) ? x : [])));
      } else {
        setProbationMine([]);
      }
      if (isApprover) {
        tasks.push(
          staffJson<{ pendingResignations?: ResignationItem[]; pendingProbationConfirmations?: ProbationItem[] }>("/staff/workflow-alerts")
            .then((p) => {
              setPendingResignations(Array.isArray(p?.pendingResignations) ? p.pendingResignations : []);
              setPendingProbations(Array.isArray(p?.pendingProbationConfirmations) ? p.pendingProbationConfirmations : []);
            })
        );
        tasks.push(
          staffJson<ResignationItem[]>("/staff/resignations/on-notice")
            .then((rows) => setOnNoticeResignations(Array.isArray(rows) ? rows : []))
        );
      } else {
        setPendingResignations([]);
        setPendingProbations([]);
        setOnNoticeResignations([]);
      }
      await Promise.all(tasks);
    } catch {
      if (isApprover) {
        setPendingResignations([]);
        setPendingProbations([]);
        setOnNoticeResignations([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getAuthMe().then((res) => setUser(res?.user ?? null));
  }, []);

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const activeResignation = useMemo(
    () =>
      resignationMine.find((r) =>
        ["pending_team_lead", "pending_admin", "approved"].includes(String(r.status || "").toLowerCase())
      ),
    [resignationMine]
  );

  const resignationHistory = useMemo(
    () => resignationMine.filter((r) => r.id !== activeResignation?.id),
    [resignationMine, activeResignation?.id]
  );

  const onNoticeSorted = useMemo(() => {
    const rows = [...onNoticeResignations];
    rows.sort((a, b) => {
      const da = typeof a.daysLeft === "number" ? a.daysLeft : calcDaysLeft(a.effectiveLastWorkingDay);
      const db = typeof b.daysLeft === "number" ? b.daysLeft : calcDaysLeft(b.effectiveLastWorkingDay);
      const pa = noticePriority(da);
      const pb = noticePriority(db);
      if (pa !== pb) return pa - pb;
      return da - db;
    });
    return rows;
  }, [onNoticeResignations]);

  async function submitResignation() {
    if (!resignationReason.trim()) {
      toast({ title: "Please enter a resignation reason", variant: "destructive" });
      return;
    }
    setResignationSaving(true);
    try {
      await staffJson("/staff/resignations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: resignationReason.trim() }),
      });
      toast({ title: "Resignation request submitted" });
      setResignationReason("");
      await loadAll();
    } catch (e) {
      toast({
        title: "Could not submit resignation request",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setResignationSaving(false);
    }
  }

  async function decideResignation(id: string, decision: "approved" | "rejected") {
    setActioningId(id);
    try {
      await staffFetch(`/staff/resignations/${id}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      toast({ title: `Resignation ${decision}` });
      await loadAll();
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Could not update resignation",
        variant: "destructive",
      });
    } finally {
      setActioningId(null);
    }
  }

  async function decideProbation(id: string, decision: "approved" | "rejected") {
    setActioningId(id);
    try {
      await staffFetch(`/staff/probation-confirmations/${id}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      toast({ title: `Probation confirmation ${decision}` });
      await loadAll();
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Could not update probation confirmation",
        variant: "destructive",
      });
    } finally {
      setActioningId(null);
    }
  }

  if (loading) return <p className="text-slate-500">Loading HR workflows…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">HR Workflows</h1>
        <p className="text-slate-600 mt-0.5">
          Manage HR requests, approvals, leave, and payslips from one place.
        </p>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          {isApprover && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
          {isApprover && <TabsTrigger value="on-notice">On Notice</TabsTrigger>}
          {(isEmployee || user?.role === "team_lead") && <TabsTrigger value="leave">Leave</TabsTrigger>}
          {(isEmployee || user?.role === "team_lead") && <TabsTrigger value="payslips">Payslips</TabsTrigger>}
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          {canSubmitResignation && (
            <Card>
              <CardHeader>
                <CardTitle>Apply for resignation</CardTitle>
                <CardDescription>
                  {user?.role === "team_lead"
                    ? "This request goes directly to Admin for final approval."
                    : "This request is routed to your Team Lead first, then to Admin for final approval."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeResignation && (
                  <div className="rounded-md border bg-slate-50 p-3 text-sm">
                    <p className="font-medium flex items-center gap-2">
                      Active request:
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(activeResignation.status)}`}>
                        {statusLabel(activeResignation.status)}
                      </span>
                    </p>
                    <p className="text-slate-600">
                      Notice period: {activeResignation.noticeDays} days · Effective last working day:{" "}
                      {formatDateDdMmYyyy(activeResignation.effectiveLastWorkingDay) || "—"} · {daysLeftText(activeResignation)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      This active request is shown here only to avoid duplicate status in history.
                    </p>
                  </div>
                )}
                <Textarea
                  value={resignationReason}
                  onChange={(e) => setResignationReason(e.target.value)}
                  placeholder="Reason for resignation"
                  rows={4}
                  disabled={resignationSaving || !!activeResignation}
                />
                <Button onClick={() => void submitResignation()} disabled={resignationSaving || !!activeResignation}>
                  {resignationSaving ? "Submitting…" : "Submit resignation request"}
                </Button>
              </CardContent>
            </Card>
          )}

          {isEmployee && (
            <Card>
              <CardHeader>
                <CardTitle>My workflow history</CardTitle>
                <CardDescription>Track your resignation and probation workflow statuses.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">Resignation requests</h3>
                  {resignationHistory.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      {activeResignation ? "No past resignation requests yet." : "No resignation requests yet."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {resignationHistory.map((r) => (
                        <div key={r.id} className="rounded-md border bg-slate-50 p-3 text-sm">
                          <p className="font-medium">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(r.status)}`}>
                              {statusLabel(r.status)}
                            </span>
                          </p>
                          <p className="text-slate-600">
                            Notice period: {r.noticeDays} days · Effective last working day: {formatDateDdMmYyyy(r.effectiveLastWorkingDay) || "—"} · {daysLeftText(r)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">Probation confirmations</h3>
                  {probationMine.length === 0 ? (
                    <p className="text-sm text-slate-500">No probation confirmation records yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {probationMine.map((r) => (
                        <div key={r.id} className="rounded-md border bg-slate-50 p-3 text-sm">
                          <p className="font-medium">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(r.status)}`}>
                              {statusLabel(r.status)}
                            </span>
                          </p>
                          <p className="text-slate-600">Probation completed on: {formatDateDdMmYyyy(r.probationCompletedOn) || "—"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {isApprover && (
          <TabsContent value="approvals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending resignation approvals</CardTitle>
                <CardDescription>Requests waiting for your decision.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingResignations.length === 0 ? (
                  <p className="text-sm text-slate-500">No pending resignation requests.</p>
                ) : (
                  pendingResignations.map((r) => {
                    const actioning = actioningId === r.id;
                    return (
                      <div key={r.id} className="rounded-md border bg-slate-50 p-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-sm">
                            {r.employeeName || r.employeeId} ({r.employeeNumber || "N/A"})
                          </p>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(r.status)}`}>
                            {statusLabel(r.status)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Notice period: {r.noticeDays} days · Effective last working day: {formatDateDdMmYyyy(r.effectiveLastWorkingDay) || "—"} · {daysLeftText(r)}
                        </p>
                        {r.reason && <p className="text-xs text-slate-600">Reason: {r.reason}</p>}
                        <div className="flex gap-2">
                          <Button size="sm" disabled={actioning} onClick={() => void decideResignation(r.id, "approved")}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" disabled={actioning} onClick={() => void decideResignation(r.id, "rejected")}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending probation confirmations</CardTitle>
                <CardDescription>Employees who have completed probation and require your decision.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingProbations.length === 0 ? (
                  <p className="text-sm text-slate-500">No pending probation confirmations.</p>
                ) : (
                  pendingProbations.map((r) => {
                    const actioning = actioningId === r.id;
                    return (
                      <div key={r.id} className="rounded-md border bg-slate-50 p-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-sm">
                            {r.employeeName || r.employeeId} ({r.employeeNumber || "N/A"})
                          </p>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(r.status)}`}>
                            {statusLabel(r.status)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Probation completed on: {formatDateDdMmYyyy(r.probationCompletedOn) || "—"}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" disabled={actioning} onClick={() => void decideProbation(r.id, "approved")}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" disabled={actioning} onClick={() => void decideProbation(r.id, "rejected")}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isApprover && (
          <TabsContent value="on-notice">
            <Card>
              <CardHeader>
                <CardTitle>Employees on notice period</CardTitle>
                <CardDescription>
                  {user?.role === "admin"
                    ? "Shows approved resignation notice period for employees and team leads."
                    : "Shows approved resignation notice period for employees in your team."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {onNoticeSorted.length === 0 ? (
                  <p className="text-sm text-slate-500">No active notice-period records.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-red-700">Priority 1: 0 day</span>
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">Priority 2: 1-7 days</span>
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700">Priority 3: 8+ days</span>
                    </div>
                    {onNoticeSorted.map((r) => {
                      const days = typeof r.daysLeft === "number" ? r.daysLeft : calcDaysLeft(r.effectiveLastWorkingDay);
                      const priorityClass =
                        days === 0
                          ? "border-red-200 bg-red-50"
                          : days > 0 && days <= 7
                            ? "border-amber-200 bg-amber-50"
                            : "border-blue-200 bg-blue-50";
                      return (
                      <div key={r.id} className="rounded-md border bg-slate-50 p-3 text-sm">
                        <p className="font-medium">
                          {r.employeeName || r.employeeId} ({r.employeeNumber || "N/A"})
                          {user?.role === "admin" ? ` · ${r.employeeRole}` : ""}
                        </p>
                        <p className="text-slate-600">
                          Effective last working day: {formatDateDdMmYyyy(r.effectiveLastWorkingDay) || "—"} · {daysLeftText(r)}
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${priorityClass}`}>
                            {days === 0 ? "Priority 1" : days > 0 && days <= 7 ? "Priority 2" : "Priority 3"}
                          </span>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {(isEmployee || user?.role === "team_lead") && (
          <TabsContent value="leave">
            <StaffMyLeave />
          </TabsContent>
        )}

        {(isEmployee || user?.role === "team_lead") && (
          <TabsContent value="payslips">
            <StaffMyPayslips />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
