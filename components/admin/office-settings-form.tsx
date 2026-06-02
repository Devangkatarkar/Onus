"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOfficeSettingsAction } from "@/lib/actions/admin";
import { formatDateTime } from "@/lib/utils/date";
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
import type { OfficeSettings } from "@/types";

interface OfficeSettingsFormProps {
  office: OfficeSettings | null;
}

export function OfficeSettingsForm({ office }: OfficeSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [radius, setRadius] = useState(String(office?.radius ?? 100));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSetCurrentLocation() {
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const result = await updateOfficeSettingsAction(
          position.coords.latitude,
          position.coords.longitude,
          Number(radius)
        );

        if (result.error) {
          setError(result.error);
        } else {
          setMessage("Office location saved successfully.");
          startTransition(() => router.refresh());
        }
        setLoading(false);
      },
      () => {
        setError("Unable to read your location. Allow GPS access and try again.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Office Location</CardTitle>
        <CardDescription>
          Set the office coordinates from your current GPS position. Employees
          must be within the radius to mark attendance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {office && (
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <p>
              <span className="font-medium">Latitude:</span> {office.latitude}
            </p>
            <p>
              <span className="font-medium">Longitude:</span> {office.longitude}
            </p>
            <p>
              <span className="font-medium">Radius:</span> {office.radius}m
            </p>
            <p className="text-muted-foreground">
              Last updated: {formatDateTime(office.updated_at)}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="radius">Attendance radius (meters)</Label>
          <Input
            id="radius"
            type="number"
            min={10}
            max={5000}
            value={radius}
            onChange={(event) => setRadius(event.target.value)}
          />
        </div>

        {message && (
          <Alert className="border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
            {message}
          </Alert>
        )}

        {error && (
          <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
            {error}
          </Alert>
        )}

        <Button type="button" onClick={handleSetCurrentLocation} disabled={loading || isPending}>
          {loading || isPending ? "Saving..." : "Set Current Location As Office"}
        </Button>
      </CardContent>
    </Card>
  );
}
