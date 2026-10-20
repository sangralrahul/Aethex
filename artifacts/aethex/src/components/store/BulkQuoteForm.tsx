/**
 * The quotation request on the hospital and medical college pages: the
 * institution, who to contact, where and when to deliver (once, or repeated
 * every 1, 2 or 3 months: ordering in advance) and the list, sent to the store
 * (POST /api/store/bulk-requests). Remembers the details in this browser for the
 * next request. Styles: src/shop.css (.ax-form, .ax-bq).
 */
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { sendBulkRequest, StoreError, useStore } from "@/lib/store/api";
import type { BulkLine, DeliverySchedule, Segment } from "@/lib/store/types";
import { INDIAN_STATES, INSTITUTION_TYPES, normPhone, REPEAT_EVERY, validEmail, validGstin, validPincode, type PricedBulk } from "@/lib/store/rules";
import { useUserAuth } from "@/hooks/use-user-auth";
import { BUSINESS } from "@/config/business";
import { formatINR } from "@/lib/utils";
import { readContact, rememberContact } from "./EnquiryForm";

const INST_KEY = "aethex:institution:v1";
type Inst = { institution: string; instType: string; designation: string; gstin: string; address: string; state: string; pincode: string };
function readInst(): Partial<Inst> {
  try { return JSON.parse(localStorage.getItem(INST_KEY) || "{}") || {}; } catch { return {}; }
}

