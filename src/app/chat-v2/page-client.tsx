"use client";

import { CopilotKit, useCopilotReadable } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import "./copilot-theme.css";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useResolvedLocation } from "@/app/chat/hooks/use-resolved-location";
import { EnhancedChatV2 } from "./components/enhanced-chat-v2";

const INTENT_PRESETS = {
  hungry:
    "Hey Sous-Chef, I'm hungry. Find the closest warm meals or pantries open within the next hour and tell me what to bring.",
  full:
    "Hey Sous-Chef, I'm full. Help me share my leftovers or volunteer nearby so nothing goes to waste.",
};

const DEFAULT_RADIUS_MILES = 10;

interface ChatV2ClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
}

// Component to inject user context via useCopilotReadable
function UserContextProvider({
  user,
  coords,
  locationLabel,
}: {
  user: ChatV2ClientProps["user"];
  coords: { lat: number; lng: number } | null;
  locationLabel: string | null;
}) {
  // Inject user context so the AI knows the user's location
  useCopilotReadable({
    description: "User's current location and search preferences",
    value: {
      userId: user?.id || null,
      location: coords
        ? {
            lat: coords.lat,
            lng: coords.lng,
            label: locationLabel || "Current location",
          }
        : null,
      radiusMiles: DEFAULT_RADIUS_MILES,
    },
  });

  // Also inject user profile info
  useCopilotReadable({
    description: "Authenticated user information",
    value: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      : "No user logged in",
  });

  return null; // This component doesn't render anything
}

export default function ChatV2Client({ user }: ChatV2ClientProps) {
  const searchParams = useSearchParams();
  const {
    coords,
    label: locationLabel,
  } = useResolvedLocation();

  const [hasAppliedIntent, setHasAppliedIntent] = useState(false);
  const hasFiredIntentRef = useRef(false);

  // Handle deep link intents
  useEffect(() => {
    if (hasFiredIntentRef.current || hasAppliedIntent) return;

    const intent = searchParams?.get("intent");
    if (intent && (intent === "hungry" || intent === "full")) {
      hasFiredIntentRef.current = true;
      setHasAppliedIntent(true);

      // TODO: Implement auto-send via useCopilotChat when CopilotChat is ready
      console.log("Intent detected:", intent, INTENT_PRESETS[intent]);
    }
  }, [searchParams, hasAppliedIntent]);

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      publicLicenseKey={process.env.NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY}
    >
      {/* Inject user context into the AI */}
      <UserContextProvider
        user={user}
        coords={coords}
        locationLabel={locationLabel}
      />

      {/* Enhanced Chat with Generative UI - full page, no wrapper */}
      <EnhancedChatV2
        coords={coords}
        locationLabel={locationLabel}
        user={user}
      />
    </CopilotKit>
  );
}
