import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Agency profile and operator preferences" />
      <div className="grid gap-6 p-8 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-display text-base font-semibold">Agency Profile</h3>
          <p className="mt-1 text-sm text-muted-foreground">Branding shown on vouchers and emails.</p>
          <div className="mt-5 space-y-4">
            <F label="Agency Name"><Input defaultValue="InTravelSync" /></F>
            <F label="Contact Email"><Input defaultValue="ops@intravelsync.com" /></F>
            <F label="Support Phone"><Input defaultValue="+374 11 22 33 44" /></F>
            <F label="Address"><Textarea rows={2} defaultValue="12 Abovyan Street, Yerevan, Armenia" /></F>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-display text-base font-semibold">Voucher Defaults</h3>
          <p className="mt-1 text-sm text-muted-foreground">Defaults applied to every generated voucher.</p>
          <div className="mt-5 space-y-4">
            <F label="Voucher Footer Text"><Textarea rows={3} defaultValue="Thank you for travelling with us. Please present this voucher to your guide." /></F>
            <Row label="Include QR code" desc="Add a scannable booking reference"><Switch defaultChecked /></Row>
            <Row label="Auto-send confirmation email" desc="Sent when voucher is generated"><Switch defaultChecked /></Row>
            <Row label="Show operator signature line" desc="Blank line for handwritten sign-off"><Switch /></Row>
          </div>
        </Card>
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-display text-base font-semibold">Save Changes</h3>
          <p className="mt-1 text-sm text-muted-foreground">All changes apply immediately across the workspace.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline">Reset</Button>
            <Button onClick={() => toast.success("Settings saved")}>Save Settings</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}
