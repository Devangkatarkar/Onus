import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import {
  getAttendanceHistory,
  getOfficeSettings,
  getTodayAttendance,
} from "@/lib/actions/attendance";
import { Header } from "@/components/shared/header";
import { MarkAttendance } from "@/components/attendance/mark-attendance";
import { AttendanceHistory } from "@/components/attendance/attendance-history";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const { profile } = await requireAuth();

  if (profile.role === "admin") {
    redirect("/admin");
  }

  const [office, todayAttendance, history] = await Promise.all([
    getOfficeSettings(),
    getTodayAttendance(),
    getAttendanceHistory(),
  ]);

  return (
    <div className="min-h-screen bg-background/50">
      <Header name={profile.name} role={profile.role} />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {profile.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Mark your daily attendance when you are at the office.
            </p>
            <Link href="/community" className="text-sm font-medium text-primary hover:underline">
              Go to Community →
            </Link>
          </CardContent>
        </Card>

        <MarkAttendance office={office} todayAttendance={todayAttendance} />
        <AttendanceHistory records={history} />
      </main>
    </div>
  );
}
