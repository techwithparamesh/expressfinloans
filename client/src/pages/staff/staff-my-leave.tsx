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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { staffJson } from "@/lib/api";
import { formatDateDdMmYyyy } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
import { CalendarCheck, Pencil, XCircle } from "lucide-react";

const LEAVE_TYPES = [
  { value: "on_duty", label: "On Duty" },
  { value: "missed_punch", label: "Missed Punch" },
  { value: "on_leave", label: "On Leave" },
  { value: "loss_of_pay", label: "Loss of Pay" },
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
  const [leaveType, setLeaveType] = useState<string>("on_duty");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [editLeaveId, setEditLeaveId] = useState<string | null>(null);
  const [editLeaveType, setEditLeaveType] = useState<string>("on_duty");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editReason, setEditReason] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [cancelLeaveId, setCancelLeaveId] = useState<string | null>(null);
  const [savingCancel, setSavingCancel] = useState(false);

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
    const c =
      s === "approved"
        ? "bg-green-100 text-green-800"
        : s === "rejected"
          ? "bg-red-100 text-red-800"
          : s === "cancelled"
            ? "bg-slate-100 text-slate-600"
            : "bg-amber-100 text-amber-800";
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${c}`}>{s}</span>;
  };

  const typeLabel = (t: string) => LEAVE_TYPES.find((x) => x.value === t)?.label ?? t;

  function openEdit(lv: LeaveRequest) {
    if (lv.status !== "pending") return;
    setEditLeaveId(lv.id);
    setEditLeaveType(lv.leaveType || "on_duty");
    setEditStartDate(String(lv.startDate ?? "").slice(0, 10));
    setEditEndDate(String(lv.endDate ?? "").slice(0, 10));
    setEditReason(lv.reason ?? "");
  }

  async function handleCancelLeave() {
    if (!cancelLeaveId) return;
    setSavingCancel(true);
    try {
      await staffJson("/staff/leave/" + cancelLeaveId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      toast({ title: "Leave request cancelled" });
      setCancelLeaveId(null);
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to cancel", variant: "destructive" });
    } finally {
      setSavingCancel(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editLeaveId) return;
    if (!editStartDate || !editEndDate) {
      toast({ title: "Start and end date required", variant: "destructive" });
      return;
    }
    if (editStartDate > editEndDate) {
      toast({ title: "Start date must be before end date", variant: "destructive" });
      return;
    }
    setSavingEdit(true);
    try {
      await staffJson("/staff/leave/" + editLeaveId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveType: editLeaveType,
          startDate: editStartDate,
          endDate: editEndDate,
          reason: editReason.trim() || null,
        }),
      });
      toast({ title: "Leave request updated" });
      setEditLeaveId(null);
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to update", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  }

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
                  onKeyDown={(e) => e.preventDefault()}
                  readOnly
                  title="Select date from calendar"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onKeyDown={(e) => e.preventDefault()}
                  readOnly
                  title="Select date from calendar"
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
                    <th className="text-left p-3 font-medium w-[90px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((lv) => (
                    <tr key={lv.id} className="border-b last:border-0">
                      <td className="p-3">{typeLabel(lv.leaveType)}</td>
                      <td className="p-3">{formatDateDdMmYyyy(lv.startDate) ?? "—"}</td>
                      <td className="p-3">{formatDateDdMmYyyy(lv.endDate) ?? "—"}</td>
                      <td className="p-3">{statusBadge(lv.status)}</td>
                      <td className="p-3">{lv.reason || "—"}</td>
                      <td className="p-3">
                        {lv.status === "pending" && (
                          <div className="flex flex-wrap gap-1">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEdit(lv)}>
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setCancelLeaveId(lv.id)}>
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!cancelLeaveId} onOpenChange={(open) => !open && setCancelLeaveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel leave request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will withdraw your leave request. You can apply again later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep request</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelLeave} disabled={savingCancel} className="bg-red-600 hover:bg-red-700">
              {savingCancel ? "Cancelling…" : "Cancel leave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editLeaveId} onOpenChange={(open) => !open && setEditLeaveId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit leave request</DialogTitle>
            <DialogDescription>Update the details of your pending leave request.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Leave type</Label>
              <Select value={editLeaveType} onValueChange={setEditLeaveType}>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  onKeyDown={(e) => e.preventDefault()}
                  readOnly
                  title="Select date from calendar"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  onKeyDown={(e) => e.preventDefault()}
                  readOnly
                  title="Select date from calendar"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Brief reason for leave"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditLeaveId(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingEdit}>
                {savingEdit ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
