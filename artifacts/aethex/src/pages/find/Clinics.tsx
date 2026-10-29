/** /clinics and /clinic/:key: clinics of checked doctors, by city, and each clinic with its doctors. */
import { useState, type FormEvent } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Building2, MapPin, Search, Stethoscope, Video } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { formatINR } from "@/lib/utils";
import { CITIES, useClinic, useClinics } from "@/lib/find";
import { DoctorCard, FindNav } from "./FindParts";

export function ClinicsPage() {
  useSeo({ title: "Clinics near you: doctors, fees and timings | Aethex Doctors", description: "Find clinics by city, see the doctors who consult there with fees and timings, and book a visit.", path: "/clinics" });
  const [city, setCity] = useState(""), [q, setQ] = useState(""), [cityIn, setCityIn] = useState(""), [qIn, setQIn] = useState("");
  const { data, isLoading, error } = useClinics(city, q);
  const submit = (e: FormEvent) => { e.preventDefault(); setCity(cityIn.trim()); setQ(qIn.trim()); };
  const clinics = data?.clinics ?? [];
  return (
    <div className="fd-page" data-find="clinics">
      <FindNav />
      <div className="fd-bar">
        <form className="ax-wrap fd-search slim" onSubmit={submit} role="search">
          <label className="city"><MapPin size={17} /><input list="fd-cl-cities" value={cityIn} onChange={(e) => setCityIn(e.target.value)} placeholder="City" aria-label="City" /><datalist id="fd-cl-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist></label>
          <label className="q"><Search size={17} /><input value={qIn} onChange={(e) => setQIn(e.target.value)} placeholder="Clinic name or area" aria-label="Search clinics" /></label>
          <button type="submit" className="fd-btn">Search</button>
        </form>
      </div>
      <div className="ax-wrap fd-narrow wide">
        <header className="fd-pagehead"><h1><Building2 size={26} /> Clinics{city ? ` in ${city}` : ""}</h1><p>Clinics where checked doctors on Aethex consult. Open a clinic to see its doctors and book.</p></header>
        {isLoading ? <div className="fd-card sk" />
          : error ? <div className="fd-empty"><b>Couldn't load clinics</b><p>{(error as Error).message}</p></div>
          : !clinics.length ? <div className="fd-empty" data-find="no-clinics"><b>No clinics listed{city ? ` in ${city}` : ""} yet</b><p>Clinics appear here as their doctors join Aethex and are checked.</p><Link href="/list-your-practice" className="fd-btn">List your clinic</Link></div>
          : <div className="fd-clinics">{clinics.map((c) => (
            <Link key={c.key} href={`/clinic/${c.key}`} className="fd-clinic" data-clinic={c.key}>
              <span className="ic"><Building2 size={24} /></span>
              <div>
                <b>{c.name}</b>
                <span><MapPin size={13} /> {c.locality ? `${c.locality}, ` : ""}{c.city} {c.pincode}</span>
                <span className="sp">{c.specialties.slice(0, 4).join(" · ")}</span>
                <span className="meta"><Stethoscope size={13} /> {c.doctors} doctor{c.doctors === 1 ? "" : "s"} · from {c.minFee ? formatINR(c.minFee) : "free"}{c.video ? <> · <Video size={13} /> video</> : null}</span>
              </div>
            </Link>
          ))}</div>}
      </div>
    </div>
  );
}

export function ClinicPage() {
  const { key = "" } = useParams<{ key: string }>();
  const { data, isLoading, error } = useClinic(key);
  const c = data?.clinic;
  useSeo({ title: c ? `${c.name}, ${c.city}: doctors and appointments | Aethex Doctors` : "Clinic | Aethex Doctors", description: c ? `Doctors at ${c.name}, ${c.locality ? `${c.locality}, ` : ""}${c.city}. See fees and timings and book online.` : "A clinic on Aethex Doctors.", path: `/clinic/${key}` });
  return (
    <div className="fd-page" data-find="clinic">
      <FindNav />
      <div className="ax-wrap fd-narrow wide">
        <Link href="/clinics" className="fd-back"><ArrowLeft size={15} /> All clinics</Link>
        {isLoading ? <div className="fd-card sk" />
          : error || !c ? <div className="fd-empty"><b>Clinic not found</b><p>It isn't listed, or its doctors have paused their profiles.</p><Link href="/clinics" className="fd-btn">See clinics</Link></div>
          : <>
            <section className="fd-box fd-clinic-head">
              <span className="ic"><Building2 size={30} /></span>
              <div>
                <h1>{c.name}</h1>
                <p>{c.address}{c.locality ? `, ${c.locality}` : ""}, {c.city} {c.pincode}</p>
                <a className="fd-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.name}, ${c.address}, ${c.city} ${c.pincode}`)}`} target="_blank" rel="noopener noreferrer"><MapPin size={14} /> Get directions</a>
              </div>
            </section>
            <h2 className="fd-h2">{data.doctors.length} doctor{data.doctors.length === 1 ? "" : "s"} at this clinic</h2>
            {data.doctors.map((d) => <DoctorCard key={d.slug} d={d} />)}
          </>}
      </div>
    </div>
  );
}
