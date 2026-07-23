import { Download } from "lucide-react";
import type { ViewName } from "../types";

const TABS: { id: ViewName; label: string }[] = [
  { id: "mapa", label: "Mapa" },
  { id: "kanban", label: "Kanban" },
  { id: "painel", label: "Painel" },
  { id: "mensagens", label: "Mensagens" },
];

interface Props {
  view: ViewName;
  onViewChange: (v: ViewName) => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
}

export default function TopNav({ view, onViewChange, onExportCsv, onExportExcel }: Props) {
  return (
    <header className="topnav">
      <div className="topnav-brand">
        <div className="topnav-brand-mark" />
        <div className="topnav-brand-text">
          <span className="topnav-brand-name">Lead Hunter</span>
          <span className="topnav-brand-tag">o radar de negócios sem site</span>
        </div>
      </div>

      <nav className="topnav-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`topnav-tab${view === tab.id ? " is-active" : ""}`}
            onClick={() => onViewChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="topnav-export">
        <span className="topnav-export-label">Exportar</span>
        <button className="btn btn-secondary" onClick={onExportCsv}>
          <Download size={14} /> CSV
        </button>
        <button className="btn btn-secondary" onClick={onExportExcel}>
          <Download size={14} /> Excel
        </button>
      </div>
    </header>
  );
}
