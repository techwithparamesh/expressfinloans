import { useEffect, useMemo, useState } from "react";
import { getAuthMe, staffFetch, staffJson, type StaffUser } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import StaffMyLeave from "./staff-my-leave";
import StaffMyPayslips from "./staff-my-payslips";

type ResignationItem = {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeNumber?: string;
  reason: string | null;
  noticeDays: number;
  effectiveLastWorkingDay: string | null;
  status: string;
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

export default function StaffHrWorkflows() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [resignationReason, setResignationReason] = useState("");
  const [resignationSaving, setResignationSaving] = useState(false);
  const [resignationMine, setResignationMine] = useState<ResignationItem[]>([]);
  const [probationMine, setProbationMine] = useState<ProbationItem[]>([]);
  const [pendingResignations, setPendingResignations] = useState<ResignationItem[]>([]);
  const [pendingProbations, setPendingProbations] = useState<ProbationItem[]>([]);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const isApprover = user?.role === "admin" || user?.role === "team_lead";
  const isEmployee = user?.role === "employee";

  async function loadAll() {
    if (!user) return;
    setLoading(true);
    try {
      const tasks: Promise<unknown>[] = [];
      if (isEmployee) {
        tasks.push(staffJson<ResignationItem[]>("/staff/resignations/me").then((x) => setResignationMine(Array.isArray(x) ? x : [])));
        tasks.push(staffJson<ProbationItem[]>("/staff/probation-confirmations/mine").then((x) => setProbationMine(Array.isArray(x) ? x : [])));
      }
      if (isApprover) {
        tasks.push(
          staffJson<{ pendingResignations?: ResignationItem[]; pendingProbationConfirmations?: ProbationItem[] }>("/staff/workflow-alerts")
            .then((p) => {
              setPendingResignations(Array.isArray(p?.pendingResignations) ? p.pendingResignations : []);
              setPendingProbations(Array.isArray(p?.pendingProbationConfirmations) ? p.pendingProbationConfirmations : []);
            })
        );
      }
      await Promise.all(tasks);
    } catch {
      if (isApprover) {
        setPendingResignations([]);
        setPendingProbations([]);
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
          {(isEmployee || user?.role === "team_lead") && <TabsTrigger value="leave">Leave</TabsTrigger>}
          {(isEmployee || user?.role === "team_lead") && <TabsTrigger value="payslips">Payslips</TabsTrigger>}
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          {isEmployee && (
            <Card>
              <CardHeader>
                <CardTitle>Apply for resignation</CardTitle>
                <CardDescription>
                  This request is routed to your Team Lead first, then to Admin for final approval.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeResignation && (
                  <div className="rounded-md border bg-slate-50 p-3 text-sm">
                    <p className="font-medium">Active request: {activeResignation.status}</p>
                    <p className="text-slate-600">
                      Notice period: {activeResignation.noticeDays} days · Effective last working day:{" "}
                      {activeResignation.effectiveLastWorkingDay || "—"}
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

          {isApprover && (
            <>
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
                          <p className="font-medium text-sm">
                            {r.employeeName || r.employeeId} ({r.employeeNumber || "N/A"})
                          </p>
                          <p className="text-xs text-slate-600">
                            Notice period: {r.noticeDays} days · Effective last working day: {r.effectiveLastWorkingDay || "—"}
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
                          <p className="font-medium text-sm">
                            {r.employeeName || r.employeeId} ({r.employeeNumber || "N/A"})
                          </p>
                          <p className="text-xs text-slate-600">
                            Probation completed on: {r.probationCompletedOn || "—"}
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
            </>
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
                  {resignationMine.length === 0 ? (
                    <p className="text-sm text-slate-500">No resignation requests yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {resignationMine.map((r) => (
                        <div key={r.id} className="rounded-md border bg-slate-50 p-3 text-sm">
                          <p className="font-medium">{r.status}</p>
                          <p className="text-slate-600">
                            Notice period: {r.noticeDays} days · Effective last working day: {r.effectiveLastWorkingDay || "—"}
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
                          <p className="font-medium">{r.status}</p>
                          <p className="text-slate-600">Probation completed on: {r.probationCompletedOn || "—"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

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

