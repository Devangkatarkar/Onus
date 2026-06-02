"use client";

import { useActionState } from "react";
import { createEventAction, type CommunityFormState } from "@/lib/actions/community";
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

export function CreateEventForm() {
  const [state, action, pending] = useActionState<CommunityFormState, FormData>(
    createEventAction,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start a topic</CardTitle>
        <CardDescription>
          All employees and admins can create topics — not admin only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Weekend plan" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">What&apos;s this about?</Label>
            <Input id="description" name="description" placeholder="Optional details" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input id="location" name="location" placeholder="Office / online" />
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
            {pending ? "Creating..." : "Create topic"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
