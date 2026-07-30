import { MessageCircle, Sparkles } from "lucide-react";
import type { Lead } from "../types";
import { temperatureOf } from "../types";
import { openWhatsApp } from "../utils/whatsapp";

interface Props {
  lead: Lead;
  selected: boolean;
  onSelect: () => void;
  onOpenDialog: () => void;
  onEnrich: () => void;
  onQualify: () => void;
  template: string;
}

function contactLine(lead: Lead): string {
  if (lead.enriching) return "buscando contatos…";
  if (lead.phone) return lead.phone;
  if (lead.instagram) return lead.instagram;
  if (lead.email) return lead.email;
  return "sem contato — enriqueça";
}

export default function LeadCard({ lead, selected, onSelect, onOpenDialog, onEnrich, onQualify, template }: Props) {
  const temp = temperatureOf(lead.score);

  return (
    <div className={`lead-card${selected ? " is-selected" : ""}`} onClick={onSelect}>
      <div className="lead-card-row1">
        <div>
          <div className="lead-card-name">{lead.name}</div>
          <div className="lead-card-address">{lead.address}</div>
        </div>
        <div className="lead-card-score">
          <span className={`tag tag-${temp}`}>
            {temp === "quente" ? "Quente" : temp === "morno" ? "Morno" : "Frio"}
          </span>
          <span className={`lead-card-score-num${temp === "quente" ? " is-hot" : ""}`}>{lead.score}</span>
        </div>
      </div>

      <div className="lead-card-contact">{contactLine(lead)}</div>

      <div className="lead-card-actions" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-primary" onClick={() => openWhatsApp(lead, template)} disabled={!lead.phone}>
          <MessageCircle size={13} /> WhatsApp
        </button>
        <button className="btn btn-secondary" onClick={onOpenDialog}>
          Detalhes
        </button>
        <button className="btn btn-secondary" onClick={onEnrich} disabled={lead.enriching || lead.enriched}>
          {lead.enriching ? "…" : lead.enriched ? <>✓ Enriquecido</> : (
            <>
              <Sparkles size={13} /> Enriquecer
            </>
          )}
        </button>
        <button
          className={`btn btn-secondary${lead.qualified ? " is-active" : ""}`}
          onClick={onQualify}
          title="Marca este lead como aprovado para receber uma demo"
        >
          {lead.qualified ? "✓ Qualificado" : "Qualificar"}
        </button>
      </div>
    </div>
  );
}
