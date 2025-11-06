export type Coordinates = {
  lat: number;
  lng: number;
};

/**
 * Wraps the browser geolocation API in a promise for easier consumption.
 * Should be invoked from a client component.
 */
export async function getUserLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not supported in this environment."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) => reject(error)
    );
  });
}

const EARTH_RADIUS_MILES = 3958.8;

/**
 * Calculates the distance between two points on Earth using the Haversine formula.
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const lat1 = toRadians(point1.lat);
  const lat2 = toRadians(point2.lat);
  const deltaLat = toRadians(point2.lat - point1.lat);
  const deltaLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

const HOURS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

type HoursDay = {
  open: string;
  close: string;
  closed?: boolean;
};

type HoursRecord = Record<string, HoursDay>;

/**
 * Determines if a given hours config indicates the location is currently open.
 */
export function isCurrentlyOpen(hours: HoursRecord | null | undefined): boolean {
  if (!hours) return false;

  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const today = hours[day];

  if (!today || today.closed) return false;

  const [openHour, openMinute, openPeriod] = parseTime(today.open);
  const [closeHour, closeMinute, closePeriod] = parseTime(today.close);

  if (
    openHour === null ||
    openMinute === null ||
    closeHour === null ||
    closeMinute === null
  ) {
    return false;
  }

  const openDate = new Date(now);
  openDate.setHours(convertTo24Hour(openHour, openPeriod), openMinute, 0, 0);

  const closeDate = new Date(now);
  closeDate.setHours(convertTo24Hour(closeHour, closePeriod), closeMinute, 0, 0);

  // Handle overnight schedules by rolling close time to next day.
  if (closeDate <= openDate) {
    closeDate.setDate(closeDate.getDate() + 1);
  }

  return now >= openDate && now <= closeDate;
}

/**
 * Formats raw open/close strings for display (e.g., "9:00 AM").
 */
export function formatHoursForDisplay(hours: HoursDay | undefined): string {
  if (!hours || hours.closed) return "Closed today";

  return `${normalizeTimeString(hours.open)} - ${normalizeTimeString(
    hours.close
  )}`;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function parseTime(timeString: string): [number | null, number | null, string] {
  const time = timeString.trim().toUpperCase();
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return [null, null, ""];
  const [, hour, minute, period] = match;
  return [Number(hour), Number(minute), period];
}

function convertTo24Hour(hour: number, period: string): number {
  if (period === "AM") {
    return hour === 12 ? 0 : hour;
  }
  return hour === 12 ? 12 : hour + 12;
}

function normalizeTimeString(time: string): string {
  const parsedDate = new Date(`1970-01-01T${convertTo24HourString(time)}:00`);
  return HOURS_FORMATTER.format(parsedDate);
}

function convertTo24HourString(time: string): string {
  const [hour, minute, period] = parseTime(time);
  if (hour === null || minute === null || !period) return "00:00";
  const hours24 = convertTo24Hour(hour, period);
  return `${String(hours24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
