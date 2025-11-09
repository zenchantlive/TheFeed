/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import type { EventDetails } from "@/lib/event-queries";

interface EventDetailContentProps {
  event: EventDetails;
  currentUserId: string | null;
}

export function EventDetailContent({ event, currentUserId }: EventDetailContentProps) {
  const router = useRouter();
  const [isRsvping, setIsRsvping] = useState(false);
  const [showRsvpForm, setShowRsvpForm] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [rsvpNotes, setRsvpNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [slotModal, setSlotModal] = useState<{ id: string; name: string } | null>(null);
  const [slotDetails, setSlotDetails] = useState("");
  const [slotModalError, setSlotModalError] = useState<string | null>(null);
  const [slotActionError, setSlotActionError] = useState<string | null>(null);
  const [isSubmittingSlot, setIsSubmittingSlot] = useState(false);
  const [unclaimingSlotId, setUnclaimingSlotId] = useState<string | null>(null);

  // Check if current user has RSVP'd
  const userRsvp = event.rsvps.find((a) => a.userId === currentUserId);
  const isAttending = userRsvp?.status === "attending";
  const isWaitlisted = userRsvp?.status === "waitlisted";
  const hasRsvpd = Boolean(userRsvp);

  // Check if event is full
  const isFull = event.capacity !== null && event.rsvpCount >= event.capacity;

  const handleRsvp = async () => {
    if (!currentUserId) {
      router.push("/");
      return;
    }

    setIsRsvping(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "attending",
          guestCount,
          notes: rsvpNotes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to RSVP");
      }

      // Refresh page to show updated data
      router.refresh();
      setShowRsvpForm(false);
    } catch (err) {
      console.error("RSVP error:", err);
      setError(err instanceof Error ? err.message : "Failed to RSVP");
    } finally {
      setIsRsvping(false);
    }
  };

  const handleCancelRsvp = async () => {
    if (!currentUserId || !hasRsvpd) return;

    setIsRsvping(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel RSVP");
      }

      router.refresh();
    } catch (err) {
      console.error("Cancel RSVP error:", err);
      setError(err instanceof Error ? err.message : "Failed to cancel RSVP");
    } finally {
      setIsRsvping(false);
    }
  };

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "EEEE, MMMM d, yyyy 'at' h:mm a");
  };

  const attending = event.rsvps.filter((a) => a.status === "attending");
  const waitlisted = event.rsvps.filter((a) => a.status === "waitlisted");

  const handleOpenSlotModal = (slotId: string, slotName: string) => {
    setSlotModal({ id: slotId, name: slotName });
    setSlotDetails("");
    setSlotModalError(null);
    setSlotActionError(null);
  };

  const handleCloseSlotModal = () => {
    if (isSubmittingSlot) return;
    setSlotModal(null);
    setSlotDetails("");
    setSlotModalError(null);
  };

  const handleSubmitSlot = async () => {
    if (!slotModal || !currentUserId) return;
    const trimmedDetails = slotDetails.trim();
    if (!trimmedDetails) {
      setSlotModalError("Please describe what you're bringing.");
      return;
    }

    setIsSubmittingSlot(true);
    setSlotModalError(null);
    setSlotActionError(null);
    let didSucceed = false;

    try {
      const response = await fetch(
        `/api/events/${event.id}/slots/${slotModal.id}/claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ details: trimmedDetails }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to claim slot");
      }

      didSucceed = true;
      router.refresh();
    } catch (err) {
      console.error("Claim slot error:", err);
      setSlotModalError(err instanceof Error ? err.message : "Failed to claim slot");
    } finally {
      setIsSubmittingSlot(false);
      if (didSucceed) {
        handleCloseSlotModal();
      }
    }
  };

  const handleUnclaimSlot = async (slotId: string) => {
    if (!currentUserId || unclaimingSlotId) return;
    setUnclaimingSlotId(slotId);
    setSlotActionError(null);

    try {
      const response = await fetch(`/api/events/${event.id}/slots/${slotId}/claim`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to unclaim slot");
      }

      router.refresh();
    } catch (err) {
      console.error("Unclaim slot error:", err);
      setSlotActionError(err instanceof Error ? err.message : "Failed to unclaim slot");
    } finally {
      setUnclaimingSlotId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Event Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {event.eventType === "potluck" && (
            <Badge variant="secondary">🎉 Potluck</Badge>
          )}
          {event.eventType === "volunteer" && (
            <Badge variant="secondary">🤝 Volunteer</Badge>
          )}
          {event.isVerified && <Badge variant="default">✓ Guide Verified</Badge>}
          {event.isPublicLocation && <Badge variant="outline">Public Location</Badge>}
        </div>

        <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

        <div className="flex items-center gap-4 text-muted-foreground mb-6">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {event.host.image && <img src={event.host.image} alt={event.host.name} />}
            </Avatar>
            <span>Hosted by <strong>{event.host.name}</strong></span>
          </div>
        </div>

        {/* Event Metadata */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">Date</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(event.startTime)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">Duration</p>
              <p className="text-sm text-muted-foreground">
                {format(event.startTime, "h:mm a")} -{" "}
                {format(event.endTime, "h:mm a")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">Location</p>
              <p className="text-sm text-muted-foreground">{event.location}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">Attendance</p>
              <p className="text-sm text-muted-foreground">
                {event.rsvpCount} {event.rsvpCount === 1 ? "person" : "people"} attending
                {event.capacity && ` (capacity: ${event.capacity})`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Description */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">About this event</h2>
        <p className="whitespace-pre-wrap text-muted-foreground">{event.description}</p>
      </Card>

      {/* RSVP Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">RSVP</h2>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!hasRsvpd && !showRsvpForm && (
          <div>
            {isFull ? (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This event is at capacity. You can join the waitlist and we'll notify you if a
                  spot opens up.
                </AlertDescription>
              </Alert>
            ) : null}

            <Button onClick={() => setShowRsvpForm(true)} size="lg" className="w-full">
              {isFull ? "Join Waitlist" : "RSVP to this event"}
            </Button>
          </div>
        )}

        {!hasRsvpd && showRsvpForm && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guestCount">Guest count</Label>
              <Input
                id="guestCount"
                type="number"
                min={1}
                max={10}
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || 1)}
              />
              <p className="text-sm text-muted-foreground">
                Including yourself (1 = just you, 2 = you + 1 guest)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rsvpNotes">Notes (optional)</Label>
              <Textarea
                id="rsvpNotes"
                placeholder="Dietary restrictions, accessibility needs, etc."
                value={rsvpNotes}
                onChange={(e) => setRsvpNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRsvp} disabled={isRsvping} className="flex-1">
                {isRsvping ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm RSVP
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRsvpForm(false)}
                disabled={isRsvping}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {hasRsvpd && (
          <div className="space-y-4">
            {isAttending && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>You're attending!</strong>
                  {userRsvp?.guestCount && userRsvp.guestCount > 1 && (
                    <> (with {userRsvp.guestCount - 1} guest{userRsvp.guestCount > 2 ? "s" : ""})</>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {isWaitlisted && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>You're on the waitlist.</strong> We'll notify you if a spot opens up.
                </AlertDescription>
              </Alert>
            )}

            {userRsvp?.notes && (
              <div className="text-sm text-muted-foreground">
                <strong>Your notes:</strong> {userRsvp.notes}
              </div>
            )}

            <Button variant="outline" onClick={handleCancelRsvp} disabled={isRsvping}>
              {isRsvping ? "Canceling..." : "Cancel RSVP"}
            </Button>
          </div>
        )}
      </Card>

      {/* Attendee List */}
      {attending.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Attending ({attending.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {attending.map((rsvp) => (
              <div key={rsvp.id} className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {rsvp.user.image && <img src={rsvp.user.image} alt={rsvp.user.name} />}
                </Avatar>
                <span className="text-sm">
                  {rsvp.user.name}
                  {rsvp.guestCount > 1 && <span className="text-muted-foreground"> +{rsvp.guestCount - 1}</span>}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Waitlist */}
      {waitlisted.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Waitlist ({waitlisted.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {waitlisted.map((rsvp) => (
              <div key={rsvp.id} className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {rsvp.user.image && <img src={rsvp.user.image} alt={rsvp.user.name} />}
                </Avatar>
                <span className="text-sm text-muted-foreground">{rsvp.user.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sign-up Sheet (Potlucks only) */}
      {event.eventType === "potluck" && event.signUpSlots.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">What to bring</h2>
          {slotActionError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{slotActionError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            {event.signUpSlots.map((slot) => (
              <PotluckSlotItem
                key={slot.id}
                slot={slot}
                isAttending={Boolean(isAttending)}
                currentUserId={currentUserId}
                unclaimingSlotId={unclaimingSlotId}
                onClaim={handleOpenSlotModal}
                onUnclaim={handleUnclaimSlot}
              />
            ))}
          </div>
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {isAttending
                ? "Let everyone know what you're bringing by claiming a slot below."
                : "RSVP first, then claim a slot to let everyone know what you're bringing."}
            </AlertDescription>
          </Alert>
        </Card>
      )}

      <Dialog open={Boolean(slotModal)} onOpenChange={(open) => { if (!open) handleCloseSlotModal(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {slotModal ? `Claim "${slotModal.name}"` : "Claim slot"}
            </DialogTitle>
            <DialogDescription>
              Share what you're bringing so other attendees can plan around it.
            </DialogDescription>
          </DialogHeader>
          {slotModalError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{slotModalError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="slotDetails">Details</Label>
            <Textarea
              id="slotDetails"
              placeholder="e.g., Bringing veggie lasagna"
              value={slotDetails}
              onChange={(e) => setSlotDetails(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {slotDetails.length}/200 characters
            </p>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" onClick={handleCloseSlotModal} disabled={isSubmittingSlot}>
              Cancel
            </Button>
            <Button onClick={handleSubmitSlot} disabled={isSubmittingSlot}>
              {isSubmittingSlot ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                "Claim slot"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type PotluckSlotItemProps = {
  slot: EventDetails["signUpSlots"][number];
  isAttending: boolean;
  currentUserId: string | null;
  unclaimingSlotId: string | null;
  onClaim: (slotId: string, slotName: string) => void;
  onUnclaim: (slotId: string) => void | Promise<void>;
};

function PotluckSlotItem({
  slot,
  isAttending,
  currentUserId,
  unclaimingSlotId,
  onClaim,
  onUnclaim,
}: PotluckSlotItemProps) {
  const claimCount = slot.claimCount ?? 0;
  const maxClaims = slot.maxClaims ?? 0;
  const slotIsFull = maxClaims > 0 ? claimCount >= maxClaims : false;
  const userSlotClaim = slot.claims.find((claim) => claim.user.id === currentUserId);
  const showClaimButton = isAttending && !userSlotClaim;
  const canClaimSlot = showClaimButton && !slotIsFull;
  const isUnclaiming = unclaimingSlotId === slot.id;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{slot.slotName}</h3>
          {slot.description && (
            <p className="text-sm text-muted-foreground">{slot.description}</p>
          )}
        </div>
        <Badge variant={slotIsFull ? "secondary" : "outline"}>
          {claimCount}/{maxClaims}
        </Badge>
      </div>

      {slot.claims.length > 0 && (
        <div className="space-y-2">
          {slot.claims.map((claim) => (
            <div key={claim.id} className="flex items-center gap-2 text-sm">
              <Avatar className="h-6 w-6">
                {claim.user.image && <img src={claim.user.image} alt={claim.user.name} />}
              </Avatar>
              <span className="font-medium">{claim.user.name}:</span>
              <span className="text-muted-foreground">{claim.details}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {userSlotClaim ? (
          <>
            <p className="text-sm">
              <span className="font-medium">You volunteered:</span>{" "}
              <span className="text-muted-foreground">{userSlotClaim.details}</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUnclaim(slot.id)}
              disabled={isUnclaiming}
            >
              {isUnclaiming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Unclaim"
              )}
            </Button>
          </>
        ) : showClaimButton ? (
          <Button
            size="sm"
            onClick={() => onClaim(slot.id, slot.slotName)}
            disabled={!canClaimSlot}
          >
            {slotIsFull ? "Slot full" : "Claim this slot"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">RSVP to claim this slot.</p>
        )}
      </div>

      {!slotIsFull && (
        <p className="text-sm text-muted-foreground">
          {Math.max(maxClaims - claimCount, 0)} more needed
        </p>
      )}

      {slotIsFull && !userSlotClaim && (
        <p className="text-xs text-muted-foreground">This slot is full.</p>
      )}
    </div>
  );
}
