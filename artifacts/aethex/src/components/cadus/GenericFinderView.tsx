/**
 * Generic Finder: brand names (typed, or a prescription pasted) to their generics, from the Cadus
 * formulary in the browser: the generic and salt, NLEM status, other brands of the same medicine,
 * and the usual dose. Brands that aren't in the formulary can be looked up by Cadus, marked as such.
 */
import { useMemo, useState } from "react";
import { BadgeCheck, CircleHelp, Copy, Loader2, Pill, Search, Sparkles, TriangleAlert } from "lucide-react";
import { findGenerics } from "@/lib/cadus/clinic20";

interface Lookup { brand: string; generic: string; sure: boolean }

export default function GenericFinderView({ generate, friendlyError, toast }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [looked, setLooked] = useState<Record<string, Lookup>>({});
  const rows = useMemo(() => findGenerics(text), [text]);
  const missing = rows.filter((r) => !r.drug && r.brand && !looked[r.brand.toLowerCase()]);

  const lookup = async () => {
    setBusy(true);
    try {
      const r = await generate({ action: "generic-lookup", brands: missing.map((m) => m.brand) });
      const items = (r?.items ?? []) as Lookup[];
      setLooked((o) => ({ ...o, ...Object.fromEntries(items.map((i) => [i.brand.toLowerCase(), i])) }));
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };
  const asText = () => rows.map((r) => `${r.input} → ${r.drug ? `${r.drug.genericName} (${r.drug.saltName})${r.nlem ? ", NLEM" : ""}` : looked[r.brand.toLowerCase()]?.generic || "not found"}`).join("\n");

  return (
    <section className="cx-page cx-lab cx-gen">
      <header className="cx-page-h"><div><h1>Generic Finder</h1><p>Type brand names or paste a prescription. Each medicine is matched to its generic, whether it's on the National List of Essential Medicines, other brands of the same medicine and the usual dose. Generics and NLEM medicines are usually much cheaper, and many are at Jan Aushadhi Kendras.</p></div></header>
      <textarea className="cx-input" rows={5} value={text} onChange={(e) => setText(e.target.value.slice(0, 4000))} placeholder={"One per line, or paste a prescription:\nTab Dolo 650 1-0-1 x 3 days\nPan 40\nEcosprin 75"} aria-label="Brand names" data-gen="input" />
      {rows.length > 0 && (
        <>
          <div className="cx-gen-list" data-gen="list">
            {rows.map((r, i) => {
              const l = looked[r.brand.toLowerCase()];
              return (
                <div key={i} className={`cx-gen-row ${r.drug ? "found" : l?.sure ? "ai" : "none"}`} data-gen-row={r.drug ? "found" : l ? "ai" : "none"}>
                  <div className="cx-gen-in"><Pill size={14} /> <b>{r.brand || r.input}</b></div>
                  {r.drug ? (
                    <div className="cx-gen-out">
                      <b>{r.drug.genericName}</b> <small>{r.drug.saltName} · {r.drug.drugClass}</small>
                      <div className="cx-gen-tags">{r.nlem && <span className="nlem"><BadgeCheck size={12} /> NLEM 2022</span>}<span>{r.drug.dosages.slice(0, 4).join(", ")}</span></div>
                      {r.brands.length > 0 && <small>Also sold as: {r.brands.join(", ")}</small>}
                      {r.dosing && <small>Usual adult dose: {r.dosing.adult}</small>}
                    </div>
                  ) : l ? (
                    <div className="cx-gen-out"><b>{l.generic || "Not recognised"}</b> <small>{l.sure ? "Identified by Cadus, not in the formulary: check the pack" : "Cadus isn't sure: check the pack"}</small></div>
                  ) : <div className="cx-gen-out"><small><CircleHelp size={12} /> Not in the Cadus formulary</small></div>}
                </div>
              );
            })}
          </div>
          <div className="cx-sc-acts">
            {missing.length > 0 && <button className="cx-btn primary" onClick={() => void lookup()} disabled={busy} data-gen="lookup">{busy ? <Loader2 size={14} className="cx-rot" /> : <Sparkles size={14} />} Look up {missing.length} with Cadus</button>}
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(asText()); toast("Copied"); }}><Copy size={14} /> Copy</button>
          </div>
        </>
      )}
      {!text && <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Search size={20} /></span><h3>Brand to generic</h3><p>Matching happens on this device from the Cadus formulary of Indian brands and generics.</p></div>}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Combination products and strengths vary between brands: check the pack before switching.</p>
    </section>
  );
}
