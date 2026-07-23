import type { Lead } from "../types";
import { temperatureOf } from "../types";

const COLUMNS: { key: keyof Lead | "temperature"; label: string }[] = [
  { key: "name", label: "Nome" },
  { key: "category", label: "Categoria" },
  { key: "address", label: "Endereço" },
  { key: "phone", label: "Telefone" },
  { key: "instagram", label: "Instagram" },
  { key: "email", label: "E-mail" },
  { key: "score", label: "Score" },
  { key: "temperature", label: "Temperatura" },
];

function rowValues(lead: Lead): string[] {
  return COLUMNS.map(({ key }) => {
    if (key === "temperature") return temperatureOf(lead.score);
    const v = lead[key];
    return v === null || v === undefined ? "" : String(v);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** CSV with a UTF-8 BOM (so accented pt-BR text opens correctly in Excel)
 * and quoted fields, matching the design spec. */
export function exportCsv(leads: Lead[], filename = "leads.csv") {
  const header = COLUMNS.map((c) => `"${c.label}"`).join(",");
  const rows = leads.map((lead) =>
    rowValues(lead)
      .map((v) => `"${v.replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header, ...rows].join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

/** "Excel" export via an HTML table served with the Excel MIME type —
 * the same lightweight technique the design prototype uses, so no extra
 * spreadsheet-writing dependency is needed. */
export function exportExcel(leads: Lead[], filename = "leads.xls") {
  const header = COLUMNS.map((c) => `<th>${c.label}</th>`).join("");
  const rows = leads
    .map(
      (lead) =>
        `<tr>${rowValues(lead)
          .map((v) => `<td>${v}</td>`)
          .join("")}</tr>`
    )
    .join("");
  const html = `<html><head><meta charset="UTF-8"></head><body><table>
    <thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  downloadBlob(blob, filename);
}
