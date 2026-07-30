import { temperatureOf } from "../types";
import type { Lead } from "../types";
import { BASE_URL } from "../api";

interface Props {
  lead: Lead;
  onClose: () => void;
  onSend: (lead: Lead) => void;
  onQualify: () => void;
  onGenerateDemo: () => void;
}

function row(label: string, value: string | null | undefined) {
  return (
    <div className="dialog-row" key={label}>
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

export default function DetailsDialog({ lead, onClose, onSend, onQualify, onGenerateDemo }: Props) {
  const temp = temperatureOf(lead.score);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">
          {lead.name}
          <span className={`tag tag-${temp}`}>{lead.score}</span>
        </div>

        <div>
          {row("Categoria", lead.category)}
          {row("Endereço", lead.address)}
          {row("Telefone", lead.phone)}
          {row("Instagram", lead.instagram)}
          {row("E-mail", lead.email)}
          {row("Site", lead.website)}
          <div className="dialog-row">
            <dt>Qualificado</dt>
            <dd>
              <button
                className={`btn btn-secondary${lead.qualified ? " is-active" : ""}`}
                style={{ padding: "3px 10px", fontSize: 12 }}
                onClick={onQualify}
              >
                {lead.qualified ? "✓ Qualificado" : "Qualificar"}
              </button>
            </dd>
          </div>
          {row("Demo", lead.hasDemo ? "Gerada" : "Não gerada")}
        </div>

        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          {lead.qualified &&
            (lead.hasDemo ? (
              <a
                className="btn btn-secondary"
                href={`${BASE_URL}/demo/${lead.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver demo
              </a>
            ) : (
              <button className="btn btn-secondary" onClick={onGenerateDemo} disabled={lead.generatingDemo}>
                {lead.generatingDemo ? "Gerando…" : "Gerar demo"}
              </button>
            ))}
          <button className="btn btn-primary" onClick={() => onSend(lead)} disabled={!lead.phone}>
            Abrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
