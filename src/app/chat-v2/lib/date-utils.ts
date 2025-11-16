/**
 * Formats an ISO timestamp into a human-readable time format
 * @param isoString - ISO 8601 timestamp (e.g., "2025-11-16T00:23:33.051Z")
 * @returns Formatted time string (e.g., "4:23 PM")
 */
export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "";
    }

    // Format as time only (e.g., "4:23 PM")
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "";
  }
}

/**
 * Formats an ISO timestamp into a full date-time format
 * @param isoString - ISO 8601 timestamp
 * @returns Formatted date-time string (e.g., "Nov 16, 4:23 PM")
 */
export function formatFullTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      return "";
    }

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      // For today, just show the time
      return formatTimestamp(isoString);
    }

    // For other days, show date + time
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Error formatting full timestamp:", error);
    return "";
  }
}
