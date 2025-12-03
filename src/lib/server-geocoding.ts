/**
 * Geocodes an address using Mapbox API (Server-Side).
 * Requires MAPBOX_SERVER_TOKEN or MAPBOX_TOKEN env var.
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zipCode?: string
): Promise<{ latitude: number; longitude: number } | null> {
  const mapboxToken =
    process.env.MAPBOX_SERVER_TOKEN || process.env.MAPBOX_TOKEN;
  if (!mapboxToken) {
    console.warn("Mapbox server token missing. Skipping geocoding.");
    return null;
  }

  const query = [address, city, state, zipCode].filter(Boolean).join(", ");
  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query
  )}.json?access_token=${mapboxToken}&limit=1`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { latitude: lat, longitude: lng };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
}
