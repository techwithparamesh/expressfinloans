import { useEffect, useMemo, useState } from "react";
import { type StaffUser, staffFetch, staffJson } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { formatDateDdMmYyyy } from "@/lib/utils";

type OfferTemplate = {
  id: string;
  name: string;
  placeholders?: string[];
  isActive: number;
  createdAt?: string;
};

type OfferLetter = {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeNumber?: string;
  title: string;
  status: string;
  publishedAt?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string | null;
};

type EmployeeOpt = {
  id: string;
  fullName?: string | null;
  username?: string | null;
  role: "employee" | "team_lead" | "admin";
  employeeNumber?: string | null;
  designation?: string | null;
  dateOfJoining?: string | null;
  department?: string | null;
  location?: string | null;
};

function offerStatusBadgeClass(status: string): string {
  const s = String(status || "").toLowerCase();
  if (s === "published") return "bg-blue-100 text-blue-800 border-blue-200";
  if (s === "accepted") return "bg-green-100 text-green-800 border-green-200";
  if (s === "rejected") return "bg-red-100 text-red-800 border-red-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function offerStatusLabel(status: string): string {
  const s = String(status || "").toLowerCase();
  if (s === "generated") return "Generated";
  if (s === "published") return "Published";
  if (s === "accepted") return "Accepted";
  if (s === "rejected") return "Rejected";
  return status || "Unknown";
}

