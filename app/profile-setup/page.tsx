import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { getProfileStatus, getSessionUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ProfileSetupPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { profile, error, errorCode } = await getProfileStatus(user.id);
  if (profile) {
    redirect(profile.role === "admin" ? "/admin" : "/dashboard");
  }

  const isRlsIssue =
    errorCode === "42P17" ||
    (error?.toLowerCase().includes("infinite recursion") ?? false);

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Profile not found</CardTitle>
          <CardDescription>
            You are signed in, but the app cannot load your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p>
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p className="mt-1 break-all">
              <span className="font-medium">User ID:</span> {user.id}
            </p>
          </div>

          {error && (
            <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
              Database error: {error}
              {isRlsIssue && (
                <span className="mt-2 block">
                  Re-run the updated <code>supabase/rls-policies.sql</code> in
                  Supabase SQL Editor, then refresh this page.
                </span>
              )}
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            In Supabase SQL Editor, run this (uses your exact user ID):
          </p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs">
            {`insert into profiles (id, name, role)
values ('${user.id}', 'Admin User', 'admin')
on conflict (id) do update
  set name = excluded.name, role = 'admin';`}
          </pre>

          <p className="text-sm text-muted-foreground">
            Or use <code>supabase/bootstrap-admin.sql</code> with your email,
            then sign out and sign in again.
          </p>

          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
