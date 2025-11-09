import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EventCreationWizard } from "@/components/events/event-creation-wizard";

export default async function NewEventPage() {
  // Check authentication
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Host an event</h1>
          <p className="text-muted-foreground mt-2">
            Create a community potluck or volunteer opportunity
          </p>
        </div>

        <EventCreationWizard />
      </div>
    </div>
  );
}
