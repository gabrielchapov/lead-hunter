/** Tiny static lookup so the "Localização" field works out of the box
 * without wiring up a real geocoding API key. Add cities as needed, or
 * replace `geocode()` with a call to Nominatim/Google Geocoding later —
 * it's the only place that needs to change.
 *
 * Keys are just the city name (lowercase, no state) so both "Itapoá, SC"
 * and "Itapoá, Santa Catarina" resolve the same way — we match on the
 * part before the first comma. */
const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  "itapoá": { lat: -26.1166, lng: -48.5833 },
  "porto alegre": { lat: -30.0346, lng: -51.2177 },
  "canoas": { lat: -29.92, lng: -51.1833 },
  "gravataí": { lat: -29.9444, lng: -50.9928 },
  "novo hamburgo": { lat: -29.6783, lng: -51.1306 },
  "são paulo": { lat: -23.5505, lng: -46.6333 },
  "rio de janeiro": { lat: -22.9068, lng: -43.1729 },
  "belo horizonte": { lat: -19.9167, lng: -43.9345 },
  "curitiba": { lat: -25.4284, lng: -49.2733 },
  "salvador": { lat: -12.9714, lng: -38.5014 },
  "fortaleza": { lat: -3.7172, lng: -38.5433 },
};

export const DEFAULT_LOCATION = "Itapoá, SC";

export function geocode(location: string): { lat: number; lng: number } {
  const city = location.split(",")[0].trim().toLowerCase();
  return KNOWN_LOCATIONS[city] ?? KNOWN_LOCATIONS["itapoá"];
}
