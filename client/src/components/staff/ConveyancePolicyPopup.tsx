import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type ConveyancePolicyVariant = "employee" | "team_lead";

type ConveyancePolicyPopupProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: ConveyancePolicyVariant;
};

function EmployeePolicyContent() {
  return (
    <div className="space-y-5 py-2 text-sm">
      <section>
        <h3 className="font-semibold text-foreground mb-2">Eligibility Conditions</h3>
        <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
          <li>Minimum <strong className="text-foreground">20</strong> Leads per month (Compulsory)</li>
          <li>Budget Achievement must be calculated monthly</li>
        </ul>
      </section>
      <section>
        <h3 className="font-semibold text-foreground mb-2">Payout Rules</h3>
        <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
          <li>If Leads &lt; 20 → Conveyance = <strong className="text-foreground">0</strong></li>
          <li>If Budget Achievement &lt; <strong className="text-foreground">60%</strong> → Conveyance = <strong className="text-foreground">0</strong></li>
          <li>If Budget Achievement ≥ <strong className="text-foreground">60%</strong> → <strong className="text-foreground">50%</strong> of Base Conveyance</li>
          <li>If Budget Achievement ≥ <strong className="text-foreground">100%</strong> → <strong className="text-foreground">120%</strong> of Base Conveyance</li>
        </ul>
      </section>
      <section>
        <h3 className="font-semibold text-foreground mb-2">Important Notes</h3>
        <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
          <li>Leads must be CRM recorded.</li>
          <li>Only disbursed cases will be counted towards budget.</li>
          <li>Conditions are mandatory for eligibility.</li>
        </ul>
      </section>
    </div>
  );
}

function TeamLeadPolicyContent() {
  return (
    <div className="space-y-5 py-2 text-sm">
      <section>
        <h3 className="font-semibold text-foreground mb-2">Eligibility Conditions</h3>
        <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
          <li>Minimum <strong className="text-foreground">4</strong> Joint Visits with team members per month (Compulsory)</li>
          <li>Minimum <strong className="text-foreground">10</strong> Leads per month (Compulsory)</li>
        </ul>
      </section>
      <section>
        <h3 className="font-semibold text-foreground mb-2">Payout Rules</h3>
        <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
          <li>If Joint Visits &lt; 4 → Conveyance = <strong className="text-foreground">0</strong></li>
          <li>If Leads &lt; 10 → Conveyance = <strong className="text-foreground">0</strong></li>
          <li>If Overall Budget Achievement &lt; <strong className="text-foreground">80%</strong> → Conveyance = <strong className="text-foreground">0</strong></li>
          <li>If Budget Achievement ≥ <strong className="text-foreground">80%</strong> → <strong className="text-foreground">50%</strong> of Base Conveyance</li>
          <li>If Budget Achievement ≥ <strong className="text-foreground">100%</strong> → <strong className="text-foreground">120%</strong> of Base Conveyance</li>
        </ul>
      </section>
      <section>
        <h3 className="font-semibold text-foreground mb-2">Important Notes</h3>
        <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
          <li>Joint visits must be logged in CRM.</li>
          <li>Budget is calculated based on total team performance.</li>
          <li>All conditions must be satisfied to receive payout.</li>
        </ul>
      </section>
    </div>
  );
}

export default function ConveyancePolicyPopup({ open, onOpenChange, variant }: ConveyancePolicyPopupProps) {
  const isTeamLead = variant === "team_lead";
  const title = isTeamLead ? "Team Lead Conveyance Policy" : "Employee Conveyance Policy";
  const description = isTeamLead
    ? "Eligibility and payout rules for team lead conveyance."
    : "Eligibility and payout rules for employee conveyance.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {isTeamLead ? <TeamLeadPolicyContent /> : <EmployeePolicyContent />}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
