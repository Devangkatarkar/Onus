"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTodayDateString } from "@/lib/utils/date";

export function ExportAttendance() {
  const [date, setDate] = useState(getTodayDateString());

  function handleExport() {
    window.location.href = `/api/admin/export?date=${date}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Attendance</CardTitle>
        <CardDescription>
          Download attendance records as an Excel file for a selected date.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="export-date">Date</Label>
          <Input
            id="export-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <Button type="button" onClick={handleExport}>
          Export to Excel
        </Button>
      </CardContent>
    </Card>
  );
}
