export default function LegendCard() {
  return (
    <div className="legend-card">
      <div className="legend-item">
        <span className="legend-dot" style={{ background: "var(--color-quente)" }} />
        Quente
      </div>
      <div className="legend-item">
        <span className="legend-dot" style={{ background: "var(--color-morno)" }} />
        Morno
      </div>
      <div className="legend-item">
        <span className="legend-dot" style={{ background: "var(--color-frio)" }} />
        Frio
      </div>
    </div>
  );
}
