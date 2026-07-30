import { useMemo } from "react";
import { temperatureOf } from "../types";
import type { Lead, OutreachStat } from "../types";

interface Props {
  leads: Lead[];
  location: string;
  radius: number;
  category: string;
  outreachStats: OutreachStat[];
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export default function PainelView({ leads, location, radius, category, outreachStats }: Props) {
  const stats = useMemo(() => {
    const semSite = leads.filter((l) => !l.hasSite);
    const quentes = leads.filter((l) => temperatureOf(l.score) === "quente");
    const enriquecidos = leads.filter((l) => l.enriched);
    const comWhatsapp = leads.filter((l) => l.wa);
    return { semSite, quentes, enriquecidos, comWhatsapp };
  }, [leads]);

  const byCategory = useMemo(() => {
    // Derived from whatever categories actually show up in the data —
    // imports without a category filter bring back raw OSM tag values
    // (supermarket, hotel, restaurant, ...), not just the 5 niches this
    // tool originally shipped with, so a fixed category list here left
    // most real leads uncounted.
    const tally = new Map<string, number>();
    for (const lead of leads) {
      tally.set(lead.category, (tally.get(lead.category) ?? 0) + 1);
    }
    const counts = Array.from(tally, ([label, count]) => ({ label, count })).sort(
      (a, b) => b.count - a.count
    );
    const max = Math.max(1, ...counts.map((c) => c.count));
    return { counts, max };
  }, [leads]);

  const byTemperature = useMemo(() => {
    const quente = leads.filter((l) => temperatureOf(l.score) === "quente").length;
    const morno = leads.filter((l) => temperatureOf(l.score) === "morno").length;
    const frio = leads.filter((l) => temperatureOf(l.score) === "frio").length;
    const max = Math.max(1, quente, morno, frio);
    return { quente, morno, frio, max };
  }, [leads]);

  return (
    <div className="painel-view">
      <h3>Painel</h3>
      <p className="painel-subtitle">
        {location} · raio {radius} km · categoria {category || "todas"}
      </p>

      <div className="stat-row">
        <div className="stat-cell">
          <div className="stat-number">{stats.semSite.length}</div>
          <div className="stat-label">Sem site no raio</div>
        </div>
        <div className="stat-cell">
          <div className="stat-number">{stats.quentes.length}</div>
          <div className="stat-label">Leads quentes</div>
        </div>
        <div className="stat-cell">
          <div className="stat-number">{stats.enriquecidos.length}</div>
          <div className="stat-label">Enriquecidos</div>
        </div>
        <div className="stat-cell">
          <div className="stat-number">{stats.comWhatsapp.length}</div>
          <div className="stat-label">Com WhatsApp</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h5>Por categoria</h5>
          {byCategory.counts.map((c) => (
            <div className="bar-row" key={c.label}>
              <span className="bar-label">{c.label}</span>
              <span className="bar-track">
                <span
                  className="bar-fill"
                  style={{
                    width: `${(c.count / byCategory.max) * 100}%`,
                    background: "var(--color-accent)",
                  }}
                />
              </span>
              <span className="bar-count">{c.count}</span>
            </div>
          ))}
        </div>

        <div className="chart-card">
          <h5>Temperatura dos leads</h5>
          <div className="bar-row">
            <span className="bar-label">Quente</span>
            <span className="bar-track">
              <span
                className="bar-fill"
                style={{ width: `${(byTemperature.quente / byTemperature.max) * 100}%`, background: "var(--color-quente)" }}
              />
            </span>
            <span className="bar-count">{byTemperature.quente}</span>
          </div>
          <div className="bar-row">
            <span className="bar-label">Morno</span>
            <span className="bar-track">
              <span
                className="bar-fill"
                style={{ width: `${(byTemperature.morno / byTemperature.max) * 100}%`, background: "var(--color-morno)" }}
              />
            </span>
            <span className="bar-count">{byTemperature.morno}</span>
          </div>
          <div className="bar-row">
            <span className="bar-label">Frio</span>
            <span className="bar-track">
              <span
                className="bar-fill"
                style={{ width: `${(byTemperature.frio / byTemperature.max) * 100}%`, background: "var(--color-frio)" }}
              />
            </span>
            <span className="bar-count">{byTemperature.frio}</span>
          </div>
        </div>
      </div>

      <div className="charts-row" style={{ gridTemplateColumns: "1fr", marginTop: "var(--space-6)" }}>
        <div className="chart-card">
          <h5>Taxa de resposta por modelo</h5>
          {outreachStats.length === 0 && (
            <div className="empty-state">
              Nenhum envio registrado ainda — a taxa de resposta aparece aqui conforme mensagens
              são enviadas pelo botão WhatsApp.
            </div>
          )}
          {outreachStats.map((stat) => (
            <div className="bar-row bar-row-wide" key={stat.templateId}>
              <span className="bar-label" title={stat.templateText}>
                {truncate(stat.templateText, 40)}
              </span>
              <span className="bar-track">
                <span
                  className="bar-fill"
                  style={{ width: `${stat.replyRate * 100}%`, background: "var(--color-accent)" }}
                />
              </span>
              <span className="bar-count">
                {stat.repliedCount}/{stat.sentCount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
