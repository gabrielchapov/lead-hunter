export type ViewName = "mapa" | "kanban" | "painel" | "mensagens";

export type Stage = "novo" | "contatado" | "respondeu" | "fechado";

export const STAGES: Stage[] = ["novo", "contatado", "respondeu", "fechado"];

export const STAGE_LABELS: Record<Stage, string> = {
  novo: "Novo",
  contatado: "Contatado",
  respondeu: "Respondeu",
  fechado: "Fechado",
};

export type SortBy = "score" | "distancia" | "nome";

export type Temperature = "quente" | "morno" | "frio";

export const CATEGORIES = [
  "Clínica médica",
  "Odontologia",
  "Estética",
  "Fisioterapia",
  "Veterinária",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Raw shape returned by the backend (`Prospect.as_dict()`). */
export interface Lead {
  id: string;
  name: string;
  category: string;
  address: string | null;
  city: string | null;
  state: string | null;
  lat: number;
  lng: number;
  website: string | null;
  hasSite: boolean;
  phone: string | null;
  instagram: string | null;
  email: string | null;
  wa: boolean;
  ig: boolean;
  em: boolean;
  score: number;
  stage: Stage;
  enriched: boolean;
  qualified: boolean;
  notes: string | null;
  /** Client-only transient flag while an enrich request is in flight. */
  enriching?: boolean;
}

export interface Channels {
  wa: boolean;
  ig: boolean;
  em: boolean;
}

export function temperatureOf(score: number): Temperature {
  if (score >= 60) return "quente";
  if (score >= 45) return "morno";
  return "frio";
}

export function bairroOf(address: string | null | undefined): string {
  if (!address) return "";
  const parts = address.split("·");
  return parts.length > 1 ? parts[1].trim() : "";
}
