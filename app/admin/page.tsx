import { requireRole } from "@/lib/auth/session";
import { getAdminDashboardData } from "@/lib/actions/admin";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { Header } from "@/components/shared/header";
import Link from "next/link";
import { ExportAttendance } from "@/components/admin/export-attendance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminPage() {
  const { profile } = await requireRole(["admin"]);
  const { today, todayCount, totalEmployees, todayRecords } =
    await getAdminDashboardData();

  return (
    <div className="min-h-screen bg-background/50">
      <Header name={profile.name} role={profile.role} />
      <main className="mx-auto max-w-6xl space-y-6 md:space-y-8 px-4 py-6 md:py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Attendance overview for {formatDate(today)}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Attendance</CardTitle>
              <CardDescription>Employees marked present today</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{todayCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Employees</CardTitle>
              <CardDescription>Registered employee accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{totalEmployees}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Records</CardTitle>
            <CardDescription>All attendance marked for {formatDate(today)}</CardDescription>
          </CardHeader>
          <CardContent>
            {todayRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No attendance recorded yet today.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Marked At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {record.profiles?.name ?? "Unknown user"}
                      </TableCell>
                      <TableCell>{formatDateTime(record.marked_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Community</CardTitle>
            <CardDescription>Messages, topics, polls, and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/community"
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open community
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team management</CardTitle>
            <CardDescription>
              Add employees with email and password — no manual Supabase setup
              needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/employees"
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add employee
            </Link>
          </CardContent>
        </Card>

        <ExportAttendance />
      </main>
    </div>
  );
}
