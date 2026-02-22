import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { staffJson } from "@/lib/api";

type MonthlyTargetData = {
  monthTarget: number;
  achievement: number;
  achievementPct: number;
  overallLeadsGenerated: number;
  leadsConverted: number;
  leadsOpen: number;
  sanctionAmount: number;
  conveyancePct: number;
  monthLabel: string;
};

const STORAGE_KEY_PREFIX = "monthlyTargetPopupShown_";

function getTodayKey(): string {
  return STORAGE_KEY_PREFIX + new Date().toISOString().slice(0, 10);
}

function wasShownToday(): boolean {
  try {
    return sessionStorage.getItem(getTodayKey()) === "1";
  } catch {
    return false;
  }
}

function setShownToday(): void {
  try {
    sessionStorage.setItem(getTodayKey(), "1");
  } catch {}
}

export default function MonthlyTargetPopup() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<MonthlyTargetData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wasShownToday()) return;
    setLoading(true);
    staffJson<MonthlyTargetData | { forStaffOnly: boolean }>("/staff/monthly-target")
      .then((res) => {
        if ("forStaffOnly" in res && res.forStaffOnly) return;
        setData(res as MonthlyTargetData);
        setOpen(true);
        setShownToday();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Monthly Target</DialogTitle>
          <DialogDescription>
            Your performance for {data?.monthLabel ?? "this month"}. Shown once per day.
          </DialogDescription>
        </DialogHeader>
        {data && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-muted-foreground">Month Target</p>
                <p className="text-lg font-semibold">{data.monthTarget}</p>
              </div>
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-muted-foreground">Achievement</p>
                <p className="text-lg font-semibold">{data.achievement}</p>
              </div>
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-muted-foreground">Achievement %</p>
                <p className="text-lg font-semibold">{data.achievementPct}%</p>
              </div>
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-muted-foreground">Overall Leads Generated</p>
                <p className="text-lg font-semibold">{data.overallLeadsGenerated}</p>
              </div>
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-muted-foreground">Leads Converted</p>
                <p className="text-lg font-semibold">{data.leadsConverted}</p>
              </div>
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-muted-foreground">Leads Open</p>
                <p className="text-lg font-semibold">{data.leadsOpen}</p>
              </div>
              <div className="col-span-2 rounded-md border bg-muted/50 p-3">
                <p className="text-muted-foreground">Leads Sanction Amount</p>
                <p className="text-lg font-semibold">
                  ₹{data.sanctionAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="mb-2 font-medium">Conveyance rules</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Need min 20 leads updated</li>
                <li>• If min 2 leads converted → 50% conveyance</li>
                <li>• If &gt;2 leads converted → 100% conveyance</li>
                <li>• If you achieve 100% (irrespective of conversion) → 120% conveyance</li>
              </ul>
              <p className="mt-3 text-base font-semibold">
                Your conveyance: <span className="text-primary">{data.conveyancePct}%</span>
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        )}
        {loading && !data && (
          <div className="py-4 text-center text-sm text-muted-foreground">Loading…</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
