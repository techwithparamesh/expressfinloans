import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { staffJson } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck } from "lucide-react";

const LEAVE_TYPES = [
  { value: "personal", label: "Personal leave" },
  { value: "sick", label: "Sick leave" },
  { value: "casual", label: "Casual leave" },
  { value: "emergency", label: "Emergency leave" },
  { value: "other", label: "Other" },
] as const;

type LeaveRequest = {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function StaffMyLeave() {
  const { toast } = useToast();
  const [list, setList] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaveType, setLeaveType] = useState<string>("personal");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    staffJson<LeaveRequest[]>("/staff/leave/me")
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast({ title: "Start and end date required", variant: "destructive" });
      return;
    }
    if (startDate > endDate) {
      toast({ title: "Start date must be before end date", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await staffJson("/staff/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          reason: reason.trim() || null,
        }),
      });
      toast({ title: "Leave request submitted" });
      setStartDate("");
      setEndDate("");
      setReason("");
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to submit", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const statusBadge = (s: string) => {
    const c = s === "approved" ? "bg-green-100 text-green-800" : s === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800";
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${c}`}>{s}</span>;
  };

  const typeLabel = (t: string) => LEAVE_TYPES.find((x) => x.value === t)?.label ?? t;

  if (loading && list.length === 0) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My leave</h1>
      <p className="text-slate-600">Apply for leave and view your leave requests.</p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Apply for leave
          </CardTitle>
          <CardDescription>Submit a new leave request. Your team lead will approve or reject it.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Leave type</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief reason for leave"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Submitting…" : "Submit leave request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My leave requests</CardTitle>
          <CardDescription>Total: {list.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-slate-500 py-4">No leave requests yet.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-3 font-medium min-w-[100px]">Type</th>
                    <th className="text-left p-3 font-medium min-w-[100px]">Start</th>
                    <th className="text-left p-3 font-medium min-w-[100px]">End</th>
                    <th className="text-left p-3 font-medium min-w-[80px]">Status</th>
                    <th className="text-left p-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((lv) => (
                    <tr key={lv.id} className="border-b last:border-0">
                      <td className="p-3">{typeLabel(lv.leaveType)}</td>
                      <td className="p-3">{String(lv.startDate).slice(0, 10)}</td>
                      <td className="p-3">{String(lv.endDate).slice(0, 10)}</td>
                      <td className="p-3">{statusBadge(lv.status)}</td>
                      <td className="p-3">{lv.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
