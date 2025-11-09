import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { EventDetailContent } from "@/components/events/event-detail-content";
import { getEventById } from "@/lib/event-queries";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;

  // Check authentication (optional for viewing, required for RSVPing)
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id || null;

  // Fetch event details directly from database
  const event = await getEventById(id);
  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <EventDetailContent event={event} currentUserId={currentUserId} />
    </div>
  );
}
