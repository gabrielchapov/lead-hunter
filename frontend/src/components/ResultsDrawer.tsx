import { Zap } from "lucide-react";
import LeadCard from "./LeadCard";
import type { Channels, Lead, SortBy } from "../types";
import type { FilteredLead } from "../utils/filters";

interface Props {
  leads: FilteredLead[];
  channels: Channels;
  onChannelsChange: (c: Channels) => void;
  sortBy: SortBy;
  onSortByChange: (s: SortBy) => void;
  includeSite: boolean;
  onIncludeSiteChange: (v: boolean) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenDialog: (id: string) => void;
  onEnrich: (id: string) => void;
  onQualify: (id: string, qualified: boolean) => void;
  template: string;
}

function toggleChannel(channels: Channels, key: keyof Channels): Channels {
  return { ...channels, [key]: !channels[key] };
}

export default function ResultsDrawer({
  leads,
  channels,
  onChannelsChange,
  sortBy,
  onSortByChange,
  includeSite,
  onIncludeSiteChange,
  selectedId,
  onSelect,
  onOpenDialog,
  onEnrich,
  onQualify,
  template,
}: Props) {
  const hotWithWhatsapp = leads.filter((l) => l.score >= 60 && l.wa).length;

  return (
    <div className="results-drawer">
      <div className="results-drawer-header">
        <div className="results-drawer-title">
          {leads.length} leads <span className="sub">sem site</span>
        </div>

        <div className="channel-chips">
          {(["wa", "ig", "em"] as const).map((key) => (
            <button
              key={key}
              className={`channel-chip${channels[key] ? " is-active" : ""}`}
              onClick={() => onChannelsChange(toggleChannel(channels, key))}
            >
              {key === "wa" ? "WhatsApp" : key === "ig" ? "Instagram" : "E-mail"}
            </button>
          ))}
        </div>

        <select
          className="input"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as SortBy)}
        >
          <option value="score">Relevância</option>
          <option value="distancia">Distância</option>
          <option value="nome">Nome (A–Z)</option>
        </select>

        <label>
          <input
            type="checkbox"
            checked={includeSite}
            onChange={(e) => onIncludeSiteChange(e.target.checked)}
          />
          Incluir quem já tem site
        </label>
      </div>

      <div className="results-list">
        {leads.length === 0 && (
          <div className="empty-state">
            Nenhum lead encontrado. Clique em <b>Importar do OpenStreetMap</b> para
            buscar negócios reais nesta região, ou ajuste os filtros/raio.
          </div>
        )}
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            selected={lead.id === selectedId}
            onSelect={() => onSelect(lead.id)}
            onOpenDialog={() => onOpenDialog(lead.id)}
            onEnrich={() => onEnrich(lead.id)}
            onQualify={() => onQualify(lead.id, !lead.qualified)}
            template={template}
          />
        ))}
      </div>

      <div className="results-drawer-footer">
        <button
          className="btn btn-primary btn-block"
          onClick={() =>
            alert(`Modo disparo: ${hotWithWhatsapp} leads quentes com WhatsApp receberiam o modelo atual.`)
          }
        >
          <Zap size={14} /> Modo disparo ({hotWithWhatsapp})
        </button>
      </div>
    </div>
  );
}
