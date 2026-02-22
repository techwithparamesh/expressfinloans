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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { staffJson } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const RECONSIL_OPTIONS = ["Yes Received", "Not Revived", "Not as per Rate"] as const;
const PAYMENT_STATUS_OPTIONS = ["Received", "Pending", "Not Received"] as const;

type Lead = {
  id: string;
  employeeId: string;
  date: string;
  customerName: string | null;
  customerPhone: string | null;
  loanType: string | null;
  amount: string | null;
  status: string;
  payoutPercent: string | null;
  payoutAmount: string | null;
  reconsil: string | null;
  paymentStatus: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function StaffLeads() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(getMonthStart());
  const [to, setTo] = useState(today());
  const [status, setStatus] = useState("");
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);
  const [adminForm, setAdminForm] = useState({
    payoutPercent: "",
    payoutAmount: "",
    reconsil: "",
    paymentStatus: "",
  });

  function load() {
    setLoading(true);
    let url = "/staff/leads?from=" + from + "&to=" + to;
    if (status) url += "&status=" + encodeURIComponent(status);
    staffJson<Lead[]>(url)
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), [from, to, status]);

  function openEdit(l: Lead) {
    setEditLead(l);
    setAdminForm({
      payoutPercent: l.payoutPercent ?? "",
      payoutAmount: l.payoutAmount ?? "",
      reconsil: l.reconsil ?? "",
      paymentStatus: l.paymentStatus ?? "",
    });
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
      <h1 className="text-2xl font-bold">All leads</h1>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by date and status.</CardDescription>
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
          <CardTitle>Leads</CardTitle>
          <CardDescription>All leads across employees. Edit admin fields (payout, reconsil, payment status) per row.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Employee</th>
                  <th className="text-left py-2">Customer</th>
                  <th className="text-left py-2">Phone</th>
                  <th className="text-left py-2">Loan type</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Payout %</th>
                  <th className="text-left py-2">Payout Amount</th>
                  <th className="text-left py-2">Reconsil</th>
                  <th className="text-left py-2">Payment Status</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="py-2">{l.date}</td>
                    <td className="py-2">{l.employeeId.slice(0, 8)}…</td>
                    <td className="py-2">{l.customerName ?? "—"}</td>
                    <td className="py-2">{l.customerPhone ?? "—"}</td>
                    <td className="py-2">{l.loanType ?? "—"}</td>
                    <td className="py-2">{l.amount ?? "—"}</td>
                    <td className="py-2">{l.status}</td>
                    <td className="py-2">{l.payoutPercent ?? "—"}</td>
                    <td className="py-2">{l.payoutAmount ?? "—"}</td>
                    <td className="py-2">{l.reconsil ?? "—"}</td>
                    <td className="py-2">{l.paymentStatus ?? "—"}</td>
                    <td className="py-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(l)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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

function getMonthStart(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}