export default function StaffOfferLetters({ user }: { user: StaffUser | null }) {
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [letters, setLetters] = useState<OfferLetter[]>([]);
  const [employees, setEmployees] = useState<EmployeeOpt[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    templateId: "",
    employeeId: "",
    title: "Offer Letter",
    fullName: "",
    dateOfJoining: "",
    designation: "",
    department: "",
    location: "",
    ctc: "",
    reportingManager: "",
  });

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === form.employeeId),
    [employees, form.employeeId]
  );

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      if (isAdmin) {
        const [tpl, all, people] = await Promise.all([
          staffJson<OfferTemplate[]>("/staff/offer-templates"),
          staffJson<OfferLetter[]>("/staff/offer-letters"),
          staffJson<EmployeeOpt[]>("/staff/employees"),
        ]);
        const filteredPeople = (Array.isArray(people) ? people : []).filter(
          (p) => p.role === "employee" || p.role === "team_lead"
        );
        setTemplates(Array.isArray(tpl) ? tpl : []);
        setLetters(Array.isArray(all) ? all : []);
        setEmployees(filteredPeople);
      } else {
        const mine = await staffJson<OfferLetter[]>("/staff/offer-letters/mine");
        setLetters(Array.isArray(mine) ? mine : []);
      }
    } catch {
      if (isAdmin) {
        setTemplates([]);
        setEmployees([]);
      }
      setLetters([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!selectedEmployee) return;
    setForm((f) => ({
      ...f,
      fullName: f.fullName || selectedEmployee.fullName || selectedEmployee.username || "",
      dateOfJoining: f.dateOfJoining || String(selectedEmployee.dateOfJoining ?? "").slice(0, 10),
      designation: f.designation || selectedEmployee.designation || "",
      department: f.department || selectedEmployee.department || "",
      location: f.location || selectedEmployee.location || "",
    }));
  }, [selectedEmployee]);

  async function uploadTemplate() {
    if (!templateFile) {
      toast({ title: "Please choose a template file", variant: "destructive" });
      return;
    }
    const fd = new FormData();
    fd.append("template", templateFile);
    if (templateName.trim()) fd.append("name", templateName.trim());
    setUploading(true);
    try {
      await staffFetch("/staff/offer-templates/upload", {
        method: "POST",
        body: fd,
      });
      toast({ title: "Offer letter template uploaded" });
      setTemplateName("");
      setTemplateFile(null);
      await load();
    } catch (e) {
      toast({
        title: "Template upload failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  async function generateOfferLetter() {
    if (!form.templateId || !form.employeeId) {
      toast({ title: "Template and employee are required", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      await staffJson("/staff/offer-letters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: form.templateId,
          employeeId: form.employeeId,
          title: form.title || "Offer Letter",
          values: {
            fullName: form.fullName,
            employeeName: form.fullName,
            dateOfJoining: form.dateOfJoining,
            designation: form.designation,
            department: form.department,
            location: form.location,
            ctc: form.ctc,
            reportingManager: form.reportingManager,
          },
        }),
      });
      toast({ title: "Offer letter generated" });
      await load();
    } catch (e) {
      toast({
        title: "Generate failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function publishOfferLetter(id: string) {
    setBusyId(id);
    try {
      await staffJson(`/staff/offer-letters/${id}/publish`, { method: "POST" });
      toast({ title: "Offer letter pushed to employee" });
      await load();
    } catch (e) {
      toast({
        title: "Publish failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function decideOfferLetter(id: string, decision: "accepted" | "rejected") {
    setBusyId(id);
    try {
      await staffJson(`/staff/offer-letters/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      toast({ title: `Offer letter ${decision}` });
      await load();
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function downloadPdf(id: string) {
    try {
      const res = await fetch(`/api/staff/offer-letters/${id}/file`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load offer letter PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `offer-letter-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }

  if (loading) return <p className="text-slate-500">Loading offer letters…</p>;

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Upload offer letter template</CardTitle>
            <CardDescription>
              Upload `.txt` or `.html` template with placeholders like {"{{fullName}}"}, {"{{dateOfJoining}}"}, {"{{designation}}"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name (optional)"
            />
            <Input
              type="file"
              accept=".txt,.html"
              onChange={(e) => setTemplateFile(e.target.files?.[0] ?? null)}
            />
            <Button onClick={() => void uploadTemplate()} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload template"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Generate offer letter</CardTitle>
            <CardDescription>
              Fill candidate details, generate letter from template, then publish to employee/team lead.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-slate-600">Template</p>
              <Select value={form.templateId} onValueChange={(v) => setForm((f) => ({ ...f, templateId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-600">Employee / Team Lead</p>
              <Select value={form.employeeId} onValueChange={(v) => setForm((f) => ({ ...f, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {(e.fullName || e.username || e.id) + (e.employeeNumber ? ` (${e.employeeNumber})` : "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" />
            <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Candidate name" />
            <DateInput value={form.dateOfJoining} onChange={(e) => setForm((f) => ({ ...f, dateOfJoining: e.target.value }))} />
            <Input value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} placeholder="Designation" />
            <Input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} placeholder="Department" />
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Location" />
            <Input value={form.ctc} onChange={(e) => setForm((f) => ({ ...f, ctc: e.target.value }))} placeholder="CTC (optional)" />
            <Input value={form.reportingManager} onChange={(e) => setForm((f) => ({ ...f, reportingManager: e.target.value }))} placeholder="Reporting manager" />
            <div className="sm:col-span-3">
              <Button onClick={() => void generateOfferLetter()} disabled={generating}>
                {generating ? "Generating…" : "Generate offer letter"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? "Generated offer letters" : "My offer letters"}</CardTitle>
          <CardDescription>
            {isAdmin
              ? "Publish generated offer letters to employees or team leads."
              : "Accept and download your published offer letters."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {letters.length === 0 ? (
            <p className="text-sm text-slate-500">No offer letters available.</p>
          ) : (
            letters.map((r) => (
              <div key={r.id} className="rounded-md border bg-slate-50 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {r.title}
                    {isAdmin && r.employeeName ? ` · ${r.employeeName}` : ""}
                    {isAdmin && r.employeeNumber ? ` (${r.employeeNumber})` : ""}
                  </p>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${offerStatusBadgeClass(r.status)}`}>
                    {offerStatusLabel(r.status)}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Created: {formatDateDdMmYyyy(r.createdAt || "") || "—"}
                  {r.publishedAt ? ` · Published: ${formatDateDdMmYyyy(r.publishedAt) || "—"}` : ""}
                  {r.acceptedAt ? ` · Accepted: ${formatDateDdMmYyyy(r.acceptedAt) || "—"}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => void downloadPdf(r.id)}>
                    Download PDF
                  </Button>
                  {isAdmin && r.status === "generated" && (
                    <Button size="sm" disabled={busyId === r.id} onClick={() => void publishOfferLetter(r.id)}>
                      Push to employee
                    </Button>
                  )}
                  {!isAdmin && r.status === "published" && (
                    <>
                      <Button size="sm" disabled={busyId === r.id} onClick={() => void decideOfferLetter(r.id, "accepted")}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => void decideOfferLetter(r.id, "rejected")}>
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
