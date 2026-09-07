/**
 * Turn an uploaded .csv or .xlsx into `{ headers, rows }`.
 *
 * XLSX goes through `read-excel-file` (the `xlsx` package on npm is stuck at
 * 0.18.5 from 2022 with unpatched advisories — SheetJS publishes elsewhere).
 * CSV is parsed here: it is one small function and pulling in a second parser
 * for it is not worth it. `parseCsv` has a self-check in `parseSheet.test.ts`.
 */

import type { Channel, Status } from "./supabase";

export type Sheet = { headers: string[]; rows: string[][] };

/** Anything bigger than this is a mistake, not a lead list. */
export const MAX_BYTES = 10 * 1024 * 1024;

/**
 * RFC 4180: fields may be quoted; quotes escape as `""`; quoted fields may
 * contain the delimiter and newlines. Handles CRLF and a UTF-8 BOM.
 */
export function parseCsv(text: string, delimiter = ","): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const c = text[i];

    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"' && field === "") {
      quoted = true;
      i++;
    } else if (c === delimiter) {
      endField();
      i++;
    } else if (c === "\r") {
      // Swallow CR; the LF that follows ends the row.
      i++;
    } else if (c === "\n") {
      endRow();
      i++;
    } else {
      field += c;
      i++;
    }
  }

  // A trailing newline should not produce a phantom row.
  if (field !== "" || row.length) endRow();

  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

/** Comma unless a header line clearly uses semicolons or tabs (EU/TSV exports). */
function sniffDelimiter(text: string): string {
  const line = text.slice(0, text.indexOf("\n") + 1 || text.length);
  const counts = [",", ";", "\t"].map(
    (d) => [d, line.split(d).length - 1] as const,
  );
  const best = counts.sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : ",";
}

function toCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) {
    // Local-time YYYY-MM-DD; toISOString would shift the day in UTC+ zones.
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(
      v.getDate(),
    ).padStart(2, "0")}`;
  }
  return String(v).trim();
}

export async function parseSheet(file: File): Promise<Sheet> {
  if (file.size === 0) throw new Error("That file is empty.");
  if (file.size > MAX_BYTES)
    throw new Error(
      `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${
        MAX_BYTES / 1024 / 1024
      } MB.`,
    );

  const name = file.name.toLowerCase();
  let grid: string[][];

  if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) {
    // Dynamic import so the parser is only fetched when someone imports.
    // The package has no root export — /browser is the build that takes a File.
    // Use `readSheet`, not the default export: since v9 the default returns
    // sheet *metadata*, and only readSheet returns the rows.
    const { readSheet } = await import("read-excel-file/browser");
    const rows = await readSheet(file);
    grid = rows.map((r) => r.map(toCell));
  } else if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) {
    const text = await file.text();
    grid = parseCsv(text, sniffDelimiter(text)).map((r) => r.map(toCell));
  } else if (name.endsWith(".xls")) {
    throw new Error(
      "Old .xls files aren't supported — re-save as .xlsx or .csv.",
    );
  } else {
    throw new Error("Unsupported file. Use .xlsx or .csv.");
  }

  if (grid.length === 0) throw new Error("No rows found in that file.");

  const [headerRow, ...body] = grid;
  const headers = headerRow.map((h, i) => h || `Column ${i + 1}`);

  // Pad short rows so every row lines up with the header.
  const rows = body.map((r) =>
    Array.from({ length: headers.length }, (_, i) => r[i] ?? ""),
  );

  return { headers, rows };
}

/** Columns an imported sheet can be mapped onto. `null` = ignore that column. */
export const FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "company", label: "Company" },
  { key: "email", label: "Email" },
  { key: "contact", label: "Instagram handle" },
  { key: "website", label: "Website" },
  { key: "phone", label: "Phone" },
  { key: "country", label: "Country" },
  { key: "category", label: "Category / sector" },
  { key: "description", label: "Business description" },
  { key: "notes", label: "Notes" },
  { key: "first_contacted_at", label: "First contacted (date)" },
  { key: "next_followup_at", label: "Next follow-up (date)" },
] as const;

export type Field = (typeof FIELDS)[number]["key"];
export type Mapping = (Field | null)[];

/** Header synonyms, checked as substrings against a normalised header. */
const HINTS: [Field, string[]][] = [
  ["name", ["brand", "name", "business", "lead", "contact name", "client"]],
  ["company", ["company", "organisation", "organization", "account"]],
  ["email", ["email", "e-mail", "mail"]],
  ["contact", ["instagram", "handle", "ig", "insta", "profile"]],
  ["website", ["website", "url", "site", "web", "domain", "link", "homepage"]],
  ["phone", ["phone", "mobile", "number", "tel", "whatsapp", "contact no"]],
  ["country", ["country", "region", "market", "location"]],
  ["category", ["category", "sector", "industry", "vertical", "niche", "type", "business type"]],
  ["description", ["description", "about", "bio", "summary", "what they do"]],
  ["notes", ["note", "message", "comment", "remark", "outreach message"]],
  ["first_contacted_at", ["first contact", "outreach date", "contacted", "date sent"]],
  ["next_followup_at", ["next follow", "follow-up date", "followup date", "due"]],
];

const norm = (h: string) => h.toLowerCase().replace(/[_\-.]+/g, " ").trim();

/**
 * Best-effort header → field guess. Each field is claimed at most once, and an
 * unrecognised header maps to null rather than to a wrong field — the user
 * confirms the mapping before anything is written.
 */
export function guessMapping(headers: string[]): Mapping {
  const taken = new Set<Field>();
  return headers.map((h) => {
    const n = norm(h);
    if (!n) return null;
    for (const [field, hints] of HINTS) {
      if (taken.has(field)) continue;
      if (hints.some((hint) => n === hint || n.includes(hint))) {
        taken.add(field);
        return field;
      }
    }
    return null;
  });
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `null` for anything that isn't already YYYY-MM-DD — Postgres would reject it. */
function toDate(v: string): string | null {
  const s = v.trim();
  if (ISO_DATE.test(s)) return s;
  const d = new Date(s);
  if (!Number.isNaN(d.valueOf()) && s.length >= 6) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  }
  return null;
}

export type LeadDraft = {
  channel: Channel;
  name: string;
  company: string | null;
  email: string | null;
  contact: string | null;
  website: string | null;
  phone: string | null;
  country: string | null;
  category: string | null;
  description: string | null;
  notes: string | null;
  first_contacted_at: string | null;
  next_followup_at: string | null;
  status: Status;
};

export type BuildResult = {
  drafts: LeadDraft[];
  /** Rows dropped, with the reason, so nothing disappears silently. */
  skipped: { row: number; reason: string }[];
};

/** The value a row is deduplicated on: handle, then phone, then email. */
export function dedupeKey(d: {
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
}): string | null {
  const v = d.contact || d.phone || d.email;
  return v ? v.toLowerCase().replace(/\s+/g, "") : null;
}

/** Map raw rows onto lead drafts, dropping unusable rows and in-file repeats. */
export function buildDrafts(
  rows: string[][],
  mapping: Mapping,
  channel: Channel,
): BuildResult {
  const drafts: LeadDraft[] = [];
  const skipped: BuildResult["skipped"] = [];
  const seen = new Set<string>();

  rows.forEach((row, i) => {
    const get = (f: Field) => {
      const idx = mapping.indexOf(f);
      return idx === -1 ? "" : (row[idx] ?? "").trim();
    };

    const name = get("name");
    if (!name) {
      skipped.push({ row: i + 2, reason: "no name" });
      return;
    }

    const draft: LeadDraft = {
      channel,
      name,
      company: get("company") || null,
      email: get("email") || null,
      contact: get("contact") || null,
      website: get("website") || null,
      phone: get("phone") || null,
      country: get("country") || null,
      category: get("category") || null,
      description: get("description") || null,
      notes: get("notes") || null,
      first_contacted_at: toDate(get("first_contacted_at")),
      next_followup_at: toDate(get("next_followup_at")),
      status: "new",
    };
    // A date in "first contacted" means it has already been worked.
    if (draft.first_contacted_at) draft.status = "contacted";

    const key = dedupeKey(draft);
    if (key) {
      if (seen.has(key)) {
        skipped.push({ row: i + 2, reason: "duplicate within the file" });
        return;
      }
      seen.add(key);
    }

    drafts.push(draft);
  });

  return { drafts, skipped };
}
