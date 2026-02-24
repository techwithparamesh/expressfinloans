import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { staffJson, staffFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

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

export default function StaffMyTeam() {
  const { toast } = useToast();
  const [list, setList] = useState<Employee[]>([]);
  const [unassigned, setUnassigned] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);

  function loadTeam() {
    setLoading(true);
    staffJson<Employee[]>("/staff/employees")
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  function loadUnassigned() {
    staffJson<Employee[]>("/staff/employees?unassigned=1")
      .then(setUnassigned)
      .catch(() => setUnassigned([]));
  }

  useEffect(() => {
    loadTeam();
  }, []);

  useEffect(() => {
    if (addOpen) loadUnassigned();
  }, [addOpen]);

  async function addToTeam() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await staffJson<{ user: { id: string } }>("/auth/me");
      await staffFetch(`/staff/employees/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamLeadId: res.user.id }),
      });
      toast({ title: "Employee added to your team" });
      setAddOpen(false);
      setSelectedId("");
      loadTeam();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to add", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function removeFromTeam(emp: Employee) {
    try {
      await staffFetch(`/staff/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamLeadId: null }),
      });
      toast({ title: "Employee removed from your team" });
      loadTeam();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to remove", variant: "destructive" });
    }
  }

  if (loading && list.length === 0) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My team</h1>
      <p className="text-slate-600">Manage employees under your team. Add unassigned employees or remove them from your team.</p>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team members</CardTitle>
            <CardDescription>Total: {list.length} member(s)</CardDescription>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add to team
          </Button>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-slate-500 py-4">No team members yet. Add unassigned employees using the button above.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-3 font-medium min-w-[100px]">Employee ID</th>
                    <th className="text-left p-3 font-medium min-w-[160px]">Name</th>
                    <th className="text-left p-3 font-medium min-w-[120px]">Username</th>
                    <th className="text-left p-3 font-medium min-w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((e) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="p-3">{e.employeeNumber ?? "—"}</td>
                      <td className="p-3">{e.fullName || e.username}</td>
                      <td className="p-3">{e.username}</td>
                      <td className="p-3">
                        <Button variant="outline" size="sm" onClick={() => removeFromTeam(e)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to team</DialogTitle>
            <DialogDescription>Select an unassigned employee to add to your team.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {unassigned.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.employeeNumber ?? "—"} · {e.fullName || e.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {unassigned.length === 0 && (
              <p className="text-slate-500 text-sm mt-2">No unassigned employees available.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addToTeam} disabled={!selectedId || saving}>{saving ? "Adding…" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
