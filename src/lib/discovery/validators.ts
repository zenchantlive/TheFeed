/**
 * Phone & Website Validation
 *
 * Validates and normalizes contact data before storage.
 * - Phone: E.164 format (+19165551234)
 * - Website: https://, no www
 */

import { parsePhoneNumber } from "libphonenumber-js";

export function validatePhone(phone: string | null | undefined): {
  isValid: boolean;
  normalized: string | null;
  error?: string;
} {
  if (!phone) return { isValid: false, normalized: null };

  try {
    // Try parsing as US number (can be extended for international)
    const phoneNumber = parsePhoneNumber(phone, "US");

    if (!phoneNumber.isValid()) {
      return {
        isValid: false,
        normalized: null,
        error: "Invalid phone number format"
      };
    }

    // Return E.164 format for storage
    return {
      isValid: true,
      normalized: phoneNumber.format("E.164") // e.g., +19165551234
    };
  } catch (error) {
    return {
      isValid: false,
      normalized: null,
      error: error instanceof Error ? error.message : "Phone parsing failed"
    };
  }
}

export function validateWebsite(website: string | null | undefined): {
  isValid: boolean;
  normalized: string | null;
  error?: string;
} {
  if (!website) return { isValid: false, normalized: null };

  try {
    let url = website.trim();

    // Add https:// if missing protocol
    if (!url.match(/^https?:\/\//i)) {
      url = `https://${url}`;
    }

    const parsed = new URL(url);

    // Basic validation
    if (!parsed.hostname.includes(".")) {
      return {
        isValid: false,
        normalized: null,
        error: "Invalid domain format"
      };
    }

    // Normalize (remove www, force https)
    const normalized = `https://${parsed.hostname.replace(/^www\./i, "")}${parsed.pathname}${parsed.search}`;

    return {
      isValid: true,
      normalized
    };
  } catch {
    return {
      isValid: false,
      normalized: null,
      error: "Invalid URL format"
    };
  }
}

export async function validateWebsiteReachable(
  url: string,
  timeoutMs = 5000
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow"
    });

    clearTimeout(timeout);

    // Accept any 2xx or 3xx status
    return response.ok || (response.status >= 300 && response.status < 400);
  } catch {
    return false;
  }
}
