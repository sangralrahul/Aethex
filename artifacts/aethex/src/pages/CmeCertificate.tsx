/**
 * /cme-certificate. Update 69: this page used to show every visitor the same five "completed" modules with CME credits
 * and generate certificates with a made-up doctor's name and NMC registration number. Aethex is not an accredited CME
 * provider and issues no CME credit, so the page now says that plainly and points to the refresher modules.
 */
import { Link } from "wouter";
import { ArrowRight, Award, BookOpen, Info } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { useSeo } from "@/hooks/use-seo";

export default function CmeCertificate() {
  useSeo({ title: "CME certificates | Aethex Study", description: "About CME credit and certificates on Aethex.", path: "/cme-certificate" });
  return (
    <div className="cme-page">
      <PageHero tag="Continuing medical education" title="CME certificates" icon={<Award className="w-7 h-7" />} width="4xl" />
      <div className="ax-wrap cme-body" style={{ maxWidth: 960 }}>
        <div className="cme-cert">
          <span className="ic"><Info size={22} /></span>
          <h2>Aethex does not issue CME credit yet</h2>
          <p>
            CME credit hours in India are granted by the National Medical Commission and the state medical councils through
            accredited providers. Aethex is not an accredited provider, so we don't issue CME credit or CME certificates.
          </p>
          <p>Our refresher modules are free to study for your own learning. If that changes, your certificates will appear on this page.</p>
          <div className="acts">
            <Link href="/cme-hub" className="ax-btn teal lg"><BookOpen size={17} /> Browse refresher modules <ArrowRight size={16} /></Link>
            <Link href="/study-hub/medical-knowledge-hub" className="ax-btn lg">Medical Knowledge Hub</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
