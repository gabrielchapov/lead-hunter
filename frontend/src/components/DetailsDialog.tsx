import { temperatureOf } from "../types";
import type { Lead } from "../types";

interface Props {
  lead: Lead;
  onClose: () => void;
  onSend: (lead: Lead) => void;
}

function row(label: string, value: string | null | undefined) {
  return (
    <div className="dialog-row" key={label}>
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

export default function DetailsDialog({ lead, onClose, onSend }: Props) {
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
          {row("Qualificado", lead.qualified ? "Sim" : "Não")}
        </div>

        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          <button className="btn btn-primary" onClick={() => onSend(lead)} disabled={!lead.phone}>
            Abrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
