/** A subject picker with every subject: MBBS / NEET-PG, specialties, allied health and international exams (update 53). */
import { SUBJECT_GROUPS } from "@/lib/cadus/crew";

export default function SubjectSelect({ value, onChange, data, anyLabel = "Any subject" }: { value: string; onChange: (v: string) => void; data: string; anyLabel?: string }) {
  return (
    <select className="cx-select" value={value} onChange={(e) => onChange(e.target.value)} data-subject={data}>
      <option value="">{anyLabel}</option>
      {SUBJECT_GROUPS.map(([g, list]) => <optgroup key={g} label={g}>{list.map((s) => <option key={s} value={s}>{s}</option>)}</optgroup>)}
    </select>
  );
}
