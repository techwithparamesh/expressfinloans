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

type Employee = {
  id: string;
  username: string;
  role: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
};

function fetchEmployees() {
  return staffJson<Employee[]>("/staff/employees").catch(() => []);
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

  const loadList = () => {
    setLoading(true);
    fetchEmployees()
      .then(setList)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
  }, []);

  function openDialog() {
    setUsername("");
    setPassword("");
    setFullName("");
    setEmail("");
    setPhone("");
    setDialogOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast({ title: "Username and password are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await staffJson<Employee>("/staff/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          fullName: fullName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
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
      <Card>
        <CardHeader>
          <CardTitle>All employees</CardTitle>
          <CardDescription>Staff members. Only admin can create new staff. Staff can update their profile (name, email, phone) from Profile; updates are visible here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Username</th>
                  <th className="text-left py-2">Role</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Phone</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id} className="border-b">
                    <td className="py-2">{e.fullName ?? "—"}</td>
                    <td className="py-2">{e.username}</td>
                    <td className="py-2">{e.role}</td>
                    <td className="py-2">{e.email ?? "—"}</td>
                    <td className="py-2">{e.phone ?? "—"}</td>
                  </tr>
                ))}
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
    </div>
  );
}
