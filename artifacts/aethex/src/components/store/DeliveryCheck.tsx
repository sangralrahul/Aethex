/**
 * "Deliver to <PIN>": the place a PIN code belongs to and the days an order
 * placed now usually arrives between (lib/store/delivery.ts), on product and
 * book pages. The PIN is remembered for the next page and for checkout.
 * Styles: src/shop.css (.ax-dlv).
 */
import { useEffect, useState } from "react";
import { Loader2, MapPin, Truck } from "lucide-react";
import { dayText, deliveryWindow, lookupPin, savedPin, savePin, type PinPlace } from "@/lib/store/delivery";
import { COD_LIMIT, validPincode } from "@/lib/store/rules";
import { formatINR } from "@/lib/utils";

export function DeliveryCheck({ price }: { price?: number | null }) {
  const [pin, setPin] = useState("");
  const [place, setPlace] = useState<PinPlace | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const check = async (p: string) => {
    setErr("");
    if (!validPincode(p)) { setPlace(undefined); setErr("Enter a 6-digit PIN code."); return; }
    setBusy(true);
    try {
      const found = await lookupPin(p);
      setPlace(found);
      if (found) savePin(p);
    } catch {
      setErr("Couldn't check right now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => { const p = savedPin(); if (p) { setPin(p); check(p); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const w = deliveryWindow();
  return (
    <div className="ax-dlv">
      <form onSubmit={(e) => { e.preventDefault(); check(pin.trim()); }} noValidate>
        <label>
          <MapPin size={16} />
          <span>Deliver to</span>
          <input value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPlace(undefined); setErr(""); }} inputMode="numeric" autoComplete="postal-code" placeholder="PIN code" aria-label="Your PIN code" maxLength={6} />
        </label>
        <button type="submit" className="ax-link" disabled={busy}>{busy ? <Loader2 size={14} className="spin" /> : null} Check</button>
      </form>
      {place && (
        <p className="ok">
          <Truck size={16} />
          <span><b>{place.district}, {place.state} {place.pincode}</b>Usually arrives between {dayText(w.from)} and {dayText(w.to)} if you order today{price == null || price <= COD_LIMIT ? " · cash on delivery available" : ` · cash on delivery is for orders up to ${formatINR(COD_LIMIT)}`}</span>
        </p>
      )}
      {place === null && <p className="bad">We couldn't find PIN code {pin}. Check the number, or write it at checkout and we'll confirm delivery.</p>}
      {err && <p className="bad">{err}</p>}
    </div>
  );
}
