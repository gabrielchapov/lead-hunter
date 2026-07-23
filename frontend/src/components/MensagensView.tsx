import type { Lead } from "../types";
import { fillTemplate } from "../utils/whatsapp";

interface Props {
  template: string;
  onTemplateChange: (t: string) => void;
  onSave: () => void;
  saved: boolean;
  previewLead: Lead | null;
  hotWithWhatsappCount: number;
}

const VARIABLES = [
  { token: "{{nome}}", label: "+ nome" },
  { token: "{{categoria}}", label: "+ categoria" },
  { token: "{{bairro}}", label: "+ bairro" },
];

export default function MensagensView({
  template,
  onTemplateChange,
  onSave,
  saved,
  previewLead,
  hotWithWhatsappCount,
}: Props) {
  function insertVariable(token: string) {
    onTemplateChange(`${template}${template.endsWith(" ") || template === "" ? "" : " "}${token}`);
  }

  return (
    <div className="mensagens-view">
      <h3>Mensagens</h3>
      <div className="mensagens-grid">
        <div>
          <div className="variable-buttons">
            {VARIABLES.map((v) => (
              <button key={v.token} className="btn btn-secondary" onClick={() => insertVariable(v.token)}>
                {v.label}
              </button>
            ))}
          </div>

          <textarea
            className="input"
            value={template}
            onChange={(e) => onTemplateChange(e.target.value)}
          />

          <button className="btn btn-primary" onClick={onSave} style={{ marginTop: 12 }}>
            {saved ? "✓ Salvo" : "Salvar modelo"}
          </button>

          <p className="template-note">
            Disparo atinge <b>{hotWithWhatsappCount}</b> leads quentes com WhatsApp.
          </p>
        </div>

        <div className="preview-panel">
          <h5>Prévia</h5>
          <div className="whatsapp-mock">
            <div className="whatsapp-bubble">
              {previewLead ? fillTemplate(template, previewLead) : "Nenhum lead disponível para pré-visualizar."}
            </div>
          </div>
          {previewLead && <p className="preview-caption">Exemplo com <b>{previewLead.name}</b></p>}
        </div>
      </div>
    </div>
  );
}
