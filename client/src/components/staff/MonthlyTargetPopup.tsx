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

export default function MonthlyTargetPopup() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<MonthlyTargetData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    staffJson<MonthlyTargetData | { forStaffOnly: boolean }>("/staff/monthly-target")
      .then((res) => {
        if ("forStaffOnly" in res && res.forStaffOnly) return;
        setData(res as MonthlyTargetData);
        setOpen(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isTeamLead = data?.forTeamLead ?? false;
  const title = isTeamLead ? "Team monthly target" : "Monthly Target";
  const subtitle = isTeamLead
    ? `Your team's performance for ${data?.monthLabel ?? "this month"}. Shown on login.`
    : `Your performance for ${data?.monthLabel ?? "this month"}. Shown on login.`;
  const conveyanceLabel = isTeamLead ? "Team conveyance" : "Your conveyance";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              <p className="mb-2 font-medium">Conveyance conditions</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Min leads compulsory: 20 leads per month</li>
                <li>• Achievement % &gt; 75%: Eligible for 50% conveyance</li>
                <li>• Achievement % &gt; 100%: Eligible for 100% conveyance</li>
              </ul>
              <p className="mt-3 text-base font-semibold">
                {conveyanceLabel}: <span className="text-primary">{data.conveyancePct}%</span>
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
