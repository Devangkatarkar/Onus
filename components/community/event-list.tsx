import Link from "next/link";
import { formatDateTime } from "@/lib/utils/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommunityEvent } from "@/types";

export function EventList({ events }: { events: CommunityEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active topics yet. Start one to discuss, vote, or collect payments.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {events.map((event) => (
        <Link key={event.id} href={`/community/${event.id}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              {event.description && <p className="line-clamp-2">{event.description}</p>}
              {event.location && <p>{event.location}</p>}
              <p>By {event.profiles?.name ?? "Unknown"}</p>
              <p className="text-xs">Active since {formatDateTime(event.created_at)}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
