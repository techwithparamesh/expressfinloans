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
import { Plus, ArrowLeft, FileText, Shield, MapPin } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  LOAN_TYPES,
  LOAN_TYPE_SUBTYPES,
  INCOME_TYPES,
  LOAN_STATUSES,
  BANKS_NBFCS,
  BANKS_LOGGED,
  INSURANCE_TYPES,
  GENERAL_INSURANCE_SUBTYPES,
  MOTOR_INSURANCE_OPTIONS,
  NON_MOTOR_INSURANCE_OPTIONS,
  INSURANCE_TYPE_SUBTYPES,
  PROFILE_TYPES,
  BUSINESS_TYPES,
  PAYMENT_MODES,
  PAYMENT_DONE_BY,
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
  formLocation?: string | null;
  form_location?: string | null;
  loanType: string | null;
  subLoanType: string | null;
  incomeType: string | null;
  incomeComments: string | null;
  amount: string | null;
  cibil: string | null;
  companyLogged: string | null;
  applicationNumber?: string | null;
  application_number?: string | null;
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
  formLocation?: string | null;
  form_location?: string | null;
  insuranceType: string | null;
  insuranceCategory?: string | null;
  insurance_category?: string | null;
  insuranceProductType?: string | null;
  insurance_product_type?: string | null;
  insuranceProductTypeOther?: string | null;
  vehicleNumber?: string | null;
  vehicle_number?: string | null;
  insuranceSubtype: string | null;
  insuranceSubtypeOther: string | null;
  profileType: string | null;
  profileComments: string | null;
  businessType: string | null;
  businessTypeComments: string | null;
  paymentMode: string | null;
  paymentModeComments: string | null;
  paymentDoneBy: string | null;
  paymentDoneByComments: string | null;
  premiumQuoted: string | null;
  premiumCollected: string | null;
  difference: string | null;
  miscellaneousExpenses: string | null;
  status: string;
  notes: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

