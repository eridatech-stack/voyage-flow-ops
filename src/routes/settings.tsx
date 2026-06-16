import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Save, Building2, FileText, Mail, Globe } from "lucide-react";
import { useSettings, useUpdateSettings, DEFAULT_SETTINGS, type AgencySettings } from "@/hooks/useSettings";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const { data: saved, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [form, setForm] = useState<AgencySettings>(DEFAULT_SETTINGS);
  const [dirty, setDirty] = useState(false);

  // Populate form when settings load
  useEffect(() => {
    if (saved) { setForm(saved); setDirty(false); }
  }, [saved]);

  const set = (patch: Partial<AgencySettings>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  const save = () => update.mutate(form, { onSuccess: () => setDirty(false) });
  const reset = () => { if (saved) { setForm(saved); setDirty(false); } };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Agency profile, voucher defaults, and email configuration"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reset} disabled={!dirty}>Reset</Button>
            <Button size="sm" onClick={save} disabled={!dirty || update.isPending}>
              {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Settings
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 p-8 lg:grid-cols-2">
        {/* Agency Profile */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-base font-semibold">Agency Profile</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">Branding shown on vouchers and emails.</p>
          <div className="space-y-4">
            <F label="Agency Name *">
              <Input value={form.agency_name} onChange={(e) => set({ agency_name: e.target.value })} />
            </F>
            <F label="Contact Email *">
              <Input type="email" value={form.contact_email} onChange={(e) => set({ contact_email: e.target.value })} />
            </F>
            <F label="Support Phone">
              <Input value={form.support_phone ?? ""} onChange={(e) => set({ support_phone: e.target.value })} />
            </F>
            <F label="Website">
              <Input placeholder="https://" value={form.website ?? ""} onChange={(e) => set({ website: e.target.value })} />
            </F>
            <F label="Address">
              <Textarea rows={2} value={form.address ?? ""} onChange={(e) => set({ address: e.target.value })} />
            </F>
          </div>
        </Card>

        {/* Locale */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-base font-semibold">Locale & Currency</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">Regional settings for the workspace.</p>
          <div className="space-y-4">
            <F label="Currency">
              <Select value={form.currency} onValueChange={(v) => set({ currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD — US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">EUR — Euro (€)</SelectItem>
                  <SelectItem value="AMD">AMD — Armenian Dram (֏)</SelectItem>
                  <SelectItem value="GBP">GBP — British Pound (£)</SelectItem>
                  <SelectItem value="RUB">RUB — Russian Ruble (₽)</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="Timezone">
              <Select value={form.timezone} onValueChange={(v) => set({ timezone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Yerevan">Asia/Yerevan (GMT+4)</SelectItem>
                  <SelectItem value="Europe/Moscow">Europe/Moscow (GMT+3)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT+0/+1)</SelectItem>
                  <SelectItem value="Europe/Berlin">Europe/Berlin (GMT+1/+2)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (GMT-5/-4)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </F>
          </div>
        </Card>

        {/* Voucher Defaults */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-base font-semibold">Voucher Defaults</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">Defaults applied to every generated voucher.</p>
          <div className="space-y-4">
            <F label="Voucher Footer Text">
              <Textarea
                rows={3}
                value={form.voucher_footer ?? ""}
                onChange={(e) => set({ voucher_footer: e.target.value })}
              />
            </F>
            <Toggle
              label="Include QR code"
              desc="Add a scannable booking reference to each voucher"
              checked={form.voucher_show_qr}
              onChange={(v) => set({ voucher_show_qr: v })}
            />
            <Toggle
              label="Auto-send confirmation email"
              desc="Send email automatically when a voucher is generated"
              checked={form.voucher_auto_email}
              onChange={(v) => set({ voucher_auto_email: v })}
            />
            <Toggle
              label="Show operator signature line"
              desc="Add a blank line for handwritten sign-off"
              checked={form.voucher_signature_line}
              onChange={(v) => set({ voucher_signature_line: v })}
            />
          </div>
        </Card>

        {/* Email Configuration */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-base font-semibold">Email Configuration</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Powered by{" "}
            <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-amber underline">
              Resend
            </a>
            . Get your free API key at resend.com.
          </p>
          <div className="space-y-4">
            <F label="From Name">
              <Input
                placeholder="InTravelSync"
                value={form.email_from_name ?? ""}
                onChange={(e) => set({ email_from_name: e.target.value })}
              />
            </F>
            <F label="Reply-To Email">
              <Input
                type="email"
                placeholder="ops@youragency.com"
                value={form.email_reply_to ?? ""}
                onChange={(e) => set({ email_reply_to: e.target.value })}
              />
            </F>
            <F label="Resend API Key">
              <Input
                type="password"
                placeholder="re_••••••••••••••••••••••••"
                value={form.resend_api_key ?? ""}
                onChange={(e) => set({ resend_api_key: e.target.value })}
              />
            </F>
            <div className="rounded-md border border-amber/30 bg-amber/5 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-amber">Note:</span> After saving your Resend API key, email sending will be activated for voucher confirmations and customer notifications.
            </div>
          </div>
        </Card>

        {/* Save bar */}
        {dirty && (
          <div className="lg:col-span-2">
            <Card className="flex items-center justify-between p-4">
              <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reset}>Discard</Button>
                <Button size="sm" onClick={save} disabled={update.isPending}>
                  {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Settings
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
