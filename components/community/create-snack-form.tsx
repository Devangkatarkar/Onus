"use client";

import { useActionState } from "react";
import { createSnackSessionAction, type SnackFormState } from "@/lib/actions/snacks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CreateSnackForm() {
  const [state, action, pending] = useActionState<SnackFormState, FormData>(
    createSnackSessionAction,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organise snack time</CardTitle>
        <CardDescription>
          Any employee can start a snack run. Others send orders; you add your QR
          for payment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="snack-title">Title</Label>
            <Input
              id="snack-title"
              name="title"
              required
              placeholder="Friday chai & snacks"
            />
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
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Start snack time"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