/** Get current position if user allows; returns null on deny/error. Required before opening lead form. */
function getCurrentPositionAsync(): Promise<{ latitude: number; longitude: number } | null> {
  if (!navigator?.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 15000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

/** Parse premium string to number; returns null if empty or invalid. */
function parsePremium(value: string | null | undefined): number | null {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

/** Compute difference (quoted - collected) for display/store. */
function premiumDifference(quoted: string | null | undefined, collected: string | null | undefined): string | null {
  const q = parsePremium(quoted);
  const c = parsePremium(collected);
  if (q == null && c == null) return null;
  const diff = (q ?? 0) - (c ?? 0);
  return String(diff);
}

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
  applicationNumber: "",
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
  insuranceCategory: "",
  insuranceProductType: "",
  insuranceProductTypeOther: "",
  vehicleNumber: "",
  insuranceSubtype: "",
  insuranceSubtypeOther: "",
  profileType: "",
  profileComments: "",
  businessType: "",
  businessTypeComments: "",
  paymentMode: "",
  paymentModeComments: "",
  paymentDoneBy: "",
  paymentDoneByComments: "",
  premiumQuoted: "",
  premiumCollected: "",
  miscellaneousExpenses: "",
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
  const [gettingLocationForForm, setGettingLocationForForm] = useState(false);
  const [capturedFormLocation, setCapturedFormLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [capturedFormAddress, setCapturedFormAddress] = useState<string | null>(null);
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

  async function openDialog() {
    setGettingLocationForForm(true);
    try {
      const coords = await getCurrentPositionAsync();
      if (!coords) {
        toast({
          title: "Location required",
          description: "Please allow location access to add a lead. The form will open only after location is captured.",
          variant: "destructive",
        });
        return;
      }
      setCapturedFormLocation(coords);
      try {
        const { address } = await staffJson<{ address: string }>(
          `/staff/reverse-geocode?lat=${encodeURIComponent(coords.latitude)}&lng=${encodeURIComponent(coords.longitude)}`
        );
        setCapturedFormAddress(address || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
      } catch {
        setCapturedFormAddress(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
      }
      setStep("choice");
      setLoanForm(defaultLoanForm());
      setInsuranceForm(defaultInsuranceForm());
      setOpen(true);
    } finally {
      setGettingLocationForForm(false);
    }
  }

  function getFormLocationDisplay(lead: Lead | InsuranceLead): string | null {
    return (lead as Lead).formLocation ?? (lead as Lead).form_location ?? (lead as InsuranceLead).formLocation ?? (lead as InsuranceLead).form_location ?? null;
  }

  function getVehicleNumberDisplay(lead: InsuranceLead): string | null {
    return lead.vehicleNumber ?? lead.vehicle_number ?? null;
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
          applicationNumber: loanForm.applicationNumber?.trim() || null,
          tenure: loanForm.tenure?.trim() || null,
          roi: loanForm.roi || null,
          loanDisbursed: loanForm.loanDisbursed || null,
          loanSanctionedAt: loanForm.loanSanctionedAt?.trim() || null,
          loanDisbursedAt: loanForm.loanDisbursedAt?.trim() || null,
          status: loanForm.status || "open",
          notes: loanForm.notes || null,
          formLocation: capturedFormAddress || (capturedFormLocation ? `${capturedFormLocation.latitude}, ${capturedFormLocation.longitude}` : null) || undefined,
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
          insuranceCategory: insuranceForm.insuranceCategory || null,
          insuranceProductType: insuranceForm.insuranceProductType || null,
          insuranceProductTypeOther: insuranceForm.insuranceProductTypeOther?.trim() || null,
          vehicleNumber:
            insuranceForm.insuranceType === "General Insurance" &&
            insuranceForm.insuranceCategory === "Motor"
              ? insuranceForm.vehicleNumber?.trim() || null
              : null,
          insuranceSubtype: insuranceForm.insuranceSubtype || null,
          insuranceSubtypeOther: insuranceForm.insuranceSubtypeOther?.trim() || null,
          profileType: insuranceForm.profileType || null,
          profileComments: insuranceForm.profileComments?.trim() || null,
          businessType: insuranceForm.businessType || null,
          businessTypeComments: insuranceForm.businessTypeComments?.trim() || null,
          paymentMode: insuranceForm.paymentMode || null,
          paymentModeComments: insuranceForm.paymentModeComments?.trim() || null,
          paymentDoneBy: insuranceForm.paymentDoneBy || null,
          paymentDoneByComments: insuranceForm.paymentDoneByComments?.trim() || null,
          premiumQuoted: insuranceForm.premiumQuoted || null,
          premiumCollected: insuranceForm.premiumCollected || null,
          difference: premiumDifference(
            insuranceForm.premiumQuoted,
            insuranceForm.premiumCollected
          ),
          miscellaneousExpenses: insuranceForm.miscellaneousExpenses?.trim() || null,
          status: insuranceForm.status || "open",
          notes: insuranceForm.notes || null,
          formLocation: capturedFormAddress || (capturedFormLocation ? `${capturedFormLocation.latitude}, ${capturedFormLocation.longitude}` : null) || undefined,
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">My leads</h1>
        <Button onClick={() => openDialog()} disabled={gettingLocationForForm}>
          <Plus className="h-4 w-4 mr-2 shrink-0" />
          {gettingLocationForForm ? "Getting location…" : "Lead form"}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Leads this month</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Add 2 or more loan leads per day to be marked present. Location is captured when you open the lead form; allow access when prompted.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <Tabs defaultValue="loan">
            <TabsList className="w-full sm:w-auto grid grid-cols-2">
              <TabsTrigger value="loan" className="text-xs sm:text-sm">Loan leads</TabsTrigger>
              <TabsTrigger value="insurance" className="text-xs sm:text-sm">Insurance leads</TabsTrigger>
            </TabsList>
            <TabsContent value="loan" className="mt-4 min-w-0">
              {/* Mobile: card list so each value sits under its label */}
              <div className="space-y-3 md:hidden">
                {leads.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No loan leads this month.</p>
                ) : (
                  leads.map((l) => (
                    <div key={l.id} className="rounded-lg border bg-card p-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[100px]">Date</span>
                        <span className="text-right font-medium truncate min-w-0">{l.date ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[100px]">Customer</span>
                        <span className="text-right truncate min-w-0">{l.customerName ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[100px]">DOB</span>
                        <span className="text-right">{l.dateOfBirth ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[100px]">Contact</span>
                        <span className="text-right">{l.customerPhone ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[100px]">Loan type</span>
                        <span className="text-right">{l.loanType ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[100px]">Sub type</span>
                        <span className="text-right">{l.subLoanType ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[100px]">Amount</span>
                        <span className="text-right tabular-nums">{l.amount ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[100px]">Application no.</span>
                        <span className="text-right">{(l as Lead).applicationNumber ?? (l as any).application_number ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[100px]">Tenure</span>
                        <span className="text-right">{l.tenure ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[100px]">Status</span>
                        <span className="text-right font-medium">{l.status ?? "—"}</span>
                      </div>
                      {getFormLocationDisplay(l) && (
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground shrink-0 w-[100px]">Generated at</span>
                          <span className="text-right text-xs truncate min-w-0 max-w-[200px]" title={getFormLocationDisplay(l) ?? undefined}>{getFormLocationDisplay(l)}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              {/* Desktop: table */}
              <div className="hidden md:block w-full min-w-0 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Date</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Customer</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">DOB</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Contact</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Loan type</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Sub type</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Amount</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Application no.</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Tenure</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Generated at</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.id} className="border-b">
                        <td className="py-2.5 pr-3">{l.date}</td>
                        <td className="py-2.5 pr-3">{l.customerName ?? "—"}</td>
                        <td className="py-2.5 pr-3">{l.dateOfBirth ?? "—"}</td>
                        <td className="py-2.5 pr-3">{l.customerPhone ?? "—"}</td>
                        <td className="py-2.5 pr-3">{l.loanType ?? "—"}</td>
                        <td className="py-2.5 pr-3">{l.subLoanType ?? "—"}</td>
                        <td className="py-2.5 pr-3 tabular-nums">{l.amount ?? "—"}</td>
                        <td className="py-2.5 pr-3">{(l as Lead).applicationNumber ?? (l as any).application_number ?? "—"}</td>
                        <td className="py-2.5 pr-3">{l.tenure ?? "—"}</td>
                        <td className="py-2.5 pr-3 max-w-[180px] truncate" title={getFormLocationDisplay(l) ?? undefined}>{getFormLocationDisplay(l) ?? "—"}</td>
                        <td className="py-2.5 pr-3">{l.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="insurance" className="mt-4 min-w-0">
              {/* Mobile: card list so each value sits under its label */}
              <div className="space-y-3 md:hidden">
                {insuranceLeads.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No insurance leads this month.</p>
                ) : (
                  insuranceLeads.map((l) => (
                    <div key={l.id} className="rounded-lg border bg-card p-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[110px]">Date</span>
                        <span className="text-right font-medium truncate min-w-0">{l.date ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[110px]">Customer</span>
                        <span className="text-right truncate min-w-0">{l.customerName ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[110px]">Contact</span>
                        <span className="text-right">{l.contactNum ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[110px]">Insurance type</span>
                        <span className="text-right">{l.insuranceType ?? "—"}</span>
                      </div>
                      {getVehicleNumberDisplay(l) && (
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground shrink-0 w-[110px]">Vehicle number</span>
                          <span className="text-right font-mono text-xs truncate">{getVehicleNumberDisplay(l)}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[110px]">Premium quoted</span>
                        <span className="text-right tabular-nums">{l.premiumQuoted ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[110px]">Premium collected</span>
                        <span className="text-right tabular-nums">{l.premiumCollected ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[110px]">Difference</span>
                        <span className="text-right tabular-nums">{l.difference ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[110px]">Misc. Expenses</span>
                        <span className="text-right truncate min-w-0">{l.miscellaneousExpenses ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0 w-[110px]">Status</span>
                        <span className="text-right font-medium">{l.status ?? "—"}</span>
                      </div>
                      {getFormLocationDisplay(l) && (
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground shrink-0 w-[110px]">Generated at</span>
                          <span className="text-right text-xs truncate min-w-0 max-w-[200px]" title={getFormLocationDisplay(l) ?? undefined}>{getFormLocationDisplay(l)}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              {/* Desktop: table */}
              <div className="hidden md:block w-full min-w-0 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Date</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Customer</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Contact</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Insurance type</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Vehicle no.</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Premium quoted</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Premium collected</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Difference</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Misc. Expenses</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Generated at</th>
                      <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insuranceLeads.map((l) => (
                      <tr key={l.id} className="border-b">
                        <td className="py-2.5 pr-3">{l.date}</td>
                        <td className="py-2.5 pr-3">{l.customerName ?? "—"}</td>
                        <td className="py-2.5 pr-3">{l.contactNum ?? "—"}</td>
                        <td className="py-2.5 pr-3">{l.insuranceType ?? "—"}</td>
                        <td className="py-2.5 pr-3 font-mono text-xs">{getVehicleNumberDisplay(l) ?? "—"}</td>
                        <td className="py-2.5 pr-3 tabular-nums">{l.premiumQuoted ?? "—"}</td>
                        <td className="py-2.5 pr-3 tabular-nums">{l.premiumCollected ?? "—"}</td>
                        <td className="py-2.5 pr-3 tabular-nums">{l.difference ?? "—"}</td>
                        <td className="py-2.5 pr-3">{l.miscellaneousExpenses ?? "—"}</td>
                        <td className="py-2.5 pr-3 max-w-[180px] truncate" title={getFormLocationDisplay(l) ?? undefined}>{getFormLocationDisplay(l) ?? "—"}</td>
                        <td className="py-2.5 pr-3">{l.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) {
            setCapturedFormLocation(null);
            setCapturedFormAddress(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {step === "choice" && (
            <>
              <DialogHeader>
                <DialogTitle>Lead form</DialogTitle>
                <DialogDescription>Choose the type of lead to add.</DialogDescription>
              </DialogHeader>
              {(capturedFormAddress || capturedFormLocation) && (
                <div className="flex items-start gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
                  <span>
                    <strong>Location captured:</strong> {capturedFormAddress ?? (capturedFormLocation ? `${capturedFormLocation.latitude.toFixed(5)}, ${capturedFormLocation.longitude.toFixed(5)}` : "")}
                  </span>
                </div>
              )}
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
              {(capturedFormAddress || capturedFormLocation) && (
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded px-2 py-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>Generated at: {capturedFormAddress ?? (capturedFormLocation ? `${capturedFormLocation.latitude.toFixed(5)}, ${capturedFormLocation.longitude.toFixed(5)}` : "")}</span>
                </div>
              )}
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
                    <Label>Application number</Label>
                    <Input
                      value={loanForm.applicationNumber}
                      onChange={(e) => setLoanForm((f) => ({ ...f, applicationNumber: e.target.value }))}
                      placeholder="e.g. APP123456"
                    />
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
              {(capturedFormAddress || capturedFormLocation) && (
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded px-2 py-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>Generated at: {capturedFormAddress ?? (capturedFormLocation ? `${capturedFormLocation.latitude.toFixed(5)}, ${capturedFormLocation.longitude.toFixed(5)}` : "")}</span>
                </div>
              )}
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
                          insuranceCategory: "",
                          insuranceProductType: "",
                          insuranceProductTypeOther: "",
                          vehicleNumber: "",
                          insuranceSubtype: "",
                          insuranceSubtypeOther: "",
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
                  {insuranceForm.insuranceType === "General Insurance" && (
                    <div className="space-y-1">
                      <Label>Insurance Subtype</Label>
                      <Select
                        value={insuranceForm.insuranceCategory || undefined}
                        onValueChange={(v) =>
                          setInsuranceForm((f) => ({
                            ...f,
                            insuranceCategory: v,
                            insuranceProductType: "",
                            insuranceProductTypeOther: "",
                            vehicleNumber: "",
                            insuranceSubtype: "",
                            insuranceSubtypeOther: "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENERAL_INSURANCE_SUBTYPES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {insuranceForm.insuranceType === "General Insurance" &&
                    (insuranceForm.insuranceCategory === "Motor" ||
                      insuranceForm.insuranceCategory === "Non-Motor") && (
                    <div className="space-y-1">
                      <Label>
                        {insuranceForm.insuranceCategory === "Motor" ? "Motor type" : "Non-Motor type"}
                      </Label>
                      <Select
                        value={insuranceForm.insuranceProductType || undefined}
                        onValueChange={(v) =>
                          setInsuranceForm((f) => ({
                            ...f,
                            insuranceProductType: v,
                            insuranceProductTypeOther:
                              v === "OTHER" ? f.insuranceProductTypeOther : "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {(insuranceForm.insuranceCategory === "Motor"
                            ? MOTOR_INSURANCE_OPTIONS
                            : NON_MOTOR_INSURANCE_OPTIONS
                          ).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {insuranceForm.insuranceType === "General Insurance" &&
                    insuranceForm.insuranceCategory === "Motor" && (
                    <div className="space-y-1 col-span-2">
                      <Label>Vehicle number</Label>
                      <Input
                        placeholder="e.g. AP01AB1234"
                        value={insuranceForm.vehicleNumber}
                        onChange={(e) =>
                          setInsuranceForm((f) => ({ ...f, vehicleNumber: e.target.value }))
                        }
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label>Insurance Company</Label>
                    <Select
                      value={insuranceForm.insuranceSubtype || undefined}
                      onValueChange={(v) =>
                        setInsuranceForm((f) => ({
                          ...f,
                          insuranceSubtype: v,
                          insuranceSubtypeOther: v === "Other" || v === "Others" ? f.insuranceSubtypeOther : "",
                        }))
                      }
                      disabled={
                        !insuranceForm.insuranceType ||
                        (insuranceForm.insuranceType === "General Insurance" && !insuranceForm.insuranceCategory)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder="Select company"
                        />
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
                {insuranceForm.insuranceType === "General Insurance" &&
                  (insuranceForm.insuranceCategory === "Motor" ||
                    insuranceForm.insuranceCategory === "Non-Motor") &&
                  insuranceForm.insuranceProductType === "OTHER" && (
                    <div className="space-y-1">
                      <Label>Specify other (product type)</Label>
                      <Input
                        placeholder="Enter product type"
                        value={insuranceForm.insuranceProductTypeOther}
                        onChange={(e) =>
                          setInsuranceForm((f) => ({
                            ...f,
                            insuranceProductTypeOther: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}
                {(insuranceForm.insuranceSubtype === "Other" || insuranceForm.insuranceSubtype === "Others") && (
                  <div className="space-y-1">
                    <Label>Specify other</Label>
                    <Input
                      placeholder="Enter company manually"
                      value={insuranceForm.insuranceSubtypeOther}
                      onChange={(e) =>
                        setInsuranceForm((f) => ({ ...f, insuranceSubtypeOther: e.target.value }))
                      }
                    />
                  </div>
                )}
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
                {insuranceForm.profileType && (
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
                )}
                {/* Business type: dropdown + manual entry box when selected */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label>Business type</Label>
                    <Select
                      value={insuranceForm.businessType || undefined}
                      onValueChange={(v) =>
                        setInsuranceForm((f) => ({ ...f, businessType: v, businessTypeComments: "" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {insuranceForm.businessType && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground font-normal">
                        Details for Business type (optional)
                      </Label>
                      <Textarea
                        placeholder="Enter details manually…"
                        value={insuranceForm.businessTypeComments}
                        onChange={(e) =>
                          setInsuranceForm((f) => ({ ...f, businessTypeComments: e.target.value }))
                        }
                        className="min-h-[80px]"
                        aria-label="Business type details"
                      />
                    </div>
                  )}
                </div>

                {/* Payment mode & Payment done by: dropdowns + manual entry boxes when selected */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label>Payment mode</Label>
                      <Select
                        value={insuranceForm.paymentMode || undefined}
                        onValueChange={(v) =>
                          setInsuranceForm((f) => ({ ...f, paymentMode: v, paymentModeComments: "" }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_MODES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {insuranceForm.paymentMode && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground font-normal">
                          Details for Payment mode (optional)
                        </Label>
                        <Textarea
                          placeholder="Enter details manually…"
                          value={insuranceForm.paymentModeComments}
                          onChange={(e) =>
                            setInsuranceForm((f) => ({ ...f, paymentModeComments: e.target.value }))
                          }
                          className="min-h-[80px]"
                          aria-label="Payment mode details"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label>Payment done by</Label>
                      <Select
                        value={insuranceForm.paymentDoneBy || undefined}
                        onValueChange={(v) =>
                          setInsuranceForm((f) => ({ ...f, paymentDoneBy: v, paymentDoneByComments: "" }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_DONE_BY.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {insuranceForm.paymentDoneBy && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground font-normal">
                          Details for Payment done by (optional)
                        </Label>
                        <Textarea
                          placeholder="Enter details manually…"
                          value={insuranceForm.paymentDoneByComments}
                          onChange={(e) =>
                            setInsuranceForm((f) => ({ ...f, paymentDoneByComments: e.target.value }))
                          }
                          className="min-h-[80px]"
                          aria-label="Payment done by details"
                        />
                      </div>
                    )}
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Difference</Label>
                    <Input
                      readOnly
                      value={
                        premiumDifference(
                          insuranceForm.premiumQuoted,
                          insuranceForm.premiumCollected
                        ) ?? ""
                      }
                      placeholder="Auto-calculated (Quoted − Collected)"
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Miscellaneous Expenses</Label>
                    <Input
                      value={insuranceForm.miscellaneousExpenses}
                      onChange={(e) =>
                        setInsuranceForm((f) => ({ ...f, miscellaneousExpenses: e.target.value }))
                      }
                      placeholder="Enter amount or details"
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
                  <Label>Remarks</Label>
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
