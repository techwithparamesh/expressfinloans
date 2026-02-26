import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { staffJson } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useMyDashboardInvalidate } from "./staff-layout";
import { Plus, ArrowLeft, FileText, Shield } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  LOAN_TYPES,
  LOAN_TYPE_SUBTYPES,
  INCOME_TYPES,
  LOAN_STATUSES,
  BANKS_NBFCS,
  BANKS_LOGGED,
  INSURANCE_TYPES,
  INSURANCE_TYPE_SUBTYPES,
  PROFILE_TYPES,
  INSURANCE_STATUSES,
} from "@/data/leadFormOptions";

type Lead = {
  id: string;
  date: string;
  customerName: string | null;
  dateOfBirth: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  location: string | null;
  loanType: string | null;
  subLoanType: string | null;
  incomeType: string | null;
  incomeComments: string | null;
  amount: string | null;
  cibil: string | null;
  companyLogged: string | null;
  tenure: string | null;
  roi: string | null;
  loanDisbursed: string | null;
  loanSanctionedAt: string | null;
  loanDisbursedAt: string | null;
  status: string;
  notes: string | null;
};

type InsuranceLead = {
  id: string;
  date: string;
  customerName: string | null;
  dateOfBirth: string | null;
  contactNum: string | null;
  mailId: string | null;
  location: string | null;
  insuranceType: string | null;
  insuranceSubtype: string | null;
  profileType: string | null;
  profileComments: string | null;
  premiumQuoted: string | null;
  premiumCollected: string | null;
  status: string;
  notes: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

/** Days between two YYYY-MM-DD date strings. Returns null if either is missing. */
function daysBetween(from: string, to: string): number | null {
  if (!from || !to) return null;
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  const diff = Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
  return diff >= 0 ? diff : null;
}

const defaultLoanForm = () => ({
  date: today(),
  customerName: "",
  dateOfBirth: "",
  customerPhone: "",
  customerEmail: "",
  location: "",
  loanType: "",
  subLoanType: "",
  incomeType: "",
  incomeComments: "",
  amount: "",
  cibil: "",
  companyLogged: "",
  bankOthers: "",
  tenure: "",
  roi: "",
  loanDisbursed: "",
  loanSanctionedAt: "",
  loanDisbursedAt: "",
  status: "Open",
  notes: "",
});

const defaultInsuranceForm = () => ({
  date: today(),
  customerName: "",
  dateOfBirth: "",
  contactNum: "",
  mailId: "",
  location: "",
  insuranceType: "",
  insuranceSubtype: "",
  profileType: "",
  profileComments: "",
  premiumQuoted: "",
  premiumCollected: "",
  status: "Open",
  notes: "",
});

export default function StaffMyLeads() {
  const { toast } = useToast();
  const { invalidateMyDashboard } = useMyDashboardInvalidate() ?? {};
  const [leads, setLeads] = useState<Lead[]>([]);
  const [insuranceLeads, setInsuranceLeads] = useState<InsuranceLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"choice" | "loan" | "insurance">("choice");
  const [saving, setSaving] = useState(false);
  const [loanForm, setLoanForm] = useState(defaultLoanForm);
  const [insuranceForm, setInsuranceForm] = useState(defaultInsuranceForm);

  function load() {
    setLoading(true);
    const from = getMonthStart();
    const to = today();
    Promise.all([
      staffJson<Lead[]>("/staff/leads/me?from=" + from + "&to=" + to),
      staffJson<InsuranceLead[]>("/staff/insurance-leads/me?from=" + from + "&to=" + to),
    ])
      .then(([loanList, insList]) => {
        setLeads(loanList);
        setInsuranceLeads(insList);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load leads";
        toast({ title: msg, variant: "destructive", description: msg.includes("Database schema") ? "See docs/MYSQL_VPS_COMMANDS.md" : undefined });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  function openDialog() {
    setStep("choice");
    setLoanForm(defaultLoanForm());
    setInsuranceForm(defaultInsuranceForm());
    setOpen(true);
  }

  async function handleLoanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loanForm.dateOfBirth?.trim()) {
      toast({ title: "Date of Birth is required", variant: "destructive" });
      return;
    }
    if (!loanForm.loanType?.trim()) {
      toast({ title: "Loan type is required", variant: "destructive" });
      return;
    }
    if (!loanForm.subLoanType?.trim()) {
      toast({ title: "Sub loan type is required", variant: "destructive" });
      return;
    }
    if (!loanForm.incomeType?.trim()) {
      toast({ title: "Income type is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await staffJson("/staff/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: loanForm.date,
          customerName: loanForm.customerName || null,
          dateOfBirth: loanForm.dateOfBirth?.trim() || null,
          customerPhone: loanForm.customerPhone || null,
          customerEmail: loanForm.customerEmail || null,
          location: loanForm.location || null,
          loanType: loanForm.loanType || null,
          subLoanType: loanForm.subLoanType || null,
          incomeType: loanForm.incomeType || null,
          incomeComments: loanForm.incomeComments?.trim() || null,
          amount: loanForm.amount || null,
          cibil: loanForm.cibil || null,
          companyLogged: loanForm.companyLogged === "OTHERS" ? (loanForm.bankOthers?.trim() || "OTHERS") : (loanForm.companyLogged || null),
          tenure: loanForm.tenure?.trim() || null,
          roi: loanForm.roi || null,
          loanDisbursed: loanForm.loanDisbursed || null,
          loanSanctionedAt: loanForm.loanSanctionedAt?.trim() || null,
          loanDisbursedAt: loanForm.loanDisbursedAt?.trim() || null,
          status: loanForm.status || "open",
          notes: loanForm.notes || null,
        }),
      });
      toast({ title: "Loan lead added" });
      setOpen(false);
      setLoanForm(defaultLoanForm());
      load();
      invalidateMyDashboard?.();
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleInsuranceSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await staffJson("/staff/insurance-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: insuranceForm.date,
          customerName: insuranceForm.customerName || null,
          dateOfBirth: insuranceForm.dateOfBirth?.trim() || null,
          contactNum: insuranceForm.contactNum || null,
          mailId: insuranceForm.mailId || null,
          location: insuranceForm.location || null,
          insuranceType: insuranceForm.insuranceType || null,
          insuranceSubtype: insuranceForm.insuranceSubtype || null,
          profileType: insuranceForm.profileType || null,
          profileComments: insuranceForm.profileComments?.trim() || null,
          premiumQuoted: insuranceForm.premiumQuoted || null,
          premiumCollected: insuranceForm.premiumCollected || null,
          status: insuranceForm.status || "open",
          notes: insuranceForm.notes || null,
        }),
      });
      toast({ title: "Insurance lead added" });
      setOpen(false);
      setInsuranceForm(defaultInsuranceForm());
      load();
      invalidateMyDashboard?.();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My leads</h1>
        <Button onClick={openDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Lead form
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads this month</CardTitle>
          <CardDescription>Add 2 or more loan leads per day to be marked present.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="loan">
            <TabsList>
              <TabsTrigger value="loan">Loan leads</TabsTrigger>
              <TabsTrigger value="insurance">Insurance leads</TabsTrigger>
            </TabsList>
            <TabsContent value="loan" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Customer</th>
                      <th className="text-left py-2">DOB</th>
                      <th className="text-left py-2">Contact</th>
                      <th className="text-left py-2">Loan type</th>
                      <th className="text-left py-2">Sub type</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Tenure</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.id} className="border-b">
                        <td className="py-2">{l.date}</td>
                        <td className="py-2">{l.customerName ?? "—"}</td>
                        <td className="py-2">{l.dateOfBirth ?? "—"}</td>
                        <td className="py-2">{l.customerPhone ?? "—"}</td>
                        <td className="py-2">{l.loanType ?? "—"}</td>
                        <td className="py-2">{l.subLoanType ?? "—"}</td>
                        <td className="py-2">{l.amount ?? "—"}</td>
                        <td className="py-2">{l.tenure ?? "—"}</td>
                        <td className="py-2">{l.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="insurance" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Customer</th>
                      <th className="text-left py-2">Contact</th>
                      <th className="text-left py-2">Insurance type</th>
                      <th className="text-left py-2">Premium quoted</th>
                      <th className="text-left py-2">Premium collected</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insuranceLeads.map((l) => (
                      <tr key={l.id} className="border-b">
                        <td className="py-2">{l.date}</td>
                        <td className="py-2">{l.customerName ?? "—"}</td>
                        <td className="py-2">{l.contactNum ?? "—"}</td>
                        <td className="py-2">{l.insuranceType ?? "—"}</td>
                        <td className="py-2">{l.premiumQuoted ?? "—"}</td>
                        <td className="py-2">{l.premiumCollected ?? "—"}</td>
                        <td className="py-2">{l.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {step === "choice" && (
            <>
              <DialogHeader>
                <DialogTitle>Lead form</DialogTitle>
                <DialogDescription>Choose the type of lead to add.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => setStep("loan")}
                >
                  <FileText className="h-8 w-8" />
                  <span>Loans</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => setStep("insurance")}
                >
                  <Shield className="h-8 w-8" />
                  <span>Insurance</span>
                </Button>
              </div>
            </>
          )}

          {step === "loan" && (
            <>
              <DialogHeader className="flex flex-row items-center gap-2">
                <Button type="button" variant="ghost" size="icon" onClick={() => setStep("choice")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle>Loan lead</DialogTitle>
                  <DialogDescription>Add a new loan lead.</DialogDescription>
                </div>
              </DialogHeader>
              <form onSubmit={handleLoanSubmit} className="space-y-6">
                {/* Basic Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Basic Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={loanForm.date}
                        onChange={(e) => setLoanForm((f) => ({ ...f, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Customer name</Label>
                      <Input
                        value={loanForm.customerName}
                        onChange={(e) => setLoanForm((f) => ({ ...f, customerName: e.target.value }))}
                        placeholder="Full name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="loan-dob">Date of Birth <span className="text-red-500">*</span></Label>
                      <Input
                        id="loan-dob"
                        type="date"
                        value={loanForm.dateOfBirth}
                        onChange={(e) => setLoanForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Contact num</Label>
                      <Input
                        value={loanForm.customerPhone}
                        onChange={(e) => setLoanForm((f) => ({ ...f, customerPhone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Mail ID</Label>
                      <Input
                        type="email"
                        value={loanForm.customerEmail}
                        onChange={(e) => setLoanForm((f) => ({ ...f, customerEmail: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Location</Label>
                      <Input
                        value={loanForm.location}
                        onChange={(e) => setLoanForm((f) => ({ ...f, location: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Income Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Income Details</h3>
                  <div className="space-y-1">
                    <Label>Income type <span className="text-red-500">*</span></Label>
                    <Select
                      value={loanForm.incomeType || undefined}
                      onValueChange={(v) => setLoanForm((f) => ({ ...f, incomeType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select income type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INCOME_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {loanForm.incomeType && (
                    <div className="space-y-1">
                      <Label htmlFor="income-comments">Comments</Label>
                      <Textarea
                        id="income-comments"
                        name="income_comments"
                        value={loanForm.incomeComments}
                        onChange={(e) => setLoanForm((f) => ({ ...f, incomeComments: e.target.value }))}
                        placeholder="Enter additional details if required"
                        className="min-h-[80px] resize-y"
                      />
                    </div>
                  )}
                </div>

                {/* Loan Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Loan Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Loan type <span className="text-red-500">*</span></Label>
                      <Select
                        value={loanForm.loanType || undefined}
                        onValueChange={(v) => setLoanForm((f) => ({ ...f, loanType: v, subLoanType: "" }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select loan type" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOAN_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Sub loan type <span className="text-red-500">*</span></Label>
                      <Select
                        value={loanForm.subLoanType || undefined}
                        onValueChange={(v) => setLoanForm((f) => ({ ...f, subLoanType: v }))}
                        disabled={!loanForm.loanType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loanForm.loanType ? "Select sub type" : "Select loan type first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {loanForm.loanType && LOAN_TYPE_SUBTYPES[loanForm.loanType as keyof typeof LOAN_TYPE_SUBTYPES]?.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Required amount</Label>
                      <Input
                        value={loanForm.amount}
                        onChange={(e) => setLoanForm((f) => ({ ...f, amount: e.target.value }))}
                        placeholder="e.g. 1000000"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>CIBIL</Label>
                      <Input
                        value={loanForm.cibil}
                        onChange={(e) => setLoanForm((f) => ({ ...f, cibil: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Bank logged</Label>
                    <Select
                      value={loanForm.companyLogged && (BANKS_LOGGED as readonly string[]).includes(loanForm.companyLogged) ? loanForm.companyLogged : loanForm.companyLogged ? "OTHERS" : undefined}
                      onValueChange={(v) => setLoanForm((f) => ({ ...f, companyLogged: v, bankOthers: v === "OTHERS" ? f.bankOthers : "" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px] overflow-y-auto">
                        {BANKS_LOGGED.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {loanForm.companyLogged === "OTHERS" && (
                    <div className="space-y-1">
                      <Label htmlFor="bank-others">Others</Label>
                      <Input
                        id="bank-others"
                        value={loanForm.bankOthers}
                        onChange={(e) => setLoanForm((f) => ({ ...f, bankOthers: e.target.value }))}
                        placeholder="Enter bank name manually"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Tenure</Label>
                      <Input
                        value={loanForm.tenure}
                        onChange={(e) => setLoanForm((f) => ({ ...f, tenure: e.target.value }))}
                        placeholder="e.g. 12 months"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Loan Amount</Label>
                      <Input
                        value={loanForm.loanDisbursed}
                        onChange={(e) => setLoanForm((f) => ({ ...f, loanDisbursed: e.target.value }))}
                        placeholder="e.g. 1000000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Lead status</Label>
                      <Select
                        value={loanForm.status || undefined}
                        onValueChange={(v) => setLoanForm((f) => ({ ...f, status: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOAN_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Remarks</Label>
                      <Input
                        value={loanForm.notes}
                        onChange={(e) => setLoanForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1 max-w-xs">
                      <Label>ROI</Label>
                      <Input
                        value={loanForm.roi}
                        onChange={(e) => setLoanForm((f) => ({ ...f, roi: e.target.value }))}
                        placeholder="e.g. 10.5"
                      />
                    </div>
                    <h4 className="text-sm font-medium text-slate-700">Loan Sanctioned / Disbursed</h4>
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-slate-50">
                            <th className="text-left py-2 px-3 font-medium w-[140px]">Stage</th>
                            <th className="text-left py-2 px-3 font-medium">Add date</th>
                            <th className="text-left py-2 px-3 font-medium">TAT</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2 px-3 font-medium">Loan Sanctioned</td>
                            <td className="py-2 px-3">
                              <Input
                                type="date"
                                value={loanForm.loanSanctionedAt}
                                onChange={(e) => setLoanForm((f) => ({ ...f, loanSanctionedAt: e.target.value }))}
                                className="max-w-[180px]"
                              />
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {daysBetween(loanForm.date, loanForm.loanSanctionedAt) != null
                                ? `${daysBetween(loanForm.date, loanForm.loanSanctionedAt)} days`
                                : "—"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">Loan Disbursed</td>
                            <td className="py-2 px-3">
                              <Input
                                type="date"
                                value={loanForm.loanDisbursedAt}
                                onChange={(e) => setLoanForm((f) => ({ ...f, loanDisbursedAt: e.target.value }))}
                                className="max-w-[180px]"
                              />
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {loanForm.loanSanctionedAt
                                ? daysBetween(loanForm.loanSanctionedAt, loanForm.loanDisbursedAt) != null
                                  ? `${daysBetween(loanForm.loanSanctionedAt, loanForm.loanDisbursedAt)} days`
                                  : "—"
                                : loanForm.loanDisbursedAt && loanForm.date
                                  ? `${daysBetween(loanForm.date, loanForm.loanDisbursedAt)} days (from lead date)`
                                  : "—"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep("choice")}>
                    Back
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Add loan lead"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}

          {step === "insurance" && (
            <>
              <DialogHeader className="flex flex-row items-center gap-2">
                <Button type="button" variant="ghost" size="icon" onClick={() => setStep("choice")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle>Insurance lead</DialogTitle>
                  <DialogDescription>Add a new insurance lead.</DialogDescription>
                </div>
              </DialogHeader>
              <form onSubmit={handleInsuranceSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={insuranceForm.date}
                      onChange={(e) => setInsuranceForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Customer name</Label>
                    <Input
                      value={insuranceForm.customerName}
                      onChange={(e) =>
                        setInsuranceForm((f) => ({ ...f, customerName: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Date of birth</Label>
                    <Input
                      type="date"
                      value={insuranceForm.dateOfBirth}
                      onChange={(e) =>
                        setInsuranceForm((f) => ({ ...f, dateOfBirth: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Contact num</Label>
                    <Input
                      value={insuranceForm.contactNum}
                      onChange={(e) =>
                        setInsuranceForm((f) => ({ ...f, contactNum: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Mail ID</Label>
                    <Input
                      type="email"
                      value={insuranceForm.mailId}
                      onChange={(e) =>
                        setInsuranceForm((f) => ({ ...f, mailId: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Location</Label>
                  <Input
                    value={insuranceForm.location}
                    onChange={(e) =>
                      setInsuranceForm((f) => ({ ...f, location: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Insurance type</Label>
                    <Select
                      value={insuranceForm.insuranceType || undefined}
                      onValueChange={(v) =>
                        setInsuranceForm((f) => ({
                          ...f,
                          insuranceType: v,
                          insuranceSubtype: "",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {INSURANCE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Insurance subtype</Label>
                    <Select
                      value={insuranceForm.insuranceSubtype || undefined}
                      onValueChange={(v) =>
                        setInsuranceForm((f) => ({ ...f, insuranceSubtype: v }))
                      }
                      disabled={!insuranceForm.insuranceType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type first" />
                      </SelectTrigger>
                      <SelectContent>
                        {insuranceForm.insuranceType &&
                          INSURANCE_TYPE_SUBTYPES[
                            insuranceForm.insuranceType as keyof typeof INSURANCE_TYPE_SUBTYPES
                          ]?.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Profile type</Label>
                    <Select
                      value={insuranceForm.profileType || undefined}
                      onValueChange={(v) =>
                        setInsuranceForm((f) => ({ ...f, profileType: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROFILE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Profile comments</Label>
                  <Textarea
                    placeholder="Add any comments based on profile type selection (optional)"
                    value={insuranceForm.profileComments}
                    onChange={(e) =>
                      setInsuranceForm((f) => ({ ...f, profileComments: e.target.value }))
                    }
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Premium quoted</Label>
                    <Input
                      value={insuranceForm.premiumQuoted}
                      onChange={(e) =>
                        setInsuranceForm((f) => ({ ...f, premiumQuoted: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Premium collected</Label>
                    <Input
                      value={insuranceForm.premiumCollected}
                      onChange={(e) =>
                        setInsuranceForm((f) => ({ ...f, premiumCollected: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={insuranceForm.status || undefined}
                    onValueChange={(v) =>
                      setInsuranceForm((f) => ({ ...f, status: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {INSURANCE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Input
                    value={insuranceForm.notes}
                    onChange={(e) =>
                      setInsuranceForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setStep("choice")}>
                    Back
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Add insurance lead"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
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
