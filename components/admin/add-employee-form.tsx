"use client";

import { useActionState } from "react";
import {
  createEmployeeAction,
  type EmployeeFormState,
} from "@/lib/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AddEmployeeFormProps {
  disabled?: boolean;
}

export function AddEmployeeForm({ disabled = false }: AddEmployeeFormProps) {
  const [state, formAction, pending] = useActionState<
    EmployeeFormState,
    FormData
  >(createEmployeeAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Employee</CardTitle>
        <CardDescription>
          Creates a login account and profile. The employee can sign in
          immediately with these credentials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Jane Smith"
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane@company.com"
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={6}
              placeholder="Min. 6 characters"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              defaultValue="employee"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {state?.error && (
            <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
              {state.error}
            </Alert>
          )}
          {state?.success && (
            <Alert className="border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
              {state.success}
            </Alert>
          )}

          <Button type="submit" disabled={pending || disabled}>
            {pending ? "Creating..." : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
