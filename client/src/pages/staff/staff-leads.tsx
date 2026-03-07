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
import { staffJson, staffFetch, getAuthMe } from "@/lib/api";
import type { StaffUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Target, Eye } from "lucide-react";

const RECONSIL_OPTIONS = ["Yes Received", "Not Revived", "Not as per Rate"] as const;
const PAYMENT_STATUS_OPTIONS = ["Received", "Pending", "Not Received"] as const;

type Lead = {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeNumber?: string;
  date: string;
  customerName: string | null;
  dateOfBirth?: string | null;
  customerPhone: string | null;
  customerEmail?: string | null;
  location?: string | null;
  loanType: string | null;
  subLoanType?: string | null;
  incomeType?: string | null;
  incomeComments?: string | null;
  amount: string | null;
  cibil?: string | null;
  docsCollected?: string | null;
  companyLogged?: string | null;
  applicationNumber?: string | null;
  tenure?: string | null;
  roi?: string | null;
  loanDisbursed?: string | null;
  loanSanctionedAt?: string | null;
  loanDisbursedAt?: string | null;
  status: string;
  notes?: string | null;
  formLocation?: string | null;
  payoutPercent: string | null;
  payoutAmount: string | null;
  reconsil: string | null;
  paymentStatus: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

type Employee = { id: string; username: string; fullName: string | null; employeeNumber: string | null };

export default function StaffLeads() {
  const { toast } = useToast();
  const [user, setUser] = useState<StaffUser | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(getMonthStart());
  const [to, setTo] = useState(today());
  const [status, setStatus] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingView, setLoadingView] = useState(false);
  const [showAdminFields, setShowAdminFields] = useState(false);
  const [adminForm, setAdminForm] = useState({
    payoutPercent: "",
    payoutAmount: "",
    reconsil: "",
    paymentStatus: "",
  });

  useEffect(() => {
    getAuthMe().then(setUser).catch(() => setUser(null));
  }, []);
  useEffect(() => {
    staffJson<Employee[]>("/staff/employees").then(setEmployees).catch(() => setEmployees([]));
  }, []);

  function load() {
    setLoading(true);
    let url = "/staff/leads?from=" + from + "&to=" + to;
    if (status) url += "&status=" + encodeURIComponent(status);
    if (employeeId) url += "&employeeId=" + encodeURIComponent(employeeId);
    staffJson<Lead[]>(url)
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), [from, to, status, employeeId]);

  function openEdit(l: Lead) {
    setEditLead(l);
    setAdminForm({
      payoutPercent: l.payoutPercent ?? "",
      payoutAmount: l.payoutAmount ?? "",
      reconsil: l.reconsil ?? "",
      paymentStatus: l.paymentStatus ?? "",
    });
  }

  async function openView(l: Lead) {
    setViewLead(null);
    setLoadingView(true);
    try {
      const full = await staffJson<Lead>("/staff/leads/" + l.id);
      setViewLead(full);
    } catch {
      toast({ title: "Could not load lead details", variant: "destructive" });
    } finally {
      setLoadingView(false);
    }
  }

  function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
    return (
      <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100 last:border-0">
        <span className="text-slate-500 shrink-0 w-[140px]">{label}</span>
        <span className="text-right font-medium min-w-0 break-words">{value ?? "—"}</span>
      </div>
    );
  }

  async function confirmDelete() {
    if (!deleteLead) return;
    setSaving(true);
    try {
      await staffFetch("/staff/leads/" + deleteLead.id, { method: "DELETE" });
      toast({ title: "Lead deleted" });
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
      await staffJson("/staff/leads/" + editLead.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutPercent: adminForm.payoutPercent || null,
          payoutAmount: adminForm.payoutAmount || null,
          reconsil: adminForm.reconsil || null,
          paymentStatus: adminForm.paymentStatus || null,
        }),
      });
      toast({ title: "Lead updated" });
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
      <h1 className="text-2xl font-bold">Loan leads</h1>
      {user?.role === "team_lead" && (
        <Card className="border-blue-200 bg-blue-50/80">
          <CardContent className="py-3 flex items-center gap-2 text-sm text-slate-700">
            <Target className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              For <strong>team targets</strong>, <strong>overall target</strong>, <strong>achievement</strong> and <strong>conveyance</strong>, go to{" "}
              <Link href="/staff/dashboard" className="text-blue-600 font-medium underline hover:no-underline">Dashboard</Link>.
            </span>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by staff member, date range, and status.</CardDescription>
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
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Input
              placeholder="Open, Disbursed, Rejected..."
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Leads</CardTitle>
              <CardDescription>
                {employeeId
                  ? `Total: ${leads.length} lead${leads.length !== 1 ? "s" : ""} (for ${employees.find((e) => e.id === employeeId)?.fullName || employees.find((e) => e.id === employeeId)?.username || "selected staff"})`
                  : `Total: ${leads.length} lead${leads.length !== 1 ? "s" : ""}. Edit admin fields (payout, reconsil, payment status) via Edit.`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAdminFields((v) => !v)}>
              {showAdminFields ? "Hide payout & payment columns" : "Show payout & payment columns"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 sticky left-0 z-10 bg-white min-w-[72px]">Employee ID</th>
                  <th className="text-left py-2 px-2 sticky left-[72px] z-10 bg-white min-w-[120px]">Employee name</th>
                  <th className="text-left py-2 px-2 min-w-[96px]">Date</th>
                  <th className="text-left py-2 px-2 min-w-[80px]">Status</th>
                  <th className="text-left py-2 px-2 min-w-[80px]">Amount</th>
                  <th className="text-left py-2 px-2 min-w-[100px]">Customer</th>
                  <th className="text-left py-2 px-2 min-w-[90px]">DOB</th>
                  <th className="text-left py-2 px-2 min-w-[90px]">Phone</th>
                  <th className="text-left py-2 px-2 min-w-[90px]">Loan type</th>
                  <th className="text-left py-2 px-2 min-w-[90px]">Sub type</th>
                  <th className="text-left py-2 px-2 min-w-[72px]">Tenure</th>
                  {showAdminFields && (
                    <>
                      <th className="text-left py-2 px-2 min-w-[70px]">Payout %</th>
                      <th className="text-left py-2 px-2 min-w-[90px]">Payout Amt</th>
                      <th className="text-left py-2 px-2 min-w-[100px]">Reconsil</th>
                      <th className="text-left py-2 px-2 min-w-[100px]">Payment Status</th>
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
                    <td className="py-2 px-2 whitespace-nowrap">{formatDate(l.date)}</td>
                    <td className="py-2 px-2">{l.status}</td>
                    <td className="py-2 px-2">{l.amount ?? "—"}</td>
                    <td className="py-2 px-2 max-w-[120px] truncate" title={l.customerName ?? undefined}>{l.customerName ?? "—"}</td>
                    <td className="py-2 px-2 whitespace-nowrap">{l.dateOfBirth ?? "—"}</td>
                    <td className="py-2 px-2">{l.customerPhone ?? "—"}</td>
                    <td className="py-2 px-2">{l.loanType ?? "—"}</td>
                    <td className="py-2 px-2">{l.subLoanType ?? "—"}</td>
                    <td className="py-2 px-2">{l.tenure ?? "—"}</td>
                    {showAdminFields && (
                      <>
                        <td className="py-2 px-2">{l.payoutPercent ?? "—"}</td>
                        <td className="py-2 px-2">{l.payoutAmount ?? "—"}</td>
                        <td className="py-2 px-2">{l.reconsil ?? "—"}</td>
                        <td className="py-2 px-2">{l.paymentStatus ?? "—"}</td>
                      </>
                    )}
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => openView(l)} disabled={loadingView}>
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
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

      <Dialog open={!!viewLead} onOpenChange={(open) => !open && setViewLead(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer / Lead details</DialogTitle>
            <DialogDescription>Full details for this lead. Read-only.</DialogDescription>
          </DialogHeader>
          {viewLead && (
            <div className="space-y-6 py-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Customer &amp; contact</h3>
                <div className="space-y-0 text-sm">
                  <DetailRow label="Customer name" value={viewLead.customerName} />
                  <DetailRow label="Date of birth" value={viewLead.dateOfBirth ? String(viewLead.dateOfBirth).slice(0, 10) : null} />
                  <DetailRow label="Phone" value={viewLead.customerPhone} />
                  <DetailRow label="Email" value={viewLead.customerEmail} />
                  <DetailRow label="Location" value={viewLead.location} />
                  <DetailRow label="Lead date" value={viewLead.date ? String(viewLead.date).slice(0, 10) : null} />
                  <DetailRow label="Generated at" value={viewLead.formLocation ?? (viewLead as any).form_location} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Loan details</h3>
                <div className="space-y-0 text-sm">
                  <DetailRow label="Loan type" value={viewLead.loanType} />
                  <DetailRow label="Sub type" value={viewLead.subLoanType} />
                  <DetailRow label="Income type" value={viewLead.incomeType} />
                  <DetailRow label="Income comments" value={viewLead.incomeComments} />
                  <DetailRow label="Amount" value={viewLead.amount} />
                  <DetailRow label="CIBIL" value={viewLead.cibil} />
                  <DetailRow label="Application number" value={viewLead.applicationNumber ?? (viewLead as any).application_number} />
                  <DetailRow label="Company logged" value={viewLead.companyLogged} />
                  <DetailRow label="Tenure" value={viewLead.tenure} />
                  <DetailRow label="ROI" value={viewLead.roi} />
                  <DetailRow label="Docs collected" value={viewLead.docsCollected} />
                  <DetailRow label="Loan sanctioned" value={viewLead.loanSanctionedAt ? String(viewLead.loanSanctionedAt).slice(0, 10) : null} />
                  <DetailRow label="Loan disbursed" value={viewLead.loanDisbursedAt ? String(viewLead.loanDisbursedAt).slice(0, 10) : null} />
                  <DetailRow label="Loan disbursed amount" value={viewLead.loanDisbursed} />
                  <DetailRow label="Status" value={viewLead.status} />
                  <DetailRow label="Notes" value={viewLead.notes} />
                </div>
              </div>
              {(viewLead.payoutPercent ?? viewLead.payoutAmount ?? viewLead.reconsil ?? viewLead.paymentStatus) && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Payout &amp; payment (admin)</h3>
                  <div className="space-y-0 text-sm">
                    <DetailRow label="Payout %" value={viewLead.payoutPercent} />
                    <DetailRow label="Payout amount" value={viewLead.payoutAmount} />
                    <DetailRow label="Reconsil" value={viewLead.reconsil} />
                    <DetailRow label="Payment status" value={viewLead.paymentStatus} />
                  </div>
                </div>
              )}
              <div className="pt-2">
                <p className="text-xs text-slate-500">
                  Logged by: {employees.find((e) => e.id === viewLead.employeeId)?.fullName || employees.find((e) => e.id === viewLead.employeeId)?.username || viewLead.employeeId}
                  {employees.find((e) => e.id === viewLead.employeeId)?.employeeNumber && ` (ID: ${employees.find((e) => e.id === viewLead.employeeId)?.employeeNumber})`}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewLead(null)}>
              Close
            </Button>
            {viewLead && (
              <Button variant="outline" onClick={() => { setViewLead(null); openEdit(leads.find((l) => l.id === viewLead.id) ?? viewLead); }}>
                Edit admin fields
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteLead} onOpenChange={(open) => !open && setDeleteLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this lead. Attendance count for the employee on that date will be updated. This cannot be undone.
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
            <DialogTitle>Admin: Payout &amp; Payment Status</DialogTitle>
            <DialogDescription>
              Update payout and whether payment is received from bank. Only admins can edit these.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payout %</Label>
              <Input
                placeholder="e.g. 0.02"
                value={adminForm.payoutPercent}
                onChange={(e) => setAdminForm((f) => ({ ...f, payoutPercent: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Payout Amount</Label>
              <Input
                placeholder="Amount"
                value={adminForm.payoutAmount}
                onChange={(e) => setAdminForm((f) => ({ ...f, payoutAmount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Reconsil</Label>
              <Select
                value={adminForm.reconsil || undefined}
                onValueChange={(v) => setAdminForm((f) => ({ ...f, reconsil: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {RECONSIL_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Status (received from bank)</Label>
              <Select
                value={adminForm.paymentStatus || undefined}
                onValueChange={(v) => setAdminForm((f) => ({ ...f, paymentStatus: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

function formatDate(dateStr: string): string {
  try {
    const s = String(dateStr).slice(0, 10);
    return s || "—";
  } catch {
    return "—";
  }
}

function getMonthStart(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}
