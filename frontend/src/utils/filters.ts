import type { Channels, Lead, SortBy } from "../types";
import { haversineKm } from "./haversine";

export interface FilterState {
  category: string; // "" = todas as categorias
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  channels: Channels;
  includeSite: boolean;
  sortBy: SortBy;
}

export interface FilteredLead extends Lead {
  distanceKm: number;
}

/** Recomputes the visible/sorted lead list. Cheap enough (dozens–low
 * hundreds of leads) to just re-run on every state change rather than
 * memoizing aggressively — matches the design spec's "live" filtering. */
export function filterAndSortLeads(
  leads: Lead[],
  filters: FilterState
): FilteredLead[] {
  const anyChannelActive =
    filters.channels.wa || filters.channels.ig || filters.channels.em;

  const withDistance: FilteredLead[] = leads.map((lead) => ({
    ...lead,
    distanceKm: haversineKm(
      filters.centerLat,
      filters.centerLng,
      lead.lat,
      lead.lng
    ),
  }));

  const filtered = withDistance.filter((lead) => {
    if (!filters.includeSite && lead.hasSite) return false;
    if (filters.category && lead.category !== filters.category) return false;
    if (anyChannelActive) {
      const matchesChannel =
        (filters.channels.wa && lead.wa) ||
        (filters.channels.ig && lead.ig) ||
        (filters.channels.em && lead.em);
      if (!matchesChannel) return false;
    }
    if (lead.distanceKm > filters.radiusKm) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (filters.sortBy === "score") return b.score - a.score;
    if (filters.sortBy === "distancia") return a.distanceKm - b.distanceKm;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return filtered;
}
