import { parse } from "date-fns";
import { type HoursType } from "./schema";
import { validatePhone, validateWebsite } from "./discovery/validators";

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type Weekday = (typeof WEEKDAYS)[number];

const SERVICE_SYNONYMS: Record<string, string> = {
  pantry: "Pantry",
  "food pantry": "Pantry",
  "food bank": "Pantry",
  distribution: "Food Distribution",
  "food distribution": "Food Distribution",
  "hot meal": "Hot Meal",
  "hot meals": "Hot Meal",
  "soup kitchen": "Hot Meal",
  "community meal": "Hot Meal",
  "free meal": "Hot Meal",
};

export type NormalizedHours = {
  timezone?: string | null;
  hours: HoursType | null;
};

export type NormalizedResource = {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  services: string[];
  hours: HoursType | null;
  sourceUrl?: string | null;
  confidence?: number | null;
  provenance?: {
    sources: string[];
    rawSnippet?: string;
  };
};

const normalizeString = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const to24Hour = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Already looks like 24h (HH:mm)
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(":").map(Number);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  // Try to parse simple formats with am/pm
  const parsed = parse(trimmed, "h:mm aa", new Date());
  if (!isNaN(parsed.getTime())) {
    const hours = parsed.getHours().toString().padStart(2, "0");
    const minutes = parsed.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  return null;
};

export function normalizeHours(
  input: unknown,
  opts: { timezone?: string | null } = {}
): NormalizedHours {
  if (!input || typeof input !== "object") {
    return { timezone: opts.timezone ?? null, hours: null };
  }

  type DayHours = HoursType[string];
  const result: Partial<Record<Weekday, DayHours | null>> = {};

  for (const day of WEEKDAYS) {
    const rawDay =
      (input as Record<string, unknown>)[day] ??
      (input as Record<string, unknown>)[day.toLowerCase()] ??
      (input as Record<string, unknown>)[day.toUpperCase()] ??
      (input as Record<string, unknown>)[day[0].toUpperCase() + day.slice(1)];

    if (!rawDay) {
      result[day] = null;
      continue;
    }

    if (typeof rawDay !== "object") {
      result[day] = null;
      continue;
    }

    const dayRecord = rawDay as Record<string, unknown>;
    const open = typeof dayRecord.open === "string" ? normalizeString(dayRecord.open) : null;
    const close = typeof dayRecord.close === "string" ? normalizeString(dayRecord.close) : null;
    const closed = dayRecord.closed === true;

    if (closed) {
      result[day] = { open: "00:00", close: "00:00", closed: true };
      continue;
    }

    const open24 = open ? to24Hour(open) : null;
    const close24 = close ? to24Hour(close) : null;

    if (!open24 || !close24) {
      result[day] = null;
      continue;
    }

    result[day] = { open: open24, close: close24 };
  }

  return { timezone: opts.timezone ?? null, hours: result as HoursType };
}

export function normalizeServices(services: unknown): string[] {
  if (!Array.isArray(services)) return [];

  const normalized = services
    .map((service) => (typeof service === "string" ? service.trim() : ""))
    .filter(Boolean)
    .map((service) => {
      const key = service.toLowerCase();
      return SERVICE_SYNONYMS[key] ?? SERVICE_SYNONYMS[key.replace(/\s+/g, " ")] ?? service;
    });

  const unique = Array.from(new Set(normalized));
  return unique.sort((a, b) => a.localeCompare(b));
}

export function normalizePhone(phone?: string | null): string | null {
  const validation = validatePhone(phone);
  return validation.normalized;
}

export function normalizeWebsite(website?: string | null): string | null {
  const validation = validateWebsite(website);
  return validation.normalized;
}

export function normalizeResource(resource: NormalizedResource): NormalizedResource {
  const hours = normalizeHours(resource.hours ?? null).hours;
  const services = normalizeServices(resource.services);

  return {
    ...resource,
    name: resource.name.trim(),
    address: resource.address.trim(),
    city: resource.city.trim(),
    state: resource.state.trim(),
    zipCode: resource.zipCode.trim(),
    phone: normalizePhone(resource.phone),
    website: normalizeWebsite(resource.website),
    description: normalizeString(resource.description),
    services,
    hours,
    confidence: resource.confidence,
    provenance: resource.provenance,
  };
}

export function getDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    const out = new URL(url);
    return out.hostname.toLowerCase();
  } catch {
    return null;
  }
}

const TRUSTED_HOST_SUFFIXES = [".gov", ".org"];
const TRUSTED_HOST_ALLOWLIST = ["feedingamerica.org", "usda.gov", "ca.gov"];

export function isTrustedSource(url?: string | null): boolean {
  const host = getDomain(url);
  if (!host) return false;
  if (TRUSTED_HOST_ALLOWLIST.some((h) => host === h || host.endsWith(`.${h}`))) return true;
  return TRUSTED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/**
 * Creates a normalized fingerprint for an address to help with deduplication.
 * E.g., "123 Main St., Apt 4" -> "123mainstapt4"
 * Also handles common abbreviations.
 */
export function getAddressFingerprint(address?: string | null): string | null {
  if (!address) return null;

  let normalized = address.toLowerCase().trim();

  // Common substitutions for consistency
  const replacements: Record<string, string> = {
    "street": "st",
    "avenue": "ave",
    "boulevard": "blvd",
    "road": "rd",
    "drive": "dr",
    "lane": "ln",
    "court": "ct",
    "circle": "cir",
    "highway": "hwy",
    "suite": "ste",
    "apartment": "apt",
    "building": "bldg",
    "floor": "fl",
    "north": "n",
    "south": "s",
    "east": "e",
    "west": "w",
  };

  // Replace whole words
  for (const [full, abbr] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${full}\\b`, "g");
    normalized = normalized.replace(regex, abbr);
  }

  // Remove all non-alphanumeric characters
  return normalized.replace(/[^a-z0-9]/g, "");
}
