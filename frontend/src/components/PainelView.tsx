import { useMemo } from "react";
import { CATEGORIES, temperatureOf } from "../types";
import type { Lead } from "../types";

interface Props {
  leads: Lead[];
  location: string;
  radius: number;
  category: string;
}

export default function PainelView({ leads, location, radius, category }: Props) {
  const stats = useMemo(() => {
    const semSite = leads.filter((l) => !l.hasSite);
    const quentes = leads.filter((l) => temperatureOf(l.score) === "quente");
    const enriquecidos = leads.filter((l) => l.enriched);
    const comWhatsapp = leads.filter((l) => l.wa);
    return { semSite, quentes, enriquecidos, comWhatsapp };
  }, [leads]);

  const byCategory = useMemo(() => {
    const counts = CATEGORIES.map((c) => ({
      label: c,
      count: leads.filter((l) => l.category === c).length,
    }));
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
    </div>
  );
}
