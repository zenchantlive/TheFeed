/**
 * Admin Provider Claims Page
 * Server component that initializes the claims management interface
 */

import { Suspense } from "react";
import { ClaimsPageClient } from "./page-client";

export const metadata = {
  title: "Provider Claims | Admin",
  description: "Review and manage provider claims for resource ownership",
};

export default async function AdminClaimsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Provider Claims</h1>
        <p className="text-muted-foreground">
          Review and approve resource ownership claims from providers
        </p>
      </div>

      <Suspense fallback={<div>Loading claims...</div>}>
        <ClaimsPageClient />
      </Suspense>
    </div>
  );
}
