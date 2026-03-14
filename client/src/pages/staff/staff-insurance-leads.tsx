import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { staffJson, staffFetch } from "@/lib/api";
import { formatDateDdMmYyyy } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type InsuranceLead = {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeNumber?: string;
  date: string;
  customerName: string | null;
  contactNum: string | null;
  insuranceType: string | null;
  premiumQuoted: string | null;
  premiumCollected: string | null;
  status: string;
  collectedPremium: string | null;
  actualPremium: string | null;
  finalRemarks: string | null;
};

function computeDifference(collected: string | null, actual: string | null): string {
  const c = collected ? parseFloat(String(collected).replace(/,/g, "")) : NaN;
  const a = actual ? parseFloat(String(actual).replace(/,/g, "")) : NaN;
  if (Number.isNaN(c) || Number.isNaN(a)) return "—";
  const diff = c - a;
  return diff.toLocaleString("en-IN");
}

const today = () => new Date().toISOString().slice(0, 10);

type Employee = { id: string; username: string; fullName: string | null; employeeNumber: string | null };

export default function StaffInsuranceLeads() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<InsuranceLead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(getMonthStart());
  const [to, setTo] = useState(today());
  const [employeeId, setEmployeeId] = useState("");
  const [editLead, setEditLead] = useState<InsuranceLead | null>(null);
  const [deleteLead, setDeleteLead] = useState<InsuranceLead | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAdminFields, setShowAdminFields] = useState(false);
  const [adminForm, setAdminForm] = useState({
    collectedPremium: "",
    actualPremium: "",
    finalRemarks: "",
  });

  useEffect(() => {
    staffJson<Employee[]>("/staff/employees").then(setEmployees).catch(() => setEmployees([]));
  }, []);

  function load() {
    setLoading(true);
    let url = "/staff/insurance-leads?from=" + from + "&to=" + to;
    if (employeeId) url += "&employeeId=" + encodeURIComponent(employeeId);
    staffJson<InsuranceLead[]>(url)
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), [from, to, employeeId]);

  function openEdit(l: InsuranceLead) {
    setEditLead(l);
    setAdminForm({
      collectedPremium: l.collectedPremium ?? "",
      actualPremium: l.actualPremium ?? "",
      finalRemarks: l.finalRemarks ?? "",
    });
  }

  const differenceDisplay = editLead
    ? computeDifference(adminForm.collectedPremium || null, adminForm.actualPremium || null)
    : "—";

  async function confirmDelete() {
    if (!deleteLead) return;
    setSaving(true);
    try {
      await staffFetch("/staff/insurance-leads/" + deleteLead.id, { method: "DELETE" });
      toast({ title: "Insurance lead deleted" });
      setDeleteLead(null);
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Delete failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function saveAdminFields() {
    if (!editLead) return;
    setSaving(true);
    try {
      await staffJson("/staff/insurance-leads/" + editLead.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectedPremium: adminForm.collectedPremium || null,
          actualPremium: adminForm.actualPremium || null,
          finalRemarks: adminForm.finalRemarks || null,
        }),
      });
      toast({ title: "Insurance lead updated" });
      setEditLead(null);
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Update failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading && leads.length === 0) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All insurance leads</h1>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by staff member and date range.</CardDescription>
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
                    {e.employeeNumber ?? "—"} – {e.fullName || e.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} onKeyDown={(e) => e.preventDefault()} readOnly title="Select date from calendar" />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} onKeyDown={(e) => e.preventDefault()} readOnly title="Select date from calendar" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Insurance leads</CardTitle>
              <CardDescription>
                {employeeId
                  ? `Total: ${leads.length} lead${leads.length !== 1 ? "s" : ""} (for ${employees.find((e) => e.id === employeeId)?.fullName || employees.find((e) => e.id === employeeId)?.username || "selected staff"})`
                  : `Total: ${leads.length} lead${leads.length !== 1 ? "s" : ""}. Admin: update Collected Premium, Actual Premium, and Final Remarks via Edit.`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAdminFields((v) => !v)}>
              {showAdminFields ? "Hide premium & remarks columns" : "Show premium & remarks columns"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 sticky left-0 z-10 bg-white min-w-[72px]">Employee ID</th>
                  <th className="text-left py-2 px-2 sticky left-[72px] z-10 bg-white min-w-[120px]">Employee name</th>
                  <th className="text-left py-2 px-2 min-w-[96px]">Date</th>
                  <th className="text-left py-2 px-2 min-w-[80px]">Status</th>
                  <th className="text-left py-2 px-2 min-w-[100px]">Customer</th>
                  <th className="text-left py-2 px-2 min-w-[90px]">Contact</th>
                  <th className="text-left py-2 px-2 min-w-[90px]">Insurance type</th>
                  <th className="text-left py-2 px-2 min-w-[80px]">Premium quoted</th>
                  {showAdminFields && (
                    <>
                      <th className="text-left py-2 px-2 min-w-[90px]">Collected</th>
                      <th className="text-left py-2 px-2 min-w-[80px]">Actual</th>
                      <th className="text-left py-2 px-2 min-w-[80px]">Difference</th>
                      <th className="text-left py-2 px-2 min-w-[100px]">Final remarks</th>
                    </>
                  )}
                  <th className="text-left py-2 px-2 min-w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="py-2 px-2 sticky left-0 z-10 bg-white font-medium">{l.employeeNumber ?? "—"}</td>
                    <td className="py-2 px-2 sticky left-[72px] z-10 bg-white">{l.employeeName ?? l.employeeId}</td>
                    <td className="py-2 px-2 whitespace-nowrap">{formatDateDdMmYyyy(l.date) ?? "—"}</td>
                    <td className="py-2 px-2">{l.status}</td>
                    <td className="py-2 px-2 max-w-[120px] truncate" title={l.customerName ?? undefined}>{l.customerName ?? "—"}</td>
                    <td className="py-2 px-2">{l.contactNum ?? "—"}</td>
                    <td className="py-2 px-2">{l.insuranceType ?? "—"}</td>
                    <td className="py-2 px-2">{l.premiumQuoted ?? "—"}</td>
                    {showAdminFields && (
                      <>
                        <td className="py-2 px-2">{l.collectedPremium ?? "—"}</td>
                        <td className="py-2 px-2">{l.actualPremium ?? "—"}</td>
                        <td className="py-2 px-2">{computeDifference(l.collectedPremium, l.actualPremium)}</td>
                        <td className="py-2 px-2 max-w-[120px] truncate" title={l.finalRemarks ?? ""}>
                          {l.finalRemarks ?? "—"}
                        </td>
                      </>
                    )}
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(l)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteLead(l)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteLead} onOpenChange={(open) => !open && setDeleteLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete insurance lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this insurance lead. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editLead} onOpenChange={(open) => !open && setEditLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin: Collected &amp; Actual Premium</DialogTitle>
            <DialogDescription>
              Update collected premium, actual premium, and final remarks. Difference is shown automatically (Collected − Actual).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Collected Premium</Label>
              <Input
                placeholder="e.g. 25000"
                value={adminForm.collectedPremium}
                onChange={(e) => setAdminForm((f) => ({ ...f, collectedPremium: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Actual Premium</Label>
              <Input
                placeholder="e.g. 24000"
                value={adminForm.actualPremium}
                onChange={(e) => setAdminForm((f) => ({ ...f, actualPremium: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Difference (auto)</Label>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm font-medium">
                {differenceDisplay}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Final Remarks</Label>
              <Input
                placeholder="Remarks"
                value={adminForm.finalRemarks}
                onChange={(e) => setAdminForm((f) => ({ ...f, finalRemarks: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLead(null)}>
              Cancel
            </Button>
            <Button onClick={saveAdminFields} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getMonthStart(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}
