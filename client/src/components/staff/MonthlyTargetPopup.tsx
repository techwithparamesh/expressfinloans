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

export type MonthlyTargetData = {
  forTeamLead?: boolean;
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

type MonthlyTargetPopupProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenConveyancePolicy?: () => void;
};

function fetchMonthlyTarget() {
  return staffJson<MonthlyTargetData | { forStaffOnly: boolean }>("/staff/monthly-target");
}

export default function MonthlyTargetPopup({ open, onOpenChange, onOpenConveyancePolicy }: MonthlyTargetPopupProps) {
  const [data, setData] = useState<MonthlyTargetData | null>(null);
  const [loading, setLoading] = useState(false);

  // Whenever the popup opens, fetch fresh data so values reflect latest leads (added/updated/closed).
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setData(null);
    fetchMonthlyTarget()
      .then((res) => {
        if ("forStaffOnly" in res && res.forStaffOnly) return;
        setData(res as MonthlyTargetData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const isTeamLead = data?.forTeamLead ?? false;
  const title = isTeamLead ? "Team monthly target" : "Monthly Target";
  const subtitle = isTeamLead
    ? `Your team's performance for ${data?.monthLabel ?? "this month"}. Live values from your leads.`
    : `Your performance for ${data?.monthLabel ?? "this month"}. Live values from your leads.`;
  const conveyanceLabel = isTeamLead ? "Team conveyance" : "Your conveyance";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>
        {data && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-muted-foreground">{isTeamLead ? "Overall target" : "Month Target"}</p>
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
                <p className="text-muted-foreground">{isTeamLead ? "Team leads generated" : "Overall Leads Generated"}</p>
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
                <p className="text-muted-foreground">{isTeamLead ? "Team sanction amount" : "Leads Sanction Amount"}</p>
                <p className="text-lg font-semibold">
                  ₹{data.sanctionAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="mb-2 font-medium">Conveyance rules</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {isTeamLead ? (
                  <>
                    <li>• Min 4 joint visits &amp; 10 leads; then Budget ≥ <strong>80%</strong> → 50%, ≥ <strong>100%</strong> → <strong>120%</strong></li>
                  </>
                ) : (
                  <>
                    <li>• Min 20 leads; then Budget Achievement ≥ <strong>60%</strong> → 50%, ≥ <strong>100%</strong> → <strong>120%</strong></li>
                  </>
                )}
              </ul>
              <p className="mt-3 text-base font-semibold">
                {conveyanceLabel}: <span className="text-primary">{data.conveyancePct}%</span>
              </p>
              {onOpenConveyancePolicy && (
                <Button variant="outline" size="sm" className="mt-3" onClick={onOpenConveyancePolicy}>
                  Conveyance Policy
                </Button>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
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
