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
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-lg p-4 sm:p-6 flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg">{title}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">{subtitle}</DialogDescription>
        </DialogHeader>
        {data && (
          <>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-3 sm:space-y-4 py-2 -mx-1 px-1">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div className="rounded-md border bg-muted/50 p-2 sm:p-3">
                  <p className="text-muted-foreground text-xs sm:text-sm">{isTeamLead ? "Overall target" : "Month Target"}</p>
                  <p className="text-base sm:text-lg font-semibold">{data.monthTarget}</p>
                </div>
                <div className="rounded-md border bg-muted/50 p-2 sm:p-3">
                  <p className="text-muted-foreground text-xs sm:text-sm">Achievement</p>
                  <p className="text-base sm:text-lg font-semibold">{data.achievement}</p>
                </div>
                <div className="rounded-md border bg-muted/50 p-2 sm:p-3">
                  <p className="text-muted-foreground text-xs sm:text-sm">Achievement %</p>
                  <p className="text-base sm:text-lg font-semibold">{data.achievementPct}%</p>
                </div>
                <div className="rounded-md border bg-muted/50 p-2 sm:p-3">
                  <p className="text-muted-foreground text-xs sm:text-sm">{isTeamLead ? "Team leads generated" : "Overall Leads Generated"}</p>
                  <p className="text-base sm:text-lg font-semibold">{data.overallLeadsGenerated}</p>
                </div>
                <div className="rounded-md border bg-muted/50 p-2 sm:p-3">
                  <p className="text-muted-foreground text-xs sm:text-sm">Leads Converted</p>
                  <p className="text-base sm:text-lg font-semibold">{data.leadsConverted}</p>
                </div>
                <div className="rounded-md border bg-muted/50 p-2 sm:p-3">
                  <p className="text-muted-foreground text-xs sm:text-sm">Leads Open</p>
                  <p className="text-base sm:text-lg font-semibold">{data.leadsOpen}</p>
                </div>
                <div className="col-span-2 rounded-md border bg-muted/50 p-2 sm:p-3">
                  <p className="text-muted-foreground text-xs sm:text-sm">{isTeamLead ? "Team sanction amount" : "Leads Sanction Amount"}</p>
                  <p className="text-base sm:text-lg font-semibold">
                    ₹{data.sanctionAmount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div>
                  <p className="font-medium text-foreground mb-1.5 sm:mb-2 text-sm sm:text-base">How conveyance is calculated</p>
                {isTeamLead ? (
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                    <p className="font-medium text-foreground text-xs uppercase tracking-wide">Step 1 — Eligibility (both required)</p>
                    <ul className="space-y-1 list-disc list-inside pl-0">
                      <li>At least <strong className="text-foreground">4</strong> joint visits with team members this month</li>
                      <li>At least <strong className="text-foreground">10</strong> leads (team total) this month</li>
                    </ul>
                    <p className="font-medium text-foreground text-xs uppercase tracking-wide mt-2">Step 2 — Payout (based on budget achievement)</p>
                    <ul className="space-y-1 list-disc list-inside pl-0">
                      <li>Below <strong className="text-foreground">80%</strong> → No conveyance</li>
                      <li><strong className="text-foreground">80%</strong> to 99% → <strong className="text-foreground">50%</strong> of base conveyance</li>
                      <li><strong className="text-foreground">100%</strong> or more → <strong className="text-foreground">120%</strong> of base conveyance</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                    <p className="font-medium text-foreground text-xs uppercase tracking-wide">Step 1 — Eligibility</p>
                    <ul className="space-y-1 list-disc list-inside pl-0">
                      <li>At least <strong className="text-foreground">20</strong> leads recorded in CRM this month</li>
                    </ul>
                    <p className="font-medium text-foreground text-xs uppercase tracking-wide mt-2">Step 2 — Payout (based on budget achievement)</p>
                    <p className="text-xs text-muted-foreground">Budget achievement = disbursed/sanctioned leads vs your monthly target.</p>
                    <ul className="space-y-1 list-disc list-inside pl-0">
                      <li>Below <strong className="text-foreground">60%</strong> → No conveyance</li>
                      <li><strong className="text-foreground">60%</strong> to 99% → <strong className="text-foreground">50%</strong> of base conveyance</li>
                      <li><strong className="text-foreground">100%</strong> or more → <strong className="text-foreground">120%</strong> of base conveyance</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-primary/20">
                <p className="text-sm">
                  <span className="font-medium text-foreground">{conveyanceLabel}</span>
                  <span className="ml-2 text-primary font-semibold">{data.conveyancePct}%</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.conveyancePct === 0 ? "Eligibility or budget conditions not yet met." : "Based on current month data above."}
                </p>
              </div>
              {onOpenConveyancePolicy && (
                <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={onOpenConveyancePolicy}>
                  Full Conveyance Policy
                </Button>
              )}
              </div>
            </div>
            <div className="flex-shrink-0 flex justify-end pt-3 sm:pt-4 border-t border-border mt-2">
              <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Close</Button>
            </div>
          </>
        )}
        {loading && !data && (
          <div className="py-4 text-center text-sm text-muted-foreground">Loading…</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
