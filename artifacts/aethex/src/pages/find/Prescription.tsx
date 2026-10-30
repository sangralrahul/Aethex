/** /prescription/:id: a prescription written by the doctor after a visit, printable on an A4 page. */
import { MedicineReminders } from "./DoctorTools2";
import { Link, useParams } from "wouter";
import { ArrowLeft, Printer } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { dateLabel, displayName, signInHere, time12, usePrescription, type FindError } from "@/lib/find";
import { FindNav } from "./FindParts";

export default function PrescriptionPage() {
  const { id = "" } = useParams<{ id: string }>();
  useSeo({ title: "Prescription | Aethex Doctors", description: "Your prescription.", path: `/prescription/${id}` });
  const { data, isLoading, error } = usePrescription(id);
  const p = data?.prescription, fe = error as FindError | null;
  return (
    <div className="fd-page" data-find="rx">
      <FindNav />
      <div className="ax-wrap fd-narrow">
        <div className="fd-rx-bar no-print"><Link href="/appointments" className="fd-back"><ArrowLeft size={15} /> My appointments</Link>{p && <button type="button" className="fd-btn" onClick={() => window.print()}><Printer size={16} /> Print or save as PDF</button>}</div>
        {isLoading ? <div className="fd-card sk" />
          : fe?.status === 401 ? <div className="fd-empty"><b>Sign in to see your prescription</b><a className="fd-btn" href={signInHere()}>Sign in</a></div>
          : !p ? <div className="fd-empty"><b>Prescription not found</b><p>{fe?.message}</p></div>
          : <article className="fd-rx" data-find="rx-sheet">
            <header>
              <div><b>{displayName(p.doctor.name)}</b><span>{p.doctor.qualifications}</span><span>{p.doctor.specialty}</span><span>Reg. no. {p.doctor.regNo} · {p.doctor.regCouncil}</span></div>
              <div className="r"><b>{p.doctor.clinic}</b><span>{p.doctor.address}</span><span>{p.doctor.city} {p.doctor.pincode}</span></div>
            </header>
            <div className="pt">
              <span><small>Patient</small><b>{p.patient.name}{p.patient.age != null ? `, ${p.patient.age} y` : ""}</b></span>
              <span><small>Date</small><b>{dateLabel(p.date, { day: "numeric", month: "long", year: "numeric" })}, {time12(p.time)}</b></span>
              <span><small>Visit</small><b>{p.mode === "video" ? "Video consultation" : "In clinic"}</b></span>
            </div>
            {p.diagnosis && <section><h3>Diagnosis</h3><p>{p.diagnosis}</p></section>}
            {p.items.length > 0 && (
              <section><h3 className="rx">℞</h3>
                <div className="tw"><table>
                  <thead><tr><th>#</th><th>Medicine</th><th>Dose</th><th>How often</th><th>For</th><th>Notes</th></tr></thead>
                  <tbody>{p.items.map((it, i) => <tr key={i}><td>{i + 1}</td><td><b>{it.name}</b></td><td>{it.dose}</td><td>{it.frequency}</td><td>{it.duration}</td><td>{it.notes}</td></tr>)}</tbody>
                </table></div>
              </section>
            )}
            {p.tests && <section><h3>Tests</h3><p>{p.tests}</p></section>}
            {p.advice && <section><h3>Advice</h3><p>{p.advice}</p></section>}
            {p.followUp && <section><h3>Follow-up</h3><p>{dateLabel(p.followUp, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></section>}
            <footer><span>Issued through Aethex Doctors (doctors.aethex.in)</span><span className="sig">{displayName(p.doctor.name)}</span></footer>
          </article>}
        {p && p.items.length > 0 && <MedicineReminders rx={p} />}
      </div>
    </div>
  );
}
