import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminSidebar } from "./components/sidebar";
import { validateAdminSession } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headerList = headers();
  const request = new Request("http://localhost/admin", {
    headers: headerList,
  });

  const adminSession = await validateAdminSession(request);

  if (!adminSession) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <AdminSidebar userName={adminSession.session.user.name ?? "Admin"} />
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
