import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { staffJson } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Settings, FileText, Download } from "lucide-react";

type Employee = { id: string; username: string; fullName: string | null; employeeNumber: string | null; role: string };
type SalaryStructure = { basic: number; hraPercent: number; specialAllowance: number; conveyance: number; medical: number; employeePfPercent: number; ptAmount: number };
type PayrollEntry = { id: string; employeeId: string; period: string; incentives: number; deductionsOther: number; tdsAmount?: number; absentDays: number; notes?: string };
type PayslipRow = { id: string; employeeId: string; period: string; totalEarnings: number; totalDeductions: number; netPay: number; generatedAt: string };

const MONTH_OPTIONS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const;
const MONTH_LABELS: Record<string, string> = {
  "01": "January", "02": "February", "03": "March", "04": "April", "05": "May", "06": "June",
  "07": "July", "08": "August", "09": "September", "10": "October", "11": "November", "12": "December",
};

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatPeriod(ym: string): string {
  if (!ym || ym.length < 7) return ym;
  const [y, m] = ym.split("-");
  return `${MONTH_LABELS[m] || m} ${y}`;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

export default function StaffPayroll() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [period, setPeriod] = useState(currentPeriod());
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [payslips, setPayslips] = useState<PayslipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [structureOpen, setStructureOpen] = useState(false);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [structureForm, setStructureForm] = useState<SalaryStructure>({
    basic: 0, hraPercent: 0, specialAllowance: 0, conveyance: 0, medical: 0, employeePfPercent: 12, ptAmount: 0,
  });
  const [payrollForm, setPayrollForm] = useState({ incentives: 0, deductionsOther: 0, tdsAmount: "", absentDays: 0, notes: "" });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [companyName, setCompanyName] = useState("Express Financial Services");
  const [companyAddress, setCompanyAddress] = useState("");

  function loadEmployees() {
    staffJson<Employee[]>("/staff/employees").then(setEmployees).catch(() => setEmployees([]));
  }

  function loadEntries() {
    if (!period) return;
    staffJson<PayrollEntry[]>(`/staff/payroll-entries?period=${encodeURIComponent(period)}`).then(setEntries).catch(() => setEntries([]));
  }

  function loadPayslips() {
    if (!period) return;
    staffJson<PayslipRow[]>(`/staff/payslips?period=${encodeURIComponent(period)}`).then(setPayslips).catch(() => setPayslips([]));
  }

  useEffect(() => {
    setLoading(true);
    loadEmployees();
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEntries();
    loadPayslips();
  }, [period]);

  async function openStructure(emp: Employee) {
    setSelectedEmployee(emp);
    setStructureOpen(true);
    try {
      const s = await staffJson<SalaryStructure>(`/staff/salary-structure/${emp.id}`);
      setStructureForm({
        basic: Number(s.basic) || 0,
        hraPercent: Number(s.hraPercent) || 0,
        specialAllowance: Number(s.specialAllowance) || 0,
        conveyance: Number(s.conveyance) || 0,
        medical: Number(s.medical) || 0,
        employeePfPercent: Number(s.employeePfPercent) || 12,
        ptAmount: Number(s.ptAmount) || 0,
      });
    } catch {
      setStructureForm({ basic: 0, hraPercent: 0, specialAllowance: 0, conveyance: 0, medical: 0, employeePfPercent: 12, ptAmount: 0 });
    }
  }

  function openPayroll(emp: Employee) {
    setSelectedEmployee(emp);
    const entry = entries.find((e) => e.employeeId === emp.id);
    setPayrollForm({
      incentives: entry ? Number(entry.incentives) || 0 : 0,
      deductionsOther: entry ? Number(entry.deductionsOther) || 0 : 0,
      tdsAmount: entry && entry.tdsAmount != null ? String(entry.tdsAmount) : "",
      absentDays: entry ? Number(entry.absentDays) || 0 : 0,
      notes: entry?.notes ?? "",
    });
    setPayrollOpen(true);
  }

  async function saveStructure(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      await staffJson("/staff/salary-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmployee.id, ...structureForm }),
      });
      toast({ title: "Salary structure saved" });
      setStructureOpen(false);
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function savePayroll(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      await staffJson("/staff/payroll-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          period,
          incentives: payrollForm.incentives,
          deductionsOther: payrollForm.deductionsOther,
          tdsAmount: payrollForm.tdsAmount === "" ? undefined : Number(payrollForm.tdsAmount),
          absentDays: payrollForm.absentDays,
          notes: payrollForm.notes.trim() || undefined,
        }),
      });
      toast({ title: "Payroll entry saved" });
      setPayrollOpen(false);
      loadEntries();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function generatePayslips() {
    setGenerating(true);
    try {
      const res = await staffJson<{ count: number; period: string }>("/staff/payslips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          companyName: companyName.trim() || undefined,
          companyAddress: companyAddress.trim() || undefined,
        }),
      });
      toast({ title: `${res.count} payslip(s) generated for ${formatPeriod(res.period)}` });
      loadPayslips();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to generate", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  const entryByEmp = Object.fromEntries(entries.map((e) => [e.employeeId, e]));

  async function downloadPdf(id: string, periodSlug: string) {
    try {
      const res = await fetch(`/api/staff/payslips/${id}/file`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${periodSlug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-7 w-7 text-emerald-600" />
          Payroll & Payslips
        </h1>
        <p className="text-slate-600 mt-0.5">Set salary structures, monthly payroll inputs, and generate payslips.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Period</CardTitle>
          <CardDescription>Select the pay month. Set structures and payroll entries, then generate payslips.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label>Month</Label>
            <div className="flex gap-2">
              <select
                className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={period ? period.slice(5, 7) : ""}
                onChange={(e) => setPeriod(period ? `${period.slice(0, 4)}-${e.target.value}` : `${new Date().getFullYear()}-${e.target.value}`)}
              >
                {MONTH_OPTIONS.map((mm) => (
                  <option key={mm} value={mm}>{MONTH_LABELS[mm]}</option>
                ))}
              </select>
              <select
                className="flex h-9 w-[100px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={period ? period.slice(0, 4) : ""}
                onChange={(e) => setPeriod(period ? `${e.target.value}-${period.slice(5, 7)}` : period)}
              >
                {[new Date().getFullYear() + 1, new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>Set salary structure (once) and payroll entry (per month) for each employee. Then generate payslips.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-500 py-4">Loading…</p>
          ) : employees.length === 0 ? (
            <p className="text-slate-500 py-4">No employees found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700">Name</th>
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700">Employee ID</th>
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700 w-[200px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">{emp.fullName || emp.username}</td>
                      <td className="py-2.5 px-3">{emp.employeeNumber ?? "—"}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openStructure(emp)}>
                            <Settings className="h-4 w-4 mr-1" />
                            Set structure
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openPayroll(emp)}>
                            <FileText className="h-4 w-4 mr-1" />
                            Payroll ({entryByEmp[emp.id] ? "Edit" : "Add"})
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

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-2">
              <CardTitle>Generate payslips</CardTitle>
              <CardDescription>Generate PDF payslips for {formatPeriod(period)} for all employees who have a salary structure (and optional payroll entry).</CardDescription>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Company name (on payslip)</label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Express Financial Services"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">Company address (optional, multi-line)</label>
                  <textarea
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Building, Floor, Address, City - PIN"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <Button onClick={generatePayslips} disabled={generating}>
              {generating ? "Generating…" : `Generate payslips for ${formatPeriod(period)}`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <p className="text-slate-500 py-4">No payslips generated for this period yet. Click Generate above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700">Employee ID</th>
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700">Period</th>
                    <th className="text-right py-2.5 px-3 font-medium text-slate-700 tabular-nums">Net Pay</th>
                    <th className="text-left py-2.5 px-3 font-medium text-slate-700 w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((row) => {
                    const emp = employees.find((e) => e.id === row.employeeId);
                    return (
                      <tr key={row.id} className="border-b hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">{emp?.employeeNumber ?? row.employeeId.slice(0, 8)}</td>
                        <td className="py-2.5 px-3">{formatPeriod(row.period)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-medium">₹ {formatMoney(row.netPay)}</td>
                        <td className="py-2.5 px-3">
                          <Button variant="outline" size="sm" onClick={() => downloadPdf(row.id, row.period)}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={structureOpen} onOpenChange={setStructureOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Salary structure {selectedEmployee ? `– ${selectedEmployee.fullName || selectedEmployee.username}` : ""}</DialogTitle>
            <DialogDescription>Earnings and deduction rules. Used to compute payslip.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveStructure} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Basic</Label>
                <Input type="number" min={0} step={1} value={structureForm.basic || ""} onChange={(e) => setStructureForm((s) => ({ ...s, basic: Number(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>HRA %</Label>
                <Input type="number" min={0} max={100} step={0.5} value={structureForm.hraPercent || ""} onChange={(e) => setStructureForm((s) => ({ ...s, hraPercent: Number(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Special allowance</Label>
                <Input type="number" min={0} step={1} value={structureForm.specialAllowance || ""} onChange={(e) => setStructureForm((s) => ({ ...s, specialAllowance: Number(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Conveyance</Label>
                <Input type="number" min={0} step={1} value={structureForm.conveyance || ""} onChange={(e) => setStructureForm((s) => ({ ...s, conveyance: Number(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Medical</Label>
                <Input type="number" min={0} step={1} value={structureForm.medical || ""} onChange={(e) => setStructureForm((s) => ({ ...s, medical: Number(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>PF % (employee)</Label>
                <Input type="number" min={0} max={100} step={0.5} value={structureForm.employeePfPercent || ""} onChange={(e) => setStructureForm((s) => ({ ...s, employeePfPercent: Number(e.target.value) || 12 }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Professional tax (PT)</Label>
              <Input type="number" min={0} step={1} value={structureForm.ptAmount || ""} onChange={(e) => setStructureForm((s) => ({ ...s, ptAmount: Number(e.target.value) || 0 }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStructureOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={payrollOpen} onOpenChange={setPayrollOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payroll entry {selectedEmployee ? `– ${selectedEmployee.fullName || selectedEmployee.username}` : ""} ({formatPeriod(period)})</DialogTitle>
            <DialogDescription>Monthly inputs: incentives, deductions, TDS.</DialogDescription>
          </DialogHeader>
          <form onSubmit={savePayroll} className="space-y-4">
            <div className="space-y-2">
              <Label>Incentives</Label>
              <Input type="number" min={0} step={1} value={payrollForm.incentives || ""} onChange={(e) => setPayrollForm((p) => ({ ...p, incentives: Number(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label>Other deductions</Label>
              <Input type="number" min={0} step={1} value={payrollForm.deductionsOther || ""} onChange={(e) => setPayrollForm((p) => ({ ...p, deductionsOther: Number(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label>TDS (tax)</Label>
              <Input type="number" min={0} step={1} value={payrollForm.tdsAmount} onChange={(e) => setPayrollForm((p) => ({ ...p, tdsAmount: e.target.value }))} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Absent days</Label>
              <Input type="number" min={0} max={31} value={payrollForm.absentDays || ""} onChange={(e) => setPayrollForm((p) => ({ ...p, absentDays: Number(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={payrollForm.notes} onChange={(e) => setPayrollForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayrollOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
