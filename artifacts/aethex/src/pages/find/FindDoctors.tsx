/** /doctors: search results, with filters for city, specialty and video consults. */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { MapPin, Search, SlidersHorizontal, UserPlus, Video } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { CITIES, SPECIALTIES, addDays, dateLabel, daySlots, time12, useDoctors, type Doctor } from "@/lib/find";
import { DoctorCard, FindNav } from "./FindParts";

/** The doctor's next consulting slot in the coming week (by hours only; bookings are checked on the profile). */
function nextSlot(d: Doctor): string | null {
  if (!d.hours) return null;
  const ist = new Date(Date.now() + 330 * 60000), today = ist.toISOString().slice(0, 10), now = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  for (let i = 0; i < 8; i++) {
    const date = addDays(today, i);
    const t = daySlots(d.hours, date).find((s) => i > 0 || Number(s.slice(0, 2)) * 60 + Number(s.slice(3)) > now + 30);
    if (t) return `${i === 0 ? "Today" : i === 1 ? "Tomorrow" : dateLabel(date)}, ${time12(t)}`;
  }
  return null;
}

export default function FindDoctors() {
  const search = useSearch();
  const [, go] = useLocation();
  const sp = useMemo(() => new URLSearchParams(search), [search]);
  const city = sp.get("city") || "", specialty = sp.get("specialty") || "", q = sp.get("q") || "", video = sp.get("video") === "1";
  const [qIn, setQIn] = useState(q), [cityIn, setCityIn] = useState(city);
  useEffect(() => { setQIn(q); setCityIn(city); }, [q, city]);
  const { data, isLoading, error, refetch } = useDoctors({ city, specialty, q, video });
  const title = `${specialty || (q ? `"${q}"` : "Doctors")}${city ? ` in ${city}` : ""}`;
  useSeo({ title: `${title}: book an appointment | Aethex Find`, description: `Find ${specialty || "doctors"}${city ? ` in ${city}` : ""} on Aethex Find, see fees and timings, and book online.`, path: "/doctors" });

  const set = (k: string, v: string) => {
    const p = new URLSearchParams(search);
    if (v) p.set(k, v); else p.delete(k);
    go(`/doctors?${p}`);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams(search);
    cityIn ? p.set("city", cityIn) : p.delete("city");
    const spec = SPECIALTIES.find((s) => s.toLowerCase() === qIn.trim().toLowerCase());
    if (spec) { p.set("specialty", spec); p.delete("q"); } else { qIn.trim() ? p.set("q", qIn.trim()) : p.delete("q"); }
    go(`/doctors?${p}`);
  };
  const doctors = data?.doctors ?? [];

  return (
    <div className="fd-page" data-find="results">
      <FindNav />
      <div className="fd-bar">
        <form className="ax-wrap fd-search slim" onSubmit={submit} role="search">
          <label className="city"><MapPin size={17} /><input list="fd-cities2" value={cityIn} onChange={(e) => setCityIn(e.target.value)} placeholder="City" aria-label="City" />
            <datalist id="fd-cities2">{(data?.cities.length ? data.cities.map((c) => c.city) : CITIES).map((c) => <option key={c} value={c} />)}</datalist></label>
          <label className="q"><Search size={17} /><input list="fd-specs2" value={qIn} onChange={(e) => setQIn(e.target.value)} placeholder="Search doctors, specialties, clinics" aria-label="Search doctors" />
            <datalist id="fd-specs2">{SPECIALTIES.map((s) => <option key={s} value={s} />)}</datalist></label>
          <button type="submit" className="fd-btn">Search</button>
        </form>
      </div>
      <div className="ax-wrap fd-results">
        <aside className="fd-filters" aria-label="Filters">
          <b><SlidersHorizontal size={15} /> Filters</b>
          <label>Specialty
            <select value={specialty} onChange={(e) => set("specialty", e.target.value)}>
              <option value="">All specialties</option>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>City
            <select value={city} onChange={(e) => set("city", e.target.value)}>
              <option value="">All cities</option>
              {(data?.cities ?? []).map((c) => <option key={c.city} value={c.city}>{c.city} ({c.count})</option>)}
              {city && !(data?.cities ?? []).some((c) => c.city.toLowerCase() === city.toLowerCase()) && <option value={city}>{city}</option>}
            </select>
          </label>
          <label className="chk"><input type="checkbox" checked={video} onChange={(e) => set("video", e.target.checked ? "1" : "")} /> <Video size={15} /> Video consult available</label>
          {(city || specialty || q || video) && <button type="button" className="fd-link" onClick={() => go("/doctors")}>Clear all</button>}
        </aside>
        <section className="fd-list" aria-live="polite">
          <div className="fd-list-head">
            <h1>{title}</h1>
            {!isLoading && !error && <p>{doctors.length ? `${doctors.length} doctor${doctors.length === 1 ? "" : "s"} available for booking` : ""}</p>}
          </div>
          {isLoading ? Array.from({ length: 3 }, (_, i) => <div key={i} className="fd-card sk" />)
            : error ? <div className="fd-empty"><b>Couldn't load doctors</b><p>{(error as Error).message}</p><button type="button" className="fd-btn" onClick={() => void refetch()}>Try again</button></div>
            : !doctors.length ? (
              <div className="fd-empty" data-find="empty">
                <b>No doctors listed {specialty ? `as ${specialty}` : ""}{city ? ` in ${city}` : ""} yet</b>
                <p>Aethex Find is new, and only doctors whose registration we've checked are listed. Try another city or specialty, or tell a doctor you know they can list their practice free.</p>
                <div className="row"><Link href="/doctors" className="fd-btn ghost">See all doctors</Link><Link href="/list-your-practice" className="fd-btn"><UserPlus size={16} /> I'm a doctor: list my practice</Link></div>
              </div>
            ) : doctors.map((d) => <DoctorCard key={d.slug} d={d} next={nextSlot(d)} />)}
        </section>
      </div>
    </div>
  );
}
