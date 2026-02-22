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
import { Plus, ArrowLeft, FileText, Shield } from "lucide-react";
import {
  LOAN_TYPES,
  INCOME_TYPES,
  LOAN_STATUSES,
  BANKS_NBFCS,
  INSURANCE_TYPES,
  INSURANCE_STATUSES,
} from "@/data/leadFormOptions";

type Lead = {
  id: string;
  date: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  location: string | null;
  loanType: string | null;
  incomeType: string | null;
  amount: string | null;
  cibil: string | null;
  docsCollected: string | null;
  companyLogged: string | null;
  roi: string | null;
  loanDisbursed: string | null;
  status: string;
  notes: string | null;
};

type InsuranceLead = {
  id: string;
  date: string;
  customerName: string | null;
  contactNum: string | null;
  mailId: string | null;
  location: string | null;
  insuranceType: string | null;
  incomeType: string | null;
  premiumQuoted: string | null;
  premiumCollected: string | null;
  status: string;
  notes: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

const defaultLoanForm = () => ({
  date: today(),
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  location: "",
  loanType: "",
  incomeType: "",
  amount: "",
  cibil: "",
  docsCollected: "",
  companyLogged: "",
  roi: "",
  loanDisbursed: "",
  status: "Open",
  notes: "",
});

const defaultInsuranceForm = () => ({
  date: today(),
  customerName: "",
  contactNum: "",
  mailId: "",
  location: "",
  insuranceType: "",
  incomeType: "",
  premiumQuoted: "",
  premiumCollected: "",
  status: "Open",
  notes: "",
});

export default function StaffMyLeads() {
  const { toast } = useToast();
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
      .catch(() => toast({ title: "Failed to load leads", variant: "destructive" }))
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
    setSaving(true);
    try {
      await staffJson("/staff/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: loanForm.date,
          customerName: loanForm.customerName || null,
          customerPhone: loanForm.customerPhone || null,
          customerEmail: loanForm.customerEmail || null,
          location: loanForm.location || null,
          loanType: loanForm.loanType || null,
          incomeType: loanForm.incomeType || null,
          amount: loanForm.amount || null,
          cibil: loanForm.cibil || null,
          docsCollected: loanForm.docsCollected || null,
          companyLogged: loanForm.companyLogged || null,
          roi: loanForm.roi || null,
          loanDisbursed: loanForm.loanDisbursed || null,
          status: loanForm.status || "open",
          notes: loanForm.notes || null,
        }),
      });
      toast({ title: "Loan lead added" });
      setOpen(false);
      setLoanForm(defaultLoanForm());
      load();
    } catch (err) {
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
          contactNum: insuranceForm.contactNum || null,
          mailId: insuranceForm.mailId || null,
          location: insuranceForm.location || null,
          insuranceType: insuranceForm.insuranceType || null,
          incomeType: insuranceForm.incomeType || null,
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
          <CardDescription>Add 2+ loan leads per day to be marked present.</CardDescription>
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
                      <th className="text-left py-2">Contact</th>
                      <th className="text-left py-2">Loan type</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.id} className="border-b">
                        <td className="py-2">{l.date}</td>
                        <td className="py-2">{l.customerName ?? "—"}</td>
                        <td className="py-2">{l.customerPhone ?? "—"}</td>
                        <td className="py-2">{l.loanType ?? "—"}</td>
                        <td className="py-2">{l.amount ?? "—"}</td>
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
              <form onSubmit={handleLoanSubmit} className="space-y-3">
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
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Contact num</Label>
                    <Input
                      value={loanForm.customerPhone}
                      onChange={(e) => setLoanForm((f) => ({ ...f, customerPhone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Mail ID</Label>
                    <Input
                      type="email"
                      value={loanForm.customerEmail}
                      onChange={(e) => setLoanForm((f) => ({ ...f, customerEmail: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Location</Label>
                  <Input
                    value={loanForm.location}
                    onChange={(e) => setLoanForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Loan type</Label>
                    <Select
                      value={loanForm.loanType || undefined}
                      onValueChange={(v) => setLoanForm((f) => ({ ...f, loanType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
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
                    <Label>Income type</Label>
                    <Select
                      value={loanForm.incomeType || undefined}
                      onValueChange={(v) => setLoanForm((f) => ({ ...f, incomeType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
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
                  <Label>Docs collected</Label>
                  <Input
                    value={loanForm.docsCollected}
                    onChange={(e) => setLoanForm((f) => ({ ...f, docsCollected: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Company logged</Label>
                  <Select
                    value={loanForm.companyLogged || undefined}
                    onValueChange={(v) => setLoanForm((f) => ({ ...f, companyLogged: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Banks & NBFCs" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS_NBFCS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>ROI</Label>
                    <Input
                      value={loanForm.roi}
                      onChange={(e) => setLoanForm((f) => ({ ...f, roi: e.target.value }))}
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
                <DialogFooter>
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
                        setInsuranceForm((f) => ({ ...f, insuranceType: v }))
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
                    <Label>Income type</Label>
                    <Select
                      value={insuranceForm.incomeType || undefined}
                      onValueChange={(v) =>
                        setInsuranceForm((f) => ({ ...f, incomeType: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
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
