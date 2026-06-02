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
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex flex-col">
          <p className="text-xl font-bold tracking-tight text-foreground">
            Onus<span className="text-primary">.</span>
          </p>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {name} <span className="mx-1 opacity-50">•</span> {role}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          <Link
            href="/community"
            className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Community
          </Link>
          <Link
            href="/community/messages"
            className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Messages
          </Link>
          {role === "admin" ? (
            <>
              <Link
                href="/admin"
                className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/employees"
                className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Employees
              </Link>
              <Link
                href="/admin/settings"
                className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Settings
              </Link>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Dashboard
            </Link>
          )}
          <form action={logoutAction} className="ml-2">
            <Button type="submit" variant="outline" size="sm" className="h-9 font-medium shadow-sm">
              Logout
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
