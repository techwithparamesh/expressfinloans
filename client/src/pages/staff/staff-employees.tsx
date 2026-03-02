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
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", monthlyLeadTarget: "", teamLeadId: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const [savingDelete, setSavingDelete] = useState(false);

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
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Update failed", variant: "destructive" });
    } finally {
      setSavingEdit(false);
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
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Delete failed", variant: "destructive" });
    } finally {
      setSavingDelete(false);
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
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to create staff",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button onClick={openDialog}>Add staff</Button>
      </div>
      {teamLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team leads</CardTitle>
            <CardDescription>{teamLeads.length} team lead(s). Assign employees to a team lead from the Edit action.</CardDescription>
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
          <CardDescription>Staff members. Create employees or team leads with Add staff. Assign employees to a team lead via Edit.</CardDescription>
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
                  <th className="text-left py-2 px-2 min-w-[140px]">Email</th>
                  <th className="text-left py-2 px-2 min-w-[100px]">Phone</th>
                  <th className="text-left py-2 px-2 min-w-[80px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No employees yet. Add staff to get started.
                    </td>
                  </tr>
                ) : (
                  list.map((e) => (
                    <tr key={e.id} className="border-b">
                      <td className="py-2 px-2 font-medium">{e.employeeNumber ?? "—"}</td>
                      <td className="py-2 px-2">{e.fullName ?? "—"}</td>
                      <td className="py-2 px-2">{e.username}</td>
                      <td className="py-2 px-2">{roleLabel(e.role)}</td>
                      <td className="py-2 px-2">{e.teamLeadId ? (teamLeads.find((t) => t.id === e.teamLeadId)?.fullName || teamLeads.find((t) => t.id === e.teamLeadId)?.username || "—") : "—"}</td>
                      <td className="py-2 px-2">{e.monthlyLeadTarget ?? "—"}</td>
                      <td className="py-2 px-2">{e.email ?? "—"}</td>
                      <td className="py-2 px-2">{e.phone ?? "—"}</td>
                      <td className="py-2 px-2 flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(e)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteEmployee(e)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
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
