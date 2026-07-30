import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { STAGES, STAGE_LABELS, temperatureOf } from "../types";
import type { Lead, Stage } from "../types";

interface Props {
  leads: Lead[];
  onStageChange: (id: string, stage: Stage) => void;
  onOpenDialog: (id: string) => void;
  onQualify: (id: string, qualified: boolean) => void;
}

export default function KanbanView({ leads, onStageChange, onOpenDialog, onQualify }: Props) {
  return (
    <div className="kanban-view">
      <div className="kanban-board">
        {STAGES.map((stage, colIndex) => {
          const columnLeads = leads.filter((l) => l.stage === stage);
          return (
            <div className="kanban-column" key={stage}>
              <div className="kanban-column-header">
                <span>{STAGE_LABELS[stage]}</span>
                <span className="count">{columnLeads.length}</span>
              </div>
              <div className="kanban-column-body">
                {columnLeads.map((lead) => {
                  const temp = temperatureOf(lead.score);
                  return (
                    <div className="kanban-card" key={lead.id} onClick={() => onOpenDialog(lead.id)}>
                      <div className="kanban-card-name">{lead.name}</div>
                      <div className="kanban-card-cat">{lead.category}</div>
                      <div className="kanban-card-footer">
                        <span className={`tag tag-${temp}`}>{lead.score}</span>
                        <div className="kanban-card-moves" onClick={(e) => e.stopPropagation()}>
                          <button
                            className={lead.qualified ? "is-active" : ""}
                            onClick={() => onQualify(lead.id, !lead.qualified)}
                            aria-label={lead.qualified ? "Qualificado" : "Marcar como qualificado"}
                            title={lead.qualified ? "Qualificado" : "Marcar como qualificado"}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            disabled={colIndex === 0}
                            onClick={() => onStageChange(lead.id, STAGES[colIndex - 1])}
                            aria-label="Mover para trás"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            disabled={colIndex === STAGES.length - 1}
                            onClick={() => onStageChange(lead.id, STAGES[colIndex + 1])}
                            aria-label="Mover para frente"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
