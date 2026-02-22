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
import { staffJson, staffFetch } from "@/lib/api";
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

export default function StaffInsuranceLeads() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<InsuranceLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(getMonthStart());
  const [to, setTo] = useState(today());
  const [editLead, setEditLead] = useState<InsuranceLead | null>(null);
  const [deleteLead, setDeleteLead] = useState<InsuranceLead | null>(null);
  const [saving, setSaving] = useState(false);
  const [adminForm, setAdminForm] = useState({
    collectedPremium: "",
    actualPremium: "",
    finalRemarks: "",
  });

  function load() {
    setLoading(true);
    const url = "/staff/insurance-leads?from=" + from + "&to=" + to;
    staffJson<InsuranceLead[]>(url)
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), [from, to]);

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
          <CardDescription>Filter by date range.</CardDescription>
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
          <CardTitle>Insurance leads</CardTitle>
          <CardDescription>Admin: update Collected Premium, Actual Premium, and Final Remarks. Difference is calculated automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Employee name</th>
                  <th className="text-left py-2">Employee ID</th>
                  <th className="text-left py-2">Customer</th>
                  <th className="text-left py-2">Contact</th>
                  <th className="text-left py-2">Insurance type</th>
                  <th className="text-left py-2">Premium quoted</th>
                  <th className="text-left py-2">Collected prem.</th>
                  <th className="text-left py-2">Actual prem.</th>
                  <th className="text-left py-2">Difference</th>
                  <th className="text-left py-2">Final remarks</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="py-2">{l.date}</td>
                    <td className="py-2">{l.employeeName ?? l.employeeId}</td>
                    <td className="py-2">{l.employeeNumber ?? "—"}</td>
                    <td className="py-2">{l.customerName ?? "—"}</td>
                    <td className="py-2">{l.contactNum ?? "—"}</td>
                    <td className="py-2">{l.insuranceType ?? "—"}</td>
                    <td className="py-2">{l.premiumQuoted ?? "—"}</td>
                    <td className="py-2">{l.collectedPremium ?? "—"}</td>
                    <td className="py-2">{l.actualPremium ?? "—"}</td>
                    <td className="py-2">{computeDifference(l.collectedPremium, l.actualPremium)}</td>
                    <td className="py-2 max-w-[120px] truncate" title={l.finalRemarks ?? ""}>
                      {l.finalRemarks ?? "—"}
                    </td>
                    <td className="py-2">
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
