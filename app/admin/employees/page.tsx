import { requireRole } from "@/lib/auth/session";
import { getEmployees } from "@/lib/actions/employees";
import { Header } from "@/components/shared/header";
import { AddEmployeeForm } from "@/components/admin/add-employee-form";
import { EmployeeList } from "@/components/admin/employee-list";
import { isServiceRoleConfigured, SERVICE_ROLE_SETUP_MESSAGE } from "@/lib/env";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export default async function AdminEmployeesPage() {
  const { profile } = await requireRole(["admin"]);
  const employees = await getEmployees();
  const canCreateUsers = isServiceRoleConfigured();

  return (
    <div className="min-h-full bg-muted/20">
      <Header name={profile.name} role={profile.role} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage employees</h1>
          <p className="text-muted-foreground">
            Create login accounts and profiles for your team.
          </p>
        </div>

        {!canCreateUsers && (
          <Alert className="border-amber-500/50 bg-amber-50 text-amber-950 dark:bg-amber-900/20 dark:text-amber-100">
            {SERVICE_ROLE_SETUP_MESSAGE}
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <AddEmployeeForm disabled={!canCreateUsers} />
          <EmployeeList employees={employees} />
        </div>
      </main>
    </div>
  );
}
