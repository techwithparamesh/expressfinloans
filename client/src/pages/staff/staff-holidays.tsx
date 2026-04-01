import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { staffJson, getAuthMe, type StaffUser } from "@/lib/api";
import { formatDateDdMmYyyy } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type HolidayRow = {
  id: string;
  date: string;
  occasion: string;
  holidayType: "full_day" | "half_day";
  isActive?: number;
};

function yearStart(): string {
  const y = new Date().getFullYear();
  return `${y}-01-01`;
}

function yearEnd(): string {
  const y = new Date().getFullYear();
  return `${y}-12-31`;
}

export default function StaffHolidays() {
  const { toast } = useToast();
  const [user, setUser] = useState<StaffUser | null>(null);
  const [rows, setRows] = useState<HolidayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: "",
    occasion: "",
    holidayType: "full_day" as "full_day" | "half_day",
  });

  async function load() {
    setLoading(true);
    try {
      const list = await staffJson<HolidayRow[]>(`/staff/holidays?from=${yearStart()}&to=${yearEnd()}`);
      setRows(Array.isArray(list) ? list : []);
    } catch {
      setRows([]);
      toast({ title: "Failed to load holidays", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getAuthMe().then((d) => setUser(d?.user ?? null)).catch(() => setUser(null));
    load();
  }, []);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [rows]
  );

  if (loading && rows.length === 0) return <p className="text-slate-500">Loading…</p>;

  const canManage = user?.role === "admin";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Holiday calendar</h1>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Add holiday</CardTitle>
            <CardDescription>
              Add full-day or half-day holidays. Second Saturday (half day) appears automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <Label>Date</Label>
              <DateInput
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Occasion</Label>
              <Input
                value={form.occasion}
                onChange={(e) => setForm((f) => ({ ...f, occasion: e.target.value }))}
                placeholder="e.g. Independence Day"
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={form.holidayType}
                onValueChange={(v) => setForm((f) => ({ ...f, holidayType: v as "full_day" | "half_day" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_day">Full day</SelectItem>
                  <SelectItem value="half_day">Half day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-4">
              <Button
                disabled={saving}
                onClick={async () => {
                  if (!form.date || !form.occasion.trim()) {
                    toast({ title: "Date and occasion are required", variant: "destructive" });
                    return;
                  }
                  setSaving(true);
                  try {
                    await staffJson("/staff/holidays", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        date: form.date,
                        occasion: form.occasion.trim(),
                        holidayType: form.holidayType,
                      }),
                    });
                    setForm({ date: "", occasion: "", holidayType: "full_day" });
                    await load();
                    toast({ title: "Holiday added" });
                  } catch (e) {
                    toast({ title: e instanceof Error ? e.message : "Failed to add holiday", variant: "destructive" });
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving…" : "Add holiday"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Holidays ({new Date().getFullYear()})</CardTitle>
          <CardDescription>Configured holidays and auto-generated second Saturdays.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">Occasion</th>
                  <th className="text-left py-2 px-2">Type</th>
                  {canManage && <th className="text-left py-2 px-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 4 : 3} className="py-8 text-center text-slate-500">No holidays configured.</td>
                  </tr>
                ) : (
                  sorted.map((r) => {
                    const builtIn = String(r.id || "").startsWith("second-saturday-");
                    return (
                      <tr key={r.id} className="border-b">
                        <td className="py-2 px-2">{formatDateDdMmYyyy(r.date) ?? r.date}</td>
                        <td className="py-2 px-2">{r.occasion}</td>
                        <td className="py-2 px-2">{r.holidayType === "half_day" ? "Half day" : "Full day"}</td>
                        {canManage && (
                          <td className="py-2 px-2">
                            {builtIn ? (
                              <span className="text-slate-500">Auto</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={async () => {
                                  try {
                                    await staffJson(`/staff/holidays/${r.id}`, { method: "DELETE" });
                                    await load();
                                    toast({ title: "Holiday removed" });
                                  } catch (e) {
                                    toast({ title: e instanceof Error ? e.message : "Failed to remove holiday", variant: "destructive" });
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
