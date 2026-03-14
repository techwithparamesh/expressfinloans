import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { staffJson, staffFetch } from "@/lib/api";
import { formatDateDdMmYyyy } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

const LEAVE_TYPES: Record<string, string> = {
  on_duty: "On Duty",
  missed_punch: "Missed Punch",
  on_leave: "On Leave",
  loss_of_pay: "Loss of Pay",
  personal: "Personal leave",
  sick: "Sick leave",
  casual: "Casual leave",
  emergency: "Emergency leave",
  other: "Other",
};

type LeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
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
const monthStart = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};

export default function StaffLeaveRequests() {
  const { toast } = useToast();
  const [list, setList] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [acting, setActing] = useState<string | null>(null);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status) params.set("status", status);
    staffJson<LeaveRequest[]>(`/staff/leave?${params}`)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [from, to, status]);

  async function approveOrReject(id: string, approve: boolean) {
    setActing(id);
    try {
      await staffFetch(`/staff/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: approve ? "approved" : "rejected" }),
      });
      toast({ title: approve ? "Leave approved" : "Leave rejected" });
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Action failed", variant: "destructive" });
    } finally {
      setActing(null);
    }
  }

  const statusBadge = (s: string) => {
    const c = s === "approved" ? "bg-green-100 text-green-800" : s === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800";
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${c}`}>{s}</span>;
  };

  if (loading && list.length === 0) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leave requests</h1>
      <p className="text-slate-600">Approve or reject leave requests from your team members.</p>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by date range and status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <DateInput value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <DateInput value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
          <CardDescription>Total: {list.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-slate-500 py-4">No leave requests match the filters.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 sticky top-0">
                    <th className="text-left p-3 font-medium min-w-[90px]">Employee ID</th>
                    <th className="text-left p-3 font-medium min-w-[140px]">Name</th>
                    <th className="text-left p-3 font-medium min-w-[90px]">Type</th>
                    <th className="text-left p-3 font-medium min-w-[100px]">Start</th>
                    <th className="text-left p-3 font-medium min-w-[100px]">End</th>
                    <th className="text-left p-3 font-medium min-w-[80px]">Status</th>
                    <th className="text-left p-3 font-medium min-w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((lv) => (
                    <tr key={lv.id} className="border-b last:border-0">
                      <td className="p-3">{lv.employeeNumber || "—"}</td>
                      <td className="p-3">{lv.employeeName || lv.employeeId}</td>
                      <td className="p-3">{LEAVE_TYPES[lv.leaveType] ?? lv.leaveType}</td>
                      <td className="p-3">{formatDateDdMmYyyy(lv.startDate) ?? "—"}</td>
                      <td className="p-3">{formatDateDdMmYyyy(lv.endDate) ?? "—"}</td>
                      <td className="p-3">{statusBadge(lv.status)}</td>
                      <td className="p-3">
                        {lv.status === "pending" ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => approveOrReject(lv.id, true)}
                              disabled={acting === lv.id}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveOrReject(lv.id, false)}
                              disabled={acting === lv.id}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          "—"
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
    </div>
  );
}
