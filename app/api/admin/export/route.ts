import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  // Fetch all employees
  const { data: employees, error: empError } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("role", "employee")
    .order("name", { ascending: true });

  if (empError) {
    return NextResponse.json({ error: empError.message }, { status: 500 });
  }

  // Fetch attendance records for the date
  const { data: attendance, error: attError } = await supabase
    .from("attendance")
    .select("user_id")
    .eq("attendance_date", date);

  if (attError) {
    return NextResponse.json({ error: attError.message }, { status: 500 });
  }

  const presentIds = new Set((attendance ?? []).map((r) => r.user_id));

  const rows = (employees ?? []).map((emp) => ({
    Name: emp.name ?? "Unknown",
    Date: date,
    Status: presentIds.has(emp.id) ? "Present" : "Absent",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const filename = `attendance_${date.replace(/-/g, "_")}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
