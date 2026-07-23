import type { Lead } from "../types";
import { bairroOf } from "../types";

export const DEFAULT_TEMPLATE =
  "Olá! Vi que a {{categoria}} {{nome}} no bairro {{bairro}} ainda não tem um site. " +
  "Ajudo negócios locais a captar clientes com um site feito por IA em 48h. " +
  "Posso te mostrar um exemplo rápido?";

export function fillTemplate(template: string, lead: Lead): string {
  return template
    .replaceAll("{{nome}}", lead.name)
    .replaceAll("{{categoria}}", lead.category.toLowerCase())
    .replaceAll("{{bairro}}", bairroOf(lead.address) || lead.city || "");
}

export function openWhatsApp(lead: Lead, template: string) {
  const digits = (lead.phone || "").replace(/\D/g, "");
  const text = encodeURIComponent(fillTemplate(template, lead));
  const url = digits
    ? `https://wa.me/${digits}?text=${text}`
    : `https://wa.me/?text=${text}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