export function BulkQuoteForm({ segment, lines, priced, onDone }: {
  segment: Segment; lines: BulkLine[]; priced: PricedBulk; onDone: (r: { id: string; email: string; emailed: boolean }) => void;
}) {
  const { user } = useUserAuth();
  const { data: store } = useStore();
  const types = INSTITUTION_TYPES[segment];
  // Only what can be quoted is sent: an item that has left the store, or needs a
  // size chosen again, stays in the list (marked there) and is left out.
  const send: BulkLine[] = priced.items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty }));
  const left = priced.issues.length;
  const [f, setF] = useState(() => {
    const c = readContact();
    const i = readInst();
    return {
      institution: i.institution ?? "", instType: i.instType && types.includes(i.instType) ? i.instType : types[0],
      contactName: c.name || user?.name || "", designation: i.designation ?? "", phone: c.phone || user?.phone || "", email: c.email || user?.email || "",
      gstin: i.gstin ?? "", address: i.address ?? "", city: c.city ?? "", state: i.state ?? "", pincode: i.pincode ?? "", needBy: "", notes: "", website: "",
    };
  });
  /** 0: one delivery; otherwise every 1, 2 or 3 months. */
  const [every, setEvery] = useState<0 | DeliverySchedule["every"]>(0);
  const [months, setMonths] = useState<DeliverySchedule["months"]>(12);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [bad, setBad] = useState("");
  const [tries, setTries] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    if (bad === k) { setBad(""); setErr(""); } // the field is being put right
  };
  const today = new Date().toISOString().slice(0, 10);

  const fail = (field: string, message: string) => { setBad(field); setErr(message); setTries((n) => n + 1); };
  // Take people to the field that needs them: focusing it scrolls the dialog there.
  useEffect(() => {
    if (bad) formRef.current?.querySelector<HTMLElement>(".f.bad input, .f.bad select, .f.bad textarea")?.focus();
  }, [bad, tries]);
  /** The message for a field, shown under it. */
  const errFor = (k: string) => (bad === k && err ? <small className="ax-f-err" role="alert">{err}</small> : null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBad("");
    if (!send.length && f.notes.trim().length < 15) return fail("notes", "Your list is empty: describe what you need in the notes (products and quantities), or add products to the list first.");
    if (f.institution.trim().length < 3) return fail("institution", "Please enter the name of your institution.");
    if (f.contactName.trim().length < 2) return fail("contactName", "Please enter the name of the person we should contact.");
    if (!normPhone(f.phone)) return fail("phone", "Please enter a 10-digit Indian mobile number.");
    if (!validEmail(f.email)) return fail("email", "Please enter an email address: the quotation is sent there.");
    if (f.gstin.trim() && !validGstin(f.gstin)) return fail("gstin", "That GSTIN doesn't look right (15 characters, like 27ABCDE1234F1Z5). Leave it empty if you don't have one.");
    if (f.city.trim().length < 2) return fail("city", "Please enter the city.");
    if (!INDIAN_STATES.includes(f.state)) return fail("state", "Please choose the state.");
    if (!validPincode(f.pincode)) return fail("pincode", "Please enter the 6-digit PIN code.");
    setBusy(true);
    try {
      const r = await sendBulkRequest({
        segment, institution: f.institution.trim(), instType: f.instType, contactName: f.contactName.trim(), designation: f.designation.trim() || undefined,
        phone: f.phone, email: f.email.trim(), gstin: f.gstin.trim().toUpperCase() || undefined, address: f.address.trim() || undefined,
        city: f.city.trim(), state: f.state, pincode: f.pincode.trim(), needBy: f.needBy || undefined,
        schedule: every ? { every, months } : undefined, notes: f.notes.trim() || undefined,
        lines: send, website: f.website || undefined,
      });
      rememberContact({ name: f.contactName.trim(), phone: f.phone, email: f.email.trim(), city: f.city.trim() });
      try {
        const keep: Inst = { institution: f.institution.trim(), instType: f.instType, designation: f.designation.trim(), gstin: f.gstin.trim().toUpperCase(), address: f.address.trim(), state: f.state, pincode: f.pincode.trim() };
        localStorage.setItem(INST_KEY, JSON.stringify(keep));
      } catch { /* storage blocked */ }
      onDone({ id: r.id, email: f.email.trim(), emailed: r.emailed });
    } catch (e2) {
      const x = e2 as StoreError;
      const issues: { productId: number }[] = Array.isArray(x.data?.issues) ? x.data.issues : [];
      const names = issues.map((i) => store?.byId.get(i.productId)?.name).filter(Boolean);
      const known = ["institution", "contactName", "phone", "email", "gstin", "city", "state", "pincode", "schedule", "notes"];
      fail(known.includes(x.data?.field) ? x.data.field : "", names.length ? `These products can't be quoted right now: ${names.join(", ")}. Remove them from your list and send it again.` : x.message);
    } finally {
      setBusy(false);
    }
  };
  const cls = (k: string) => `f${bad === k ? " bad" : ""}`;

  return (
    <form className="ax-bq" onSubmit={submit} noValidate ref={formRef}>
      {send.length ? (
        <p className="ax-bq-sum">
          <b>{priced.items.length} product{priced.items.length === 1 ? "" : "s"}</b>, {priced.units.toLocaleString("en-IN")} units
          {priced.estTotal > 0 && <> · {formatINR(priced.estTotal)} at store prices</>}
          {priced.unpriced > 0 && <> · {priced.unpriced} priced on request</>}
        </p>
      ) : (
        <p className="ax-bq-sum empty">{lines.length ? "None of the products in your list can be quoted now." : "Your list is empty."} Describe what you need below (products and quantities), or close this and add products to the list.</p>
      )}
      {left > 0 && (
        <p className="ax-bq-warn" role="note">
          {left} item{left === 1 ? "" : "s"} in your list {left === 1 ? "is" : "are"} left out: no longer available, or a size needs choosing again. You can add {left === 1 ? "it" : "them"} to the notes.
        </p>
      )}
      <div className="ax-form">
        <label className={`${cls("institution")} wide`}><span>Institution</span><input value={f.institution} onChange={set("institution")} autoComplete="organization" maxLength={120} placeholder={segment === "hospital" ? "Name of the hospital or clinic" : "Name of the college"} required />{errFor("institution")}</label>
        <label className={cls("instType")}><span>Type</span><select value={f.instType} onChange={set("instType")}>{types.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className={cls("gstin")}><span>GSTIN <em>(optional)</em></span><input value={f.gstin} onChange={set("gstin")} maxLength={15} autoCapitalize="characters" placeholder="27ABCDE1234F1Z5" />{errFor("gstin")}</label>
        <label className={cls("contactName")}><span>Your name</span><input value={f.contactName} onChange={set("contactName")} autoComplete="name" maxLength={80} required />{errFor("contactName")}</label>
        <label className={cls("designation")}><span>Designation <em>(optional)</em></span><input value={f.designation} onChange={set("designation")} maxLength={80} placeholder={segment === "hospital" ? "Purchase manager, matron…" : "HOD, professor, class representative…"} /></label>
        <label className={cls("phone")}><span>Mobile number</span><input value={f.phone} onChange={set("phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder="10-digit mobile" required />{errFor("phone")}</label>
        <label className={cls("email")}><span>Email</span><input value={f.email} onChange={set("email")} type="email" autoComplete="email" maxLength={254} placeholder="The quotation is sent here" required />{errFor("email")}</label>
        <label className={`${cls("address")} wide`}><span>Delivery address <em>(optional)</em></span><input value={f.address} onChange={set("address")} autoComplete="street-address" maxLength={300} placeholder="Building, street, area" /></label>
        <div className="wide ax-bq-place">
          <label className={cls("city")}><span>City</span><input value={f.city} onChange={set("city")} autoComplete="address-level2" maxLength={60} required />{errFor("city")}</label>
          <label className={cls("state")}><span>State</span><select value={f.state} onChange={set("state")} required><option value="">Choose…</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select>{errFor("state")}</label>
          <label className={cls("pincode")}><span>PIN code</span><input value={f.pincode} onChange={set("pincode")} inputMode="numeric" autoComplete="postal-code" maxLength={6} required />{errFor("pincode")}</label>
        </div>
        <div className="wide ax-bq-when" role="group" aria-labelledby="ax-bq-when">
          <span className="lab" id="ax-bq-when">When do you need it?</span>
          <div className="seg" role="radiogroup" aria-label="How often">
            {([0, ...REPEAT_EVERY] as const).map((n) => (
              <button key={n} type="button" role="radio" aria-checked={every === n} className={every === n ? "on" : ""} onClick={() => setEvery(n)}>
                {n === 0 ? "Once" : n === 1 ? "Every month" : `Every ${n} months`}
              </button>
            ))}
          </div>
          <div className="row">
            <label className={cls("needBy")}><span>{every ? "First delivery by" : "Needed by"} <em>(optional)</em></span><input value={f.needBy} onChange={set("needBy")} type="date" min={today} /></label>
            {every > 0 && (
              <label className={cls("schedule")}><span>For</span>
                <select value={months} onChange={(e) => { setMonths(Number(e.target.value) as DeliverySchedule["months"]); if (bad === "schedule") { setBad(""); setErr(""); } }}>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={0}>Until we stop it</option>
                </select>{errFor("schedule")}
              </label>
            )}
          </div>
          {every > 0 && (
            <p className="hint">
              {priced.units > 0 && <>{priced.units.toLocaleString("en-IN")} units each delivery{months ? `, ${months / every} deliveries` : ""}. </>}
              We'll quote the whole schedule. To change or stop it later, just tell us.
            </p>
          )}
        </div>
        <label className={`${cls("notes")} wide`}><span>{send.length ? <>Notes <em>(optional)</em></> : "What you need"}</span><textarea value={f.notes} onChange={set("notes")} rows={send.length ? 3 : 5} maxLength={1500} placeholder={send.length ? "Sizes or colours, products not listed, delivery instructions, purchase order details…" : "For example: 60 stethoscopes for first-year students, 10 aneroid BP apparatus for the skills lab"} />{errFor("notes")}</label>
        <label className="ax-hp" aria-hidden="true">Website<input value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" /></label>
      </div>
      {err && !bad && <p className="ax-form-err" role="alert">{err}</p>}
      <button type="submit" className="ax-btn teal lg ax-enq-go" disabled={busy}>{busy ? <><Loader2 size={17} className="spin" /> Sending…</> : "Send for a quotation"}</button>
      <p className="ax-enq-fine"><Lock size={12} /> We use these details only to quote and deliver this request. {BUSINESS.legalName}.</p>
    </form>
  );
}

export function BulkQuoteDone({ id, email, emailed }: { id: string; email: string; emailed: boolean }) {
  return (
    <div className="ax-enq-done" role="status">
      <CheckCircle2 size={34} />
      <h3>Request sent</h3>
      <p>We'll send the quotation to <b>{email}</b>, usually within one business day, and may call you to check the details.{emailed ? " A copy of your list is in your inbox." : ""}</p>
      <p className="ref">Reference <b>{id}</b></p>
    </div>
  );
}
