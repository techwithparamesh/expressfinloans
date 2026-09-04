import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { Download, UserCheck } from "lucide-react";

type Employee = {
  id: string;
  username: string;
  role: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  employeeNumber: string | null;
  monthlyLeadTarget: number | null;
  teamLeadId: string | null;
  designation?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  pan?: string | null;
  uan?: string | null;
  dateOfJoining?: string | null;
  department?: string | null;
  location?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  employmentStatus?: string | null;
  isActive?: number | null;
};

type TeamLead = { id: string; username: string; fullName: string | null };

function roleLabel(role: string): string {
  if (role === "team_lead") return "Team leader";
  if (role === "employee") return "Employee";
  if (role === "admin") return "Admin";
  return role;
}

function fetchEmployees() {
  return staffJson<Employee[]>("/staff/employees").catch(() => []);
}

function toYmd(value: string | null | undefined): string {
  if (!value) return "";
  const s = String(value).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s.slice(0, 10))) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
function fetchTeamLeads() {
  return staffJson<TeamLead[]>("/staff/team-leads").catch(() => []);
}

export default function StaffEmployees() {
  const { toast } = useToast();
  const [list, setList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyLeadTarget, setMonthlyLeadTarget] = useState("");
  const [createRole, setCreateRole] = useState<"employee" | "team_lead">("employee");
  const [createTeamLeadId, setCreateTeamLeadId] = useState("");
  const [teamLeads, setTeamLeads] = useState<TeamLead[]>([]);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    monthlyLeadTarget: "",
    teamLeadId: "",
    designation: "",
    bankAccountNumber: "",
    bankIfsc: "",
    pan: "",
    uan: "",
    dateOfJoining: "",
    department: "",
    location: "",
    dateOfBirth: "",
    gender: "",
    employmentStatus: "confirmed",
    isActive: 1,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const [savingDelete, setSavingDelete] = useState(false);
  const [promoteEmployee, setPromoteEmployee] = useState<Employee | null>(null);
  const [accessToggleEmployee, setAccessToggleEmployee] = useState<Employee | null>(null);
  const [savingAccess, setSavingAccess] = useState(false);
  const [savingPromote, setSavingPromote] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadList = () => {
    setLoading(true);
    fetchEmployees()
      .then(setList)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
    fetchTeamLeads().then(setTeamLeads);
  }, []);

  function openDialog() {
    setUsername("");
    setPassword("");
    setFullName("");
    setEmail("");
    setPhone("");
    setMonthlyLeadTarget("");
    setCreateRole("employee");
    setCreateTeamLeadId("");
    setDialogOpen(true);
  }

  function openEdit(e: Employee) {
    setEditEmployee(e);
    setEditForm({
      fullName: e.fullName ?? "",
      email: e.email ?? "",
      phone: e.phone ?? "",
      monthlyLeadTarget: e.monthlyLeadTarget != null ? String(e.monthlyLeadTarget) : "",
      teamLeadId: e.teamLeadId ?? "",
      designation: e.designation ?? "",
      bankAccountNumber: e.bankAccountNumber ?? "",
      bankIfsc: e.bankIfsc ?? "",
      pan: e.pan ?? "",
      uan: e.uan ?? "",
      dateOfJoining: toYmd(e.dateOfJoining),
      department: e.department ?? "",
      location: e.location ?? "",
      dateOfBirth: toYmd(e.dateOfBirth),
      gender: e.gender ?? "",
      employmentStatus: e.employmentStatus || "confirmed",
      isActive: Number(e.isActive ?? 1) === 1 ? 1 : 0,
    });
  }

  async function handleUpdateEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!editEmployee) return;
    setSavingEdit(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: editForm.fullName.trim() || null,
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim() || null,
        monthlyLeadTarget: editForm.monthlyLeadTarget.trim() ? Number(editForm.monthlyLeadTarget) : null,
        designation: editForm.designation.trim() || null,
        bankAccountNumber: editForm.bankAccountNumber.trim() || null,
        bankIfsc: editForm.bankIfsc.trim() || null,
        pan: editForm.pan.trim() || null,
        uan: editForm.uan.trim() || null,
        dateOfJoining: toYmd(editForm.dateOfJoining) || null,
        department: editForm.department.trim() || null,
        location: editForm.location.trim() || null,
        dateOfBirth: toYmd(editForm.dateOfBirth) || null,
        gender: editForm.gender.trim() || null,
        employmentStatus: editForm.employmentStatus || "confirmed",
        isActive: editForm.isActive,
      };
      if (editEmployee.role === "employee") {
        payload.teamLeadId = editForm.teamLeadId.trim() || null;
      }
      await staffJson<Employee>(`/staff/employees/${editEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast({ title: "Employee updated" });
      setEditEmployee(null);
      loadList();
      fetchTeamLeads().then(setTeamLeads);
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Update failed", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmAccessToggle() {
    if (!accessToggleEmployee) return;
    const currentlyActive = Number(accessToggleEmployee.isActive ?? 1) === 1;
    setSavingAccess(true);
    try {
      const payload: Record<string, unknown> = {
        isActive: currentlyActive ? 0 : 1,
      };
      // Reactivating also clears resigned status so they can log in again.
      if (!currentlyActive) {
        payload.employmentStatus =
          accessToggleEmployee.employmentStatus === "resigned"
            ? "confirmed"
            : accessToggleEmployee.employmentStatus || "confirmed";
      }
      await staffJson<Employee>(`/staff/employees/${accessToggleEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast({
        title: currentlyActive ? "Portal access deactivated" : "Portal access restored",
      });
      setAccessToggleEmployee(null);
      loadList();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Update failed", variant: "destructive" });
    } finally {
      setSavingAccess(false);
    }
  }

  async function confirmDeleteEmployee() {
    if (!deleteEmployee) return;
    setSavingDelete(true);
    try {
      await staffFetch("/staff/employees/" + deleteEmployee.id, { method: "DELETE" });
      toast({ title: "Employee removed" });
      setDeleteEmployee(null);
      loadList();
      fetchTeamLeads().then(setTeamLeads);
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Delete failed", variant: "destructive" });
    } finally {
      setSavingDelete(false);
    }
  }

  async function confirmPromoteEmployee() {
    if (!promoteEmployee) return;
    setSavingPromote(true);
    try {
      await staffJson<Employee>(`/staff/employees/${promoteEmployee.id}/promote-team-lead`, {
        method: "POST",
      });
      toast({ title: "Employee promoted to team lead" });
      setPromoteEmployee(null);
      loadList();
      fetchTeamLeads().then(setTeamLeads);
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Promotion failed", variant: "destructive" });
    } finally {
      setSavingPromote(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast({ title: "Username and password are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        username: username.trim(),
        password,
        role: createRole,
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      };
      if (createRole === "employee") {
        if (monthlyLeadTarget.trim()) body.monthlyLeadTarget = Number(monthlyLeadTarget);
        if (createTeamLeadId.trim()) body.teamLeadId = createTeamLeadId.trim();
      }
      await staffJson<Employee>("/staff/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      toast({ title: "Staff created successfully" });
      setDialogOpen(false);
      loadList();
      fetchTeamLeads().then(setTeamLeads);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to create staff",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleExportEmployees() {
    setExporting(true);
    try {
      const res = await fetch("/api/staff/employees/export", { credentials: "include" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "Export failed");
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      const filenameMatch = cd ? /filename="([^"]+)"/.exec(cd) : null;
      const filename = filenameMatch?.[1] || "employees.xlsx";
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      toast({ title: "Employees Excel downloaded" });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleExportEmployees} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Preparing..." : "Download Excel"}
          </Button>
          <Button onClick={openDialog}>Add staff</Button>
        </div>
      </div>
      {teamLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team leads</CardTitle>
            <CardDescription>{teamLeads.length} team lead(s). Promote employees from Actions or assign employees from Edit.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {teamLeads.map((t) => (
                <span key={t.id} className="px-3 py-1.5 rounded-md bg-slate-100 text-sm">
                  {t.fullName || t.username}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>All employees</CardTitle>
          <CardDescription>Staff members. Create employees or team leads with Add staff, promote existing employees, and assign teams via Edit.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 min-w-[72px]">Employee ID</th>
                  <th className="text-left py-2 px-2 min-w-[120px]">Name</th>
                  <th className="text-left py-2 px-2 min-w-[100px]">Username</th>
                  <th className="text-left py-2 px-2 min-w-[80px]">Role</th>
                  <th className="text-left py-2 px-2 min-w-[100px]">Team lead</th>
                  <th className="text-left py-2 px-2 min-w-[72px]">Month target</th>
                  <th className="text-left py-2 px-2 min-w-[90px]">Status</th>
                  <th className="text-left py-2 px-2 min-w-[80px]">Access</th>
                  <th className="text-left py-2 px-2 min-w-[140px]">Email</th>
                  <th className="text-left py-2 px-2 min-w-[100px]">Phone</th>
                  <th className="text-left py-2 px-2 min-w-[260px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-500">
                      No employees yet. Add staff to get started.
                    </td>
                  </tr>
                ) : (
                  list.map((e) => {
                    const active = Number(e.isActive ?? 1) === 1;
                    const status = (e.employmentStatus || "confirmed").replace(/_/g, " ");
                    return (
                    <tr key={e.id} className={`border-b ${!active ? "bg-slate-50 text-slate-500" : ""}`}>
                      <td className="py-2 px-2 font-medium">{e.employeeNumber ?? "—"}</td>
                      <td className="py-2 px-2">{e.fullName ?? "—"}</td>
                      <td className="py-2 px-2">{e.username}</td>
                      <td className="py-2 px-2">{roleLabel(e.role)}</td>
                      <td className="py-2 px-2">{e.teamLeadId ? (teamLeads.find((t) => t.id === e.teamLeadId)?.fullName || teamLeads.find((t) => t.id === e.teamLeadId)?.username || "—") : "—"}</td>
                      <td className="py-2 px-2">{e.monthlyLeadTarget ?? "—"}</td>
                      <td className="py-2 px-2 capitalize">{status}</td>
                      <td className="py-2 px-2">
                        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2 px-2">{e.email ?? "—"}</td>
                      <td className="py-2 px-2">{e.phone ?? "—"}</td>
                      <td className="py-2 px-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(e)}>
                            Edit
                          </Button>
                          {e.role === "employee" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                              onClick={() => setPromoteEmployee(e)}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Promote to TL
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className={active ? "text-amber-700 hover:bg-amber-50" : "text-green-700 hover:bg-green-50"}
                            onClick={() => setAccessToggleEmployee(e)}
                          >
                            {active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteEmployee(e)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create staff</DialogTitle>
            <DialogDescription>Add a new staff member. They can log in with this username and password and update their profile later.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username *</Label>
              <Input
                id="new-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Login username"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password *</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Login password"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-fullName">Full name</Label>
              <Input
                id="new-fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-phone">Phone</Label>
              <Input
                id="new-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={createRole} onValueChange={(v: "employee" | "team_lead") => setCreateRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="team_lead">Team Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createRole === "employee" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-monthlyTarget">Monthly lead target</Label>
                  <Input
                    id="new-monthlyTarget"
                    type="number"
                    min={1}
                    value={monthlyLeadTarget}
                    onChange={(e) => setMonthlyLeadTarget(e.target.value)}
                    placeholder="e.g. 20 (default if blank)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Team lead</Label>
                  <Select value={createTeamLeadId || "none"} onValueChange={(v) => setCreateTeamLeadId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {teamLeads.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.fullName || t.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create staff"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteEmployee} onOpenChange={(open) => !open && setDeleteEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteEmployee?.fullName || deleteEmployee?.username} and all their leads, insurance leads, and attendance records. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEmployee} disabled={savingDelete} className="bg-red-600 hover:bg-red-700">
              {savingDelete ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!promoteEmployee} onOpenChange={(open) => !open && setPromoteEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to team lead?</AlertDialogTitle>
            <AlertDialogDescription>
              {promoteEmployee?.fullName || promoteEmployee?.username} will get team lead permissions and will no longer be assigned under their current team lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPromoteEmployee} disabled={savingPromote}>
              {savingPromote ? "Promoting…" : "Promote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!accessToggleEmployee} onOpenChange={(open) => !open && setAccessToggleEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {Number(accessToggleEmployee?.isActive ?? 1) === 1 ? "Deactivate portal access?" : "Restore portal access?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {Number(accessToggleEmployee?.isActive ?? 1) === 1
                ? `${accessToggleEmployee?.fullName || accessToggleEmployee?.username} will not be able to log in to the staff portal.`
                : `${accessToggleEmployee?.fullName || accessToggleEmployee?.username} will be able to log in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAccessToggle} disabled={savingAccess}>
              {savingAccess
                ? "Saving…"
                : Number(accessToggleEmployee?.isActive ?? 1) === 1
                  ? "Deactivate"
                  : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editEmployee} onOpenChange={(open) => !open && setEditEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
            <DialogDescription>Update name, contact, and monthly lead target. Target is shown in the employee popup and on My dashboard.</DialogDescription>
          </DialogHeader>
          {editEmployee && (
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={editEmployee.username} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Full name</Label>
                <Input
                  id="edit-fullName"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              {editEmployee.role === "employee" && (
                <div className="space-y-2">
                  <Label>Team lead</Label>
                  <Select
                    value={editForm.teamLeadId || "none"}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, teamLeadId: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {teamLeads.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.fullName || t.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-monthlyTarget">Monthly lead target</Label>
                <Input
                  id="edit-monthlyTarget"
                  type="number"
                  min={1}
                  value={editForm.monthlyLeadTarget}
                  onChange={(e) => setEditForm((f) => ({ ...f, monthlyLeadTarget: e.target.value }))}
                  placeholder="e.g. 20 (blank = default)"
                />
              </div>
              <div className="border-t pt-4 mt-4 space-y-4">
                <p className="text-sm font-medium text-slate-700">Payslip / Bank details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-designation">Designation</Label>
                    <Input
                      id="edit-designation"
                      value={editForm.designation}
                      onChange={(e) => setEditForm((f) => ({ ...f, designation: e.target.value }))}
                      placeholder="e.g. Sales Executive"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Department</Label>
                    <Input
                      id="edit-department"
                      value={editForm.department}
                      onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
                      placeholder="e.g. Sales"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-location">Location</Label>
                    <Input
                      id="edit-location"
                      value={editForm.location}
                      onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="e.g. Chennai"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dateOfBirth">Date of birth</Label>
                    <DateInput
                      id="edit-dateOfBirth"
                      value={editForm.dateOfBirth ? String(editForm.dateOfBirth).slice(0, 10) : ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, dateOfBirth: e.target.value ? e.target.value.slice(0, 10) : "" }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dateOfJoining">Date of joining</Label>
                    <DateInput
                      id="edit-dateOfJoining"
                      value={editForm.dateOfJoining}
                      onChange={(e) => setEditForm((f) => ({ ...f, dateOfJoining: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-gender">Gender</Label>
                    <Select
                      value={editForm.gender || "none"}
                      onValueChange={(v) => setEditForm((f) => ({ ...f, gender: v === "none" ? "" : v }))}
                    >
                      <SelectTrigger id="edit-gender">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-employmentStatus">Employment status</Label>
                    <Select
                      value={editForm.employmentStatus || "confirmed"}
                      onValueChange={(v) =>
                        setEditForm((f) => ({
                          ...f,
                          employmentStatus: v,
                          isActive: v === "resigned" ? 0 : f.isActive,
                        }))
                      }
                    >
                      <SelectTrigger id="edit-employmentStatus">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="probation">Probation</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="resigned">Resigned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-isActive">Portal access</Label>
                    <Select
                      value={String(editForm.isActive)}
                      onValueChange={(v) => setEditForm((f) => ({ ...f, isActive: Number(v) }))}
                    >
                      <SelectTrigger id="edit-isActive">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Active (can login)</SelectItem>
                        <SelectItem value="0">Inactive (blocked)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-bankAccountNumber">Bank account number</Label>
                  <Input
                    id="edit-bankAccountNumber"
                    value={editForm.bankAccountNumber}
                    onChange={(e) => setEditForm((f) => ({ ...f, bankAccountNumber: e.target.value }))}
                    placeholder="Account number for salary credit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-bankIfsc">IFSC code</Label>
                  <Input
                    id="edit-bankIfsc"
                    value={editForm.bankIfsc}
                    onChange={(e) => setEditForm((f) => ({ ...f, bankIfsc: e.target.value }))}
                    placeholder="e.g. HDFC0001234"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-pan">PAN</Label>
                    <Input
                      id="edit-pan"
                      value={editForm.pan}
                      onChange={(e) => setEditForm((f) => ({ ...f, pan: e.target.value.toUpperCase() }))}
                      placeholder="e.g. ABCD E1234F"
                      maxLength={14}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-uan">UAN (PF)</Label>
                    <Input
                      id="edit-uan"
                      value={editForm.uan}
                      onChange={(e) => setEditForm((f) => ({ ...f, uan: e.target.value }))}
                      placeholder="Universal Account Number"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditEmployee(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingEdit}>
                  {savingEdit ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
