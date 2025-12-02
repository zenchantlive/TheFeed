import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getResourceStats } from "@/lib/admin-queries";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const statLabels: Record<keyof Awaited<ReturnType<typeof getResourceStats>>, string> = {
  unverified: "Unverified",
  communityVerified: "Community Verified",
  official: "Official",
  rejected: "Rejected",
  duplicate: "Potential Duplicates",
  total: "Total Resources",
};

function formatStatLabel(key: keyof typeof statLabels) {
  return statLabels[key];
}

export default async function AdminOverviewPage() {
  const stats = await getResourceStats();

  const lastUpdated = formatDistanceToNow(new Date(), { addSuffix: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor verification progress and jump back into triage workflows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(stats) as Array<keyof typeof stats>).map((key) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {formatStatLabel(key)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                {stats[key as keyof typeof stats]}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Queue</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Last reviewed {lastUpdated}. Keep the queue flowing by confirming
            resource details or rejecting duplicates.
          </div>
          <Button asChild>
            <Link href="/admin/verification">Open workspace</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
