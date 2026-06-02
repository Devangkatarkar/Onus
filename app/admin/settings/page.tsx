import { requireRole } from "@/lib/auth/session";
import { getOfficeSettings } from "@/lib/actions/attendance";
import { Header } from "@/components/shared/header";
import { OfficeSettingsForm } from "@/components/admin/office-settings-form";

export default async function AdminSettingsPage() {
  const { profile } = await requireRole(["admin"]);
  const office = await getOfficeSettings();

  return (
    <div className="min-h-screen bg-background/50">
      <Header name={profile.name} role={profile.role} />
      <main className="mx-auto max-w-3xl space-y-6 md:space-y-8 px-4 py-6 md:py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Office Settings</h1>
          <p className="text-muted-foreground">
            Configure the office location and attendance radius.
          </p>
        </div>
        <OfficeSettingsForm office={office} />
      </main>
    </div>
  );
}
