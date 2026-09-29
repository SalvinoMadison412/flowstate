"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { input, card } from "../ui";

const TABLE = "crm_agencies";

const INBOX = [
  ["unknown", "Unknown"],
  ["linkedin", "LinkedIn inbox"],
  ["email", "Email"],
  ["both", "Both"],
  ["neither", "Neither"],
] as const;

type Agency = {
  id: string;
  agency_name: string;
  target_niche: string | null;
  website: string | null;
  founder_name: string | null;
  founder_linkedin: string | null;
  agency_linkedin: string | null;
  country: string | null;
  date_added: string | null;
  email: string | null;
  phone: string | null;
  inbox_enabled: string;
  emailed_at: string | null;
};

const link = "text-accent underline underline-offset-4 hover:opacity-80";

function Ext({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return <span className="text-text-muted">—</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
      {children}
    </a>
  );
}

/** Text field that saves on blur, and only when the value changed. */
function Cell({ value, onSave, type = "text", placeholder }: {
  value: string | null;
  onSave: (v: string | null) => void;
  type?: string;
  placeholder: string;
}) {
  const [v, setV] = useState(value ?? "");
  return (
    <input
      type={type}
      value={v}
      placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v.trim() !== (value ?? "") && onSave(v.trim() || null)}
      className={`${input} h-9 min-w-[11rem] text-sm`}
    />
  );
}

/** B2B: every white-label agency partner. Email, phone and inbox are typed by hand; the rest is scraped. */
export function AgencyList() {
  const [rows, setRows] = useState<Agency[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase
      .from(TABLE)
      .select("*")
      .order("date_added", { ascending: false })
      .order("agency_name")
      .limit(5000) // ponytail: PostgREST caps at 1000/page; raise via paging past 5k
      .then(({ data, error }) => (error ? setError(error.message) : setRows(data as Agency[])));
  }, []);

  async function save(id: string, patch: Partial<Agency>) {
    setError(null);
    const { error } = await supabase.from(TABLE).update(patch).eq("id", id);
    if (error) return setError(error.message); // e.g. email already on another agency
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const needle = q.toLowerCase();
  const shown = rows.filter((r) =>
    [r.agency_name, r.target_niche, r.founder_name, r.country, r.email]
      .some((f) => f?.toLowerCase().includes(needle)),
  );

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-lg tracking-display">
          Agencies <span className="text-text-muted">({shown.length})</span>
        </h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, niche, founder, country, email"
          className={`${input} h-9 max-w-sm text-sm`}
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className={`${card} mt-4 overflow-x-auto`}>
        <table className="w-full min-w-[1300px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-text-muted">
            <tr>
              {["Agency", "Niche", "Website", "Founder", "Founder LinkedIn", "Agency LinkedIn", "Country", "Added", "Email", "Phone", "LinkedIn inbox / email", "Emailed"].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-3 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-border-subtle align-middle">
                <td className="px-3 py-2 font-medium">{r.agency_name}</td>
                <td className="px-3 py-2">{r.target_niche}</td>
                <td className="px-3 py-2"><Ext href={r.website}>{r.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</Ext></td>
                <td className="px-3 py-2">{r.founder_name}</td>
                <td className="px-3 py-2"><Ext href={r.founder_linkedin}>Profile</Ext></td>
                <td className="px-3 py-2"><Ext href={r.agency_linkedin}>Company</Ext></td>
                <td className="px-3 py-2">{r.country}</td>
                <td className="whitespace-nowrap px-3 py-2">{r.date_added}</td>
                <td className="px-3 py-2"><Cell type="email" placeholder="Email" value={r.email} onSave={(v) => save(r.id, { email: v })} /></td>
                <td className="px-3 py-2"><Cell type="tel" placeholder="Phone" value={r.phone} onSave={(v) => save(r.id, { phone: v })} /></td>
                <td className="px-3 py-2">
                  <select
                    value={r.inbox_enabled}
                    onChange={(e) => save(r.id, { inbox_enabled: e.target.value })}
                    className={`${input} h-9 text-sm`}
                  >
                    {INBOX.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {r.emailed_at ? r.emailed_at.slice(0, 10) : (
                    <button
                      onClick={() => save(r.id, { emailed_at: new Date().toISOString() })}
                      className="text-text-secondary underline underline-offset-4 hover:text-text-primary"
                    >
                      Mark emailed
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
