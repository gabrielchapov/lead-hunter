import { useEffect, useMemo, useState } from "react";
import TopNav from "./components/TopNav";
import LoginPage from "./components/LoginPage";
import MapaView from "./components/MapaView";
import KanbanView from "./components/KanbanView";
import PainelView from "./components/PainelView";
import MensagensView from "./components/MensagensView";
import DetailsDialog from "./components/DetailsDialog";
import {
  AuthError,
  clearToken,
  fetchLeads,
  getToken,
  updateStage as apiUpdateStage,
  updateQualified as apiUpdateQualified,
  enrichLead as apiEnrichLead,
  importFromOverpass,
  logSend,
  fetchOutreachStats,
  generateDemo,
} from "./api";
import { filterAndSortLeads } from "./utils/filters";
import { exportCsv, exportExcel } from "./utils/export";
import { DEFAULT_TEMPLATE, openWhatsApp } from "./utils/whatsapp";
import { DEFAULT_LOCATION, geocode } from "./utils/geocode";
import type { Channels, Lead, OutreachStat, SortBy, Stage, ViewName } from "./types";

export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken());
  const [view, setView] = useState<ViewName>("mapa");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("Itapoá, SC");
  const [radius, setRadius] = useState(20);
  const [sortBy, setSortBy] = useState<SortBy>("score");
  const [channels, setChannels] = useState<Channels>({ wa: false, ig: false, em: false });
  const [includeSite, setIncludeSite] = useState(false);

  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchBoundsToken, setSearchBoundsToken] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogId, setDialogId] = useState<string | null>(null);

  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [saved, setSaved] = useState(false);

  const [outreachStats, setOutreachStats] = useState<OutreachStat[]>([]);

  useEffect(() => {
    if (!authed) return;
    fetchLeads()
      .then((data) => {
        setLeads(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof AuthError) {
          setAuthed(false);
          return;
        }
        setError(err.message);
        setLoading(false);
      });
  }, [authed]);

  // Refreshed each time Painel is opened rather than only once on load,
  // since sends (and the replies they lead to) happen while the operator
  // is elsewhere in the app.
  useEffect(() => {
    if (!authed || view !== "painel") return;
    fetchOutreachStats()
      .then(setOutreachStats)
      .catch((err) => {
        if (err instanceof AuthError) return setAuthed(false);
        console.error("Failed to fetch outreach stats", err);
      });
  }, [authed, view]);

  function handleLogout() {
    clearToken();
    setAuthed(false);
  }

  const center = useMemo(() => geocode(location), [location]);

  // What's actually in the data, independent of the current category filter —
  // OSM imports without a category filter bring back raw tag values
  // (supermarket, hotel, restaurant, ...) well beyond the 5 niches this
  // tool originally shipped with, so the filter dropdown needs to reflect
  // reality instead of a fixed enum.
  const observedCategories = useMemo(
    () => Array.from(new Set(leads.map((l) => l.category))).sort((a, b) => a.localeCompare(b)),
    [leads]
  );

  const filtered = useMemo(
    () =>
      filterAndSortLeads(leads, {
        category,
        centerLat: center.lat,
        centerLng: center.lng,
        radiusKm: radius,
        channels,
        includeSite,
        sortBy,
      }),
    [leads, category, center, radius, channels, includeSite, sortBy]
  );

  // Kanban/Painel only apply category + includeSite (no radius/channel/sort),
  // per the design spec.
  const categoryFiltered = useMemo(
    () =>
      leads.filter((lead) => {
        if (!includeSite && lead.hasSite) return false;
        if (category && lead.category !== category) return false;
        return true;
      }),
    [leads, category, includeSite]
  );

  const dialogLead = leads.find((l) => l.id === dialogId) ?? null;

  function handleSearch() {
    setSearching(true);
    window.setTimeout(() => {
      setSearching(false);
      setSearchBoundsToken((t) => t + 1);
    }, 800);
  }

  async function handleStageChange(id: string, stage: Stage) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
    try {
      await apiUpdateStage(id, stage);
    } catch (err) {
      if (err instanceof AuthError) return setAuthed(false);
      console.error("Failed to persist stage change", err);
    }
  }

  async function handleQualify(id: string, qualified: boolean) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, qualified } : l)));
    try {
      await apiUpdateQualified(id, qualified);
    } catch (err) {
      if (err instanceof AuthError) return setAuthed(false);
      console.error("Failed to persist qualified flag", err);
      // Roll back the optimistic update — the toggle didn't actually persist.
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, qualified: !qualified } : l)));
    }
  }

  async function handleEnrich(id: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, enriching: true } : l)));
    try {
      const updated = await apiEnrichLead(id);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...updated, enriching: false } : l)));
    } catch (err) {
      if (err instanceof AuthError) return setAuthed(false);
      // No real enrichment provider is wired up yet — the backend
      // deliberately refuses to invent contact info rather than
      // fabricating a phone number, so surface that to the user instead
      // of failing silently.
      console.error("Failed to enrich lead", err);
      alert(err instanceof Error ? err.message : "Não foi possível enriquecer este lead.");
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, enriching: false } : l)));
    }
  }

  async function handleGenerateDemo(id: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, generatingDemo: true } : l)));
    try {
      const updated = await generateDemo(id);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...updated, generatingDemo: false } : l)));
    } catch (err) {
      if (err instanceof AuthError) return setAuthed(false);
      console.error("Failed to generate demo", err);
      alert(err instanceof Error ? err.message : "Não foi possível gerar a demo.");
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, generatingDemo: false } : l)));
    }
  }

  async function handleImportOverpass(loc: string, cat: string | null) {
    setImporting(true);
    try {
      const result = await importFromOverpass(loc, cat, radius);
      if (result.status === "no_results") {
        alert(result.message || "Nenhum resultado encontrado.");
      } else {
        console.log(
          `Importados ${result.new_count} novos leads do OpenStreetMap (${result.total_scraped} encontrados)`
        );
        const updated = await fetchLeads();
        setLeads(updated);
      }
    } catch (err) {
      if (err instanceof AuthError) {
        setAuthed(false);
        return;
      }
      console.error("Failed to import from OpenStreetMap", err);
      alert("Erro ao importar do OpenStreetMap. Verifique a localização e tente novamente.");
    } finally {
      setImporting(false);
    }
  }

  // Fires the actual wa.me send (unchanged behavior) and, separately,
  // logs it for outreach instrumentation (wayfinder ticket 06). Logging
  // failure must never block the send itself — it's just tracking.
  function handleWhatsAppSend(lead: Lead) {
    openWhatsApp(lead, template);
    logSend(lead.id, template).catch((err) => {
      if (err instanceof AuthError) return setAuthed(false);
      console.error("Failed to log outreach send", err);
    });
  }

  function handleSaveTemplate() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="app">
      <TopNav
        view={view}
        onViewChange={setView}
        onLogout={handleLogout}
        onExportCsv={() => exportCsv(filtered)}
        onExportExcel={() => exportExcel(filtered)}
      />

      {error && <div className="empty-state">Erro ao carregar leads: {error}</div>}
      {loading && !error && <div className="empty-state">Carregando leads…</div>}

      {!loading && !error && (
        <div className="view">
          <div style={{ display: view === "mapa" ? "block" : "none", height: "100%" }}>
            <MapaView
              leads={leads}
              filtered={filtered}
              category={category}
              onCategoryChange={setCategory}
              observedCategories={observedCategories}
              location={location}
              onLocationChange={setLocation}
              radius={radius}
              onRadiusChange={setRadius}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              channels={channels}
              onChannelsChange={setChannels}
              includeSite={includeSite}
              onIncludeSiteChange={setIncludeSite}
              center={center}
              searching={searching}
              onSearch={handleSearch}
              searchBoundsToken={searchBoundsToken}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpenDialog={setDialogId}
              onEnrich={handleEnrich}
              onQualify={handleQualify}
              onSend={handleWhatsAppSend}
              onImportOverpass={handleImportOverpass}
              importing={importing}
              isActive={view === "mapa"}
            />
          </div>

          {view === "kanban" && (
            <KanbanView
              leads={categoryFiltered}
              onStageChange={handleStageChange}
              onOpenDialog={setDialogId}
              onQualify={handleQualify}
            />
          )}

          {view === "painel" && (
            <PainelView
              leads={categoryFiltered}
              location={location}
              radius={radius}
              category={category}
              outreachStats={outreachStats}
            />
          )}

          {view === "mensagens" && (
            <MensagensView
              template={template}
              onTemplateChange={setTemplate}
              onSave={handleSaveTemplate}
              saved={saved}
              previewLead={filtered[0] ?? leads[0] ?? null}
              hotWithWhatsappCount={filtered.filter((l) => l.score >= 60 && l.wa).length}
            />
          )}
        </div>
      )}

      {dialogLead && (
        <DetailsDialog
          lead={dialogLead}
          onClose={() => setDialogId(null)}
          onSend={handleWhatsAppSend}
          onQualify={() => handleQualify(dialogLead.id, !dialogLead.qualified)}
          onGenerateDemo={() => handleGenerateDemo(dialogLead.id)}
        />
      )}
    </div>
  );
}
