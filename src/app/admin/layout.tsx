import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminSidebar } from "./components/sidebar";
import { AdminMobileNav } from "./components/mobile-nav";
import { validateAdminSession } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headerList = await headers();
  const request = new Request("http://localhost/admin", {
    headers: headerList,
  });

  const adminSession = await validateAdminSession(request);

  if (!adminSession) {
    redirect("/");
  }

  const userName = adminSession.session.user.name ?? "Admin";

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-muted/20">
      {/* Mobile Navigation */}
      <AdminMobileNav userName={userName} />

      {/* Desktop Sidebar */}
      <AdminSidebar userName={userName} className="hidden lg:flex" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
