"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types";
import { logoutAction } from "@/lib/actions/auth";

interface MobileNavProps {
  role: UserRole;
}

export function MobileNav({ role }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="sm" onClick={toggle} className="h-10 w-10">
        <span className="sr-only">Toggle menu</span>
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-background border-b border-border shadow-lg p-4 slide-in-from-top-2 animate-in duration-200">
          <nav className="flex flex-col space-y-2">
            <Link
              href="/community"
              onClick={close}
              className="px-4 py-3 text-base font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Community
            </Link>
            <Link
              href="/community/messages"
              onClick={close}
              className="px-4 py-3 text-base font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Messages
            </Link>
            {role === "admin" ? (
              <>
                <Link
                  href="/admin"
                  onClick={close}
                  className="px-4 py-3 text-base font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/employees"
                  onClick={close}
                  className="px-4 py-3 text-base font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Employees
                </Link>
                <Link
                  href="/admin/settings"
                  onClick={close}
                  className="px-4 py-3 text-base font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Settings
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                onClick={close}
                className="px-4 py-3 text-base font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Dashboard
              </Link>
            )}
            <form action={logoutAction} className="pt-2">
              <Button type="submit" variant="outline" className="w-full h-11 font-medium shadow-sm">
                Logout
              </Button>
            </form>
          </nav>
        </div>
      )}
    </div>
  );
}
