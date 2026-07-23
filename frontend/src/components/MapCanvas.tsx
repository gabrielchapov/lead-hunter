import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip, useMap } from "react-leaflet";
import type { FilteredLead } from "../utils/filters";
import { temperatureOf } from "../types";

const TEMP_COLOR: Record<string, string> = {
  quente: "#4d8bff",
  morno: "#f0a742",
  frio: "#6a7683",
};

interface EffectsProps {
  isActive: boolean;
  center: { lat: number; lng: number };
  radiusKm: number;
  fitBoundsToken: number;
}

function MapEffects({ isActive, center, radiusKm, fitBoundsToken }: EffectsProps) {
  const map = useMap();

  useEffect(() => {
    if (isActive) {
      // Leaflet mis-measures its container while display:none; re-run
      // once the Mapa view becomes visible again.
      window.setTimeout(() => map.invalidateSize(), 0);
    }
  }, [isActive, map]);

  useEffect(() => {
    if (fitBoundsToken === 0) return;
    const radiusDeg = radiusKm / 111;
    map.fitBounds([
      [center.lat - radiusDeg, center.lng - radiusDeg],
      [center.lat + radiusDeg, center.lng + radiusDeg],
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitBoundsToken]);

  return null;
}

interface Props {
  leads: FilteredLead[];
  center: { lat: number; lng: number };
  radiusKm: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isActive: boolean;
  fitBoundsToken: number;
}

export default function MapCanvas({ leads, center, radiusKm, selectedId, onSelect, isActive, fitBoundsToken }: Props) {
  return (
    <div className={`map-canvas${isActive ? "" : " is-hidden"}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{ color: "#4d8bff", weight: 1, fillOpacity: 0.05 }}
        />
        {leads.map((lead) => {
          const temp = temperatureOf(lead.score);
          const isSelected = lead.id === selectedId;
          return (
            <CircleMarker
              key={lead.id}
              center={[lead.lat, lead.lng]}
              radius={isSelected ? 10 : 6}
              pathOptions={{
                color: TEMP_COLOR[temp],
                fillColor: TEMP_COLOR[temp],
                fillOpacity: 0.85,
                weight: isSelected ? 3 : 1,
              }}
              eventHandlers={{ click: () => onSelect(lead.id) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <span className="lead-tooltip">
                  {lead.name} / {lead.category} · {lead.score}
                </span>
              </Tooltip>
            </CircleMarker>
          );
        })}
        <MapEffects isActive={isActive} center={center} radiusKm={radiusKm} fitBoundsToken={fitBoundsToken} />
      </MapContainer>
    </div>
  );
}
