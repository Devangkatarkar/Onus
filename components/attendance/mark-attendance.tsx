"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAttendanceAction } from "@/lib/actions/attendance";
import { haversineDistance } from "@/lib/utils/distance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Attendance, OfficeSettings } from "@/types";

interface MarkAttendanceProps {
  office: OfficeSettings | null;
  todayAttendance: Attendance | null;
}

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; latitude: number; longitude: number; distance: number }
  | { status: "error"; message: string };

export function MarkAttendance({ office, todayAttendance }: MarkAttendanceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requestLocation = useCallback(() => {
    if (!office) return;

    setLocation({ status: "loading" });
    setMessage(null);

    if (!navigator.geolocation) {
      setLocation({
        status: "error",
        message: "Geolocation is not supported by this browser.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = haversineDistance(
          latitude,
          longitude,
          office.latitude,
          office.longitude
        );

        setLocation({
          status: "ready",
          latitude,
          longitude,
          distance: Math.round(distance),
        });
      },
      (error) => {
        setLocation({
          status: "error",
          message:
            error.code === error.PERMISSION_DENIED
              ? "Location permission denied. Enable GPS to mark attendance."
              : "Unable to read your location. Try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [office]);

  useEffect(() => {
    if (office && !todayAttendance) {
      requestLocation();
    }
  }, [office, todayAttendance, requestLocation]);

  async function handleMarkPresent() {
    if (location.status !== "ready") return;

    setSubmitting(true);
    setMessage(null);

    const result = await markAttendanceAction(
      location.latitude,
      location.longitude
    );

    if (result.error) {
      setMessage(result.error);
      setSubmitting(false);
      return;
    }

    startTransition(() => {
      router.refresh();
    });
    setSubmitting(false);
  }

  const alreadyMarked = Boolean(todayAttendance);
  const withinRadius =
    location.status === "ready" &&
    office &&
    location.distance <= office.radius;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Attendance</CardTitle>
        <CardDescription>
          {alreadyMarked
            ? "You have already marked attendance for today."
            : "Your location is verified on the server when you mark present."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!office && (
          <Alert className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
            Office location is not configured yet. Please contact your admin.
          </Alert>
        )}

        {office && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {alreadyMarked ? (
              <Badge variant="success">Present</Badge>
            ) : location.status === "loading" ? (
              <Badge variant="secondary">Checking location...</Badge>
            ) : location.status === "error" ? (
              <Badge variant="warning">Location unavailable</Badge>
            ) : location.status === "ready" && withinRadius ? (
              <Badge variant="success">Within office radius</Badge>
            ) : location.status === "ready" ? (
              <Badge variant="warning">Outside office radius</Badge>
            ) : (
              <Badge variant="secondary">Waiting for location</Badge>
            )}
          </div>
        )}

        {location.status === "ready" && office && (
          <p className="text-sm text-muted-foreground">
            Distance from office: {location.distance}m (allowed: {office.radius}
            m)
          </p>
        )}

        {location.status === "error" && (
          <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
            {location.message}
          </Alert>
        )}

        {message && (
          <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
            {message}
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          {office && !alreadyMarked && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={requestLocation}
                disabled={location.status === "loading"}
              >
                Refresh Location
              </Button>
              <Button
                type="button"
                onClick={handleMarkPresent}
                disabled={!withinRadius || submitting || isPending}
              >
                {submitting || isPending ? "Saving..." : "Mark Present"}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
