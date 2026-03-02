import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Receipt } from "lucide-react";

const PURPOSES = ["Rent", "Electricity Bill", "Water Bill", "Other"] as const;

const MONTH_OPTIONS = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12",
] as const;
const MONTH_LABELS: Record<string, string> = {
  "01": "January", "02": "February", "03": "March", "04": "April", "05": "May", "06": "June",
  "07": "July", "08": "August", "09": "September", "10": "October", "11": "November", "12": "December",
};

function getYearOptions() {
  const y = new Date().getFullYear();
  return [y + 1, y, y - 1, y - 2].map(String);
}

function formatMonthLabel(ym: string) {
  if (!ym || ym.length < 7) return ym;
  const [y, m] = ym.split("-");
  const monthIdx = parseInt(m, 10) - 1;
  if (Number.isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return ym;
  const name = MONTH_LABELS[m] || m;
  return `${name} ${y}`;
}

type AdminExpense = {
  id: string;
  purpose: string;
  purposeOther?: string | null;
  purpose_other?: string | null;
  address: string | null;
  month: string;
  amount: string | null;
  paymentDate: string | null;
  payment_date?: string | null;
  transactionDetail: string | null;
  transaction_detail?: string | null;
  bankName: string | null;
  bank_name?: string | null;
  remarks: string | null;
  createdAt?: string;
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const defaultForm = (): Record<string, string> => ({
  purpose: "",
  purposeOther: "",
  address: "",
  month: currentMonth(),
  amount: "",
  paymentDate: "",
  transactionDetail: "",
  bankName: "",
  remarks: "",
});

export default function StaffAdminExpenses() {
  const { toast } = useToast();
  const [list, setList] = useState<AdminExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonth());
  const [purpose, setPurpose] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState<AdminExpense | null>(null);

  function load() {
    setLoading(true);
    let url = "/staff/admin-expenses?month=" + encodeURIComponent(month);
    if (purpose) url += "&purpose=" + encodeURIComponent(purpose);
    staffJson<AdminExpense[]>(url)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), [month, purpose]);

  function openAdd() {
    setEditId(null);
    setForm({ ...defaultForm(), month: month || currentMonth() });
    setOpen(true);
  }

  function openEdit(row: AdminExpense) {
    setEditId(row.id);
    setForm({
      purpose: row.purpose || "",
      purposeOther: row.purposeOther ?? row.purpose_other ?? "",
      address: row.address ?? "",
      month: row.month || currentMonth(),
      amount: row.amount ?? "",
      paymentDate: (row.paymentDate ?? row.payment_date ?? "").toString().slice(0, 10),
      transactionDetail: row.transactionDetail ?? row.transaction_detail ?? "",
      bankName: row.bankName ?? row.bank_name ?? "",
      remarks: row.remarks ?? "",
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        purpose: form.purpose.trim(),
        purposeOther: form.purpose === "Other" ? (form.purposeOther.trim() || null) : null,
        month: form.month.trim().slice(0, 7),
        address: form.address.trim() || null,
        amount: form.amount.trim() || null,
        paymentDate: form.paymentDate.trim().slice(0, 10) || null,
        transactionDetail: form.transactionDetail.trim() || null,
        bankName: form.bankName.trim() || null,
        remarks: form.remarks.trim() || null,
      };
      if (editId) {
        await staffFetch("/staff/admin-expenses/" + editId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        toast({ title: "Expense updated" });
      } else {
        await staffFetch("/staff/admin-expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        toast({ title: "Expense added" });
      }
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteRow) return;
    setSaving(true);
    try {
      await staffFetch("/staff/admin-expenses/" + deleteRow.id, { method: "DELETE" });
      toast({ title: "Expense deleted" });
      setDeleteRow(null);
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to delete", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const paymentDate = (row: AdminExpense) => row.paymentDate ?? row.payment_date ?? null;
  const transactionDetail = (row: AdminExpense) => row.transactionDetail ?? row.transaction_detail ?? null;
  const bankName = (row: AdminExpense) => row.bankName ?? row.bank_name ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="h-7 w-7 text-amber-600" />
          Admin Expenses
        </h1>
        <p className="text-slate-600 mt-0.5">Record office expenses: rent, electricity, water, and other.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by month and purpose.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Month</Label>
            <div className="flex gap-2 items-center">
              <Select
                value={month ? month.slice(5, 7) : ""}
                onValueChange={(mm) => setMonth(month ? `${month.slice(0, 4)}-${mm}` : `${new Date().getFullYear()}-${mm}`)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((mm) => (
                    <SelectItem key={mm} value={mm}>
                      {MONTH_LABELS[mm]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={month ? month.slice(0, 4) : ""}
                onValueChange={(yy) => setMonth(month ? `${yy}-${month.slice(5, 7)}` : `${yy}-${String(new Date().getMonth() + 1).padStart(2, "0")}`)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {getYearOptions().map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Purpose</Label>
            <Select value={purpose || "all"} onValueChange={(v) => setPurpose(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {PURPOSES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>
                {list.length} expense{list.length !== 1 ? "s" : ""} in selected period.
              </CardDescription>
            </div>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-500 py-4">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-slate-500 py-4">No expenses found. Click &quot;Add expense&quot; to add one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700">Purpose</th>
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700">Address</th>
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700">Month</th>
                    <th className="text-right py-2.5 px-3 font-medium text-slate-700 tabular-nums">Amount</th>
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700">Payment date</th>
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700">Transaction detail</th>
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700">Bank name</th>
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700">Remarks</th>
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700 w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        {row.purpose === "Other" && (row.purposeOther ?? row.purpose_other) ? `Other: ${row.purposeOther ?? row.purpose_other}` : row.purpose}
                      </td>
                      <td className="py-2.5 px-3 max-w-[180px] truncate" title={row.address ?? undefined}>
                        {row.address ?? "—"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{formatMonthLabel(row.month)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-medium">
                        {row.amount != null && row.amount !== "" ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(String(row.amount).replace(/,/g, ""))) : "—"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{paymentDate(row) ? String(paymentDate(row)).slice(0, 10) : "—"}</td>
                      <td className="py-2.5 px-3 max-w-[160px] truncate" title={transactionDetail(row) ?? undefined}>
                        {transactionDetail(row) ?? "—"}
                      </td>
                      <td className="py-2.5 px-3">{bankName(row) ?? "—"}</td>
                      <td className="py-2.5 px-3 max-w-[140px] truncate" title={row.remarks ?? undefined}>
                        {row.remarks ?? "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => setDeleteRow(row)} aria-label="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit expense" : "Add expense"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purpose *</Label>
                <Select
                  value={form.purpose || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, purpose: v, purposeOther: v === "Other" ? f.purposeOther : "" }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PURPOSES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Month *</Label>
                <div className="flex gap-2">
                  <Select
                    value={form.month ? form.month.slice(5, 7) : ""}
                    onValueChange={(mm) => setForm((f) => ({ ...f, month: f.month ? `${f.month.slice(0, 4)}-${mm}` : `${new Date().getFullYear()}-${mm}` }))}
                    required
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_OPTIONS.map((mm) => (
                        <SelectItem key={mm} value={mm}>
                          {MONTH_LABELS[mm]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={form.month ? form.month.slice(0, 4) : ""}
                    onValueChange={(yy) => setForm((f) => ({ ...f, month: f.month ? `${yy}-${f.month.slice(5, 7)}` : `${yy}-${String(new Date().getMonth() + 1).padStart(2, "0")}` }))}
                    required
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {getYearOptions().map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {form.purpose === "Other" && (
              <div className="space-y-2">
                <Label>Specify other purpose</Label>
                <Input
                  value={form.purposeOther}
                  onChange={(e) => setForm((f) => ({ ...f, purposeOther: e.target.value }))}
                  placeholder="e.g. Internet, Stationery, Maintenance"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Address or location"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="text"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 25000"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment date</Label>
                <Input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
                  className="[color-scheme:light]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Transaction detail</Label>
              <Input
                value={form.transactionDetail}
                onChange={(e) => setForm((f) => ({ ...f, transactionDetail: e.target.value }))}
                placeholder="Reference or transaction ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Bank name</Label>
              <Input
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                placeholder="Bank or payment method"
              />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={form.remarks}
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                placeholder="Optional notes"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !form.purpose.trim() || !form.month.trim()}>
                {saving ? "Saving…" : editId ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRow} onOpenChange={(open) => !open && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this expense record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700" disabled={saving}>
              {saving ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
