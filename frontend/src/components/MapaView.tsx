import { useMemo } from "react";
import SearchCard from "./SearchCard";
import LegendCard from "./LegendCard";
import ResultsDrawer from "./ResultsDrawer";
import MapCanvas from "./MapCanvas";
import { haversineKm } from "../utils/haversine";
import type { Channels, Lead, SortBy } from "../types";
import type { FilteredLead } from "../utils/filters";

interface Props {
  leads: Lead[];
  filtered: FilteredLead[];
  category: string;
  onCategoryChange: (v: string) => void;
  observedCategories: string[];
  location: string;
  onLocationChange: (v: string) => void;
  radius: number;
  onRadiusChange: (v: number) => void;
  sortBy: SortBy;
  onSortByChange: (s: SortBy) => void;
  channels: Channels;
  onChannelsChange: (c: Channels) => void;
  includeSite: boolean;
  onIncludeSiteChange: (v: boolean) => void;
  center: { lat: number; lng: number };
  searching: boolean;
  onSearch: () => void;
  searchBoundsToken: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpenDialog: (id: string) => void;
  onEnrich: (id: string) => void;
  onImportOverpass?: (location: string, category: string | null) => void;
  importing?: boolean;
  template: string;
  isActive: boolean;
}

export default function MapaView(props: Props) {
  const { leads, filtered, category, radius, center } = props;

  // Footer counts on the search card describe the raio+categoria universe,
  // independent of the drawer's channel/"incluir site" toggles.
  const { semSiteCount, enriquecidosCount } = useMemo(() => {
    const withinRadiusAndCategory = leads.filter((lead) => {
      if (category && lead.category !== category) return false;
      const d = haversineKm(center.lat, center.lng, lead.lat, lead.lng);
      return d <= radius;
    });
    return {
      semSiteCount: withinRadiusAndCategory.filter((l) => !l.hasSite).length,
      enriquecidosCount: withinRadiusAndCategory.filter((l) => l.enriched).length,
    };
  }, [leads, category, radius, center]);

  return (
    <div className="mapa-view">
      <MapCanvas
        leads={filtered}
        center={center}
        radiusKm={radius}
        selectedId={props.selectedId}
        onSelect={props.onSelect}
        isActive={props.isActive}
        fitBoundsToken={props.searchBoundsToken}
      />

      <SearchCard
        category={category}
        onCategoryChange={props.onCategoryChange}
        observedCategories={props.observedCategories}
        location={props.location}
        onLocationChange={props.onLocationChange}
        radius={radius}
        onRadiusChange={props.onRadiusChange}
        searching={props.searching}
        onSearch={props.onSearch}
        semSiteCount={semSiteCount}
        enriquecidosCount={enriquecidosCount}
        onImportOverpass={props.onImportOverpass}
        importing={props.importing}
      />

      <LegendCard />

      <ResultsDrawer
        leads={filtered}
        channels={props.channels}
        onChannelsChange={props.onChannelsChange}
        sortBy={props.sortBy}
        onSortByChange={props.onSortByChange}
        includeSite={props.includeSite}
        onIncludeSiteChange={props.onIncludeSiteChange}
        selectedId={props.selectedId}
        onSelect={props.onSelect}
        onOpenDialog={props.onOpenDialog}
        onEnrich={props.onEnrich}
        template={props.template}
      />
    </div>
  );
}
