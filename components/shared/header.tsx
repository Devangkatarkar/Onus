import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types";

interface HeaderProps {
  name: string;
  role: UserRole;
}

export function Header({ name, role }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div>
          <p className="text-lg font-semibold">Onus</p>
          <p className="text-sm text-muted-foreground">
            {name} · {role}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link
            href="/community"
            className="inline-flex h-10 items-center rounded-md px-4 text-sm font-medium hover:bg-accent"
          >
            Community
          </Link>
          <Link
            href="/community/messages"
            className="inline-flex h-10 items-center rounded-md px-4 text-sm font-medium hover:bg-accent"
          >
            Messages
          </Link>
          {role === "admin" ? (
            <>
              <Link
                href="/admin"
                className="inline-flex h-10 items-center rounded-md px-4 text-sm font-medium hover:bg-accent"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/employees"
                className="inline-flex h-10 items-center rounded-md px-4 text-sm font-medium hover:bg-accent"
              >
                Employees
              </Link>
              <Link
                href="/admin/settings"
                className="inline-flex h-10 items-center rounded-md px-4 text-sm font-medium hover:bg-accent"
              >
                Settings
              </Link>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-md px-4 text-sm font-medium hover:bg-accent"
            >
              Dashboard
            </Link>
          )}
          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              Logout
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
