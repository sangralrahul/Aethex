/** Pieces shared by the Aethex Find pages (styles: src/site-find.css, classes fd-*). */
import { Link, useLocation } from "wouter";
import { BadgeCheck, CalendarCheck, LayoutDashboard, MapPin, Search, Star, Stethoscope, Video, UserPlus } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { type Doctor, displayName, hoursText, initials } from "@/lib/find";

export function FindNav() {
  const [loc] = useLocation();
  const on = (re: RegExp) => (re.test(loc) ? "on" : "");
  return (
    <nav className="fd-subnav no-print" aria-label="Find a doctor">
      <div className="ax-wrap">
        <Link href="/find" className={`brand ${on(/^\/(find)?$/)}`}><Stethoscope size={17} /> Aethex Find</Link>
        <Link href="/doctors" className={on(/^\/doctors?/)}><Search size={15} /> Find doctors</Link>
        <Link href="/appointments" className={on(/^\/appointments/)}><CalendarCheck size={15} /> My appointments</Link>
        <span className="sep" />
        <Link href="/list-your-practice" className={`doc ${on(/^\/list-your-practice/)}`}><UserPlus size={15} /> List your practice</Link>
        <Link href="/practice" className={`doc ${on(/^\/practice/)}`}><LayoutDashboard size={15} /> Practice dashboard</Link>
      </div>
    </nav>
  );
}

export function Avatar({ name, size = 72 }: { name: string; size?: number }) {
  return <span className="fd-av" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">{initials(name)}</span>;
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return <span className="fd-stars" aria-label={`${value} out of 5`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={size} fill={i < Math.round(value) ? "currentColor" : "none"} />)}</span>;
}

export function DoctorCard({ d, next }: { d: Doctor; next?: string | null }) {
  return (
    <article className="fd-card" data-doctor={d.slug}>
      <Link href={`/doctor/${d.slug}`} className="fd-card-main">
        <Avatar name={d.name} />
        <div className="txt">
          <h3>{displayName(d.name)}</h3>
          <p className="sp">{d.specialty}</p>
          <p className="mu">{d.qualifications}</p>
          <p className="mu">{d.experience} years experience overall</p>
          <p className="loc"><MapPin size={14} /> <b>{d.locality ? `${d.locality}, ` : ""}{d.city}</b> · {d.clinic}</p>
          <p className="fee">{d.fee ? <>{formatINR(d.fee)} consultation fee at clinic</> : "Free consultation"}</p>
          <div className="tags">
            <span className="ok"><BadgeCheck size={13} /> Registration checked</span>
            {d.video && <span><Video size={13} /> Video consult</span>}
            {d.rating && <span className="rt"><Star size={13} fill="currentColor" /> {d.rating.avg.toFixed(1)} · {d.rating.count} patient review{d.rating.count === 1 ? "" : "s"}</span>}
          </div>
        </div>
      </Link>
      <div className="fd-card-side">
        <p className="hrs">{hoursText(d.hours)}</p>
        {next && <p className="next">Next available: <b>{next}</b></p>}
        <Link href={`/doctor/${d.slug}#book`} className="fd-btn">Book clinic visit</Link>
        {d.video && <Link href={`/doctor/${d.slug}?mode=video#book`} className="fd-btn ghost">Book video consult</Link>}
      </div>
    </article>
  );
}

export function SignInCard({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <div className="fd-empty">
      <b>{title}</b>
      <p>{text}</p>
      <a className="fd-btn" href={href}>Sign in or create an account</a>
    </div>
  );
}
