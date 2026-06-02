import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SnackSession } from "@/types";

export function SnackList({ sessions }: { sessions: SnackSession[] }) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active snack times. Start one to collect orders and payments.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sessions.map((session) => (
        <Link key={session.id} href={`/community/snacks/${session.id}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <CardTitle className="text-lg">{session.title}</CardTitle>
              <Badge variant="secondary">{session.order_count ?? 0} orders</Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Organiser: {session.profiles?.name ?? "Unknown"}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
