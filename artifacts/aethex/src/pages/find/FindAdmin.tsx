/** /admin/doctors: check and approve the doctors who listed their practice on Aethex Doctors. */
import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ExternalLink, ShieldCheck, X } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { displayName, findApi, hoursText, signInHere, type FindError, type OwnDoctor } from "@/lib/find";
import { formatINR } from "@/lib/utils";
import { SignInCard } from "./FindParts";

type Row = OwnDoctor & { email: string };
const TABS = ["pending", "live", "paused", "rejected"] as const;

export default function FindAdmin() {
  useSeo({ title: "Approve doctors | Aethex admin", description: "Aethex Doctors approvals.", path: "/admin/doctors" });
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const { data, isLoading, error } = useQuery({ queryKey: ["find", "admin", tab], queryFn: () => findApi<{ doctors: Row[]; counts: Record<string, number> }>(`/admin/doctors?status=${tab}`), retry: false });
  const set = async (d: Row, status: string) => {
    setErr("");
    try { await findApi(`/admin/doctors/${d.id}`, { status, note: notes[d.id] ?? "" }); await qc.invalidateQueries({ queryKey: ["find"] }); }
    catch (x) { setErr((x as FindError).message); }
  };
  const fe = error as FindError | null;

  return (
    <div className="fd-page" data-find="admin">
      <div className="ax-wrap fd-narrow wide">
        <header className="fd-pagehead"><h1><ShieldCheck size={26} /> Aethex Doctors: approve doctors</h1><p>Check each registration number on the NMC's Indian Medical Register before approving. <Link href="/admin">Store admin</Link></p></header>
        {fe?.status === 401 ? <SignInCard title="Sign in as an admin" text="Only accounts in ADMIN_EMAILS can approve doctors." href={signInHere()} />
          : fe ? <div className="fd-empty"><b>Can't open approvals</b><p>{fe.message}</p></div>
          : <>
            <div className="fd-tabs">{TABS.map((t) => <button key={t} type="button" className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t[0]!.toUpperCase() + t.slice(1)} <small>{data?.counts[t] ?? 0}</small></button>)}</div>
            {err && <p className="fd-err">{err}</p>}
            {isLoading ? <div className="fd-card sk" style={{ height: 200 }} /> : !data?.doctors.length ? <p className="fd-none">Nothing here.</p> : data.doctors.map((d) => (
              <article key={d.id} className="fd-adm" data-admin-doctor={d.slug}>
                <div className="txt">
                  <b>{displayName(d.name)}</b> <span className="mu">· {d.email}</span>
                  <span>{d.specialty} · {d.qualifications} · {d.experience} years</span>
                  <span className="reg"><BadgeCheck size={14} /> {d.regNo} · {d.regCouncil}</span>
                  <span className="mu">{d.clinic}, {d.address}{d.locality ? `, ${d.locality}` : ""}, {d.city} {d.pincode}</span>
                  <span className="mu">{d.fee ? formatINR(d.fee) : "Free"}{d.video ? ` · video ${formatINR(d.videoFee ?? d.fee)}` : ""} · {hoursText(d.hours)}</span>
                  <Link href={`/doctor/${d.slug}`} className="fd-link">Preview profile <ExternalLink size={13} /></Link>
                </div>
                <div className="do">
                  <input placeholder="Note to the doctor (optional)" value={notes[d.id] ?? ""} onChange={(e) => setNotes({ ...notes, [d.id]: e.target.value })} />
                  {d.status !== "live" && <button type="button" className="fd-btn sm" onClick={() => void set(d, "live")}><BadgeCheck size={14} /> Approve</button>}
                  {d.status !== "rejected" && <button type="button" className="fd-btn sm danger" onClick={() => void set(d, "rejected")}><X size={14} /> Reject</button>}
                </div>
              </article>
            ))}
          </>}
      </div>
    </div>
  );
}
