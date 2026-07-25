import { useState, useEffect } from "react";
import { Copy, CheckCheck, Users, Gift, Link as LinkIcon, Crown } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { loginUrl } from "@/lib/host";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const APP_URL = loginUrl("").replace(/\/$/, "");

interface Referral {
  id: number;
  referralCode: string;
  referredEmail: string | null;
  status: string;
  rewardGranted: boolean;
  createdAt: string;
}

export function ReferralProgram() {
  const { isLoggedIn, getJwt } = useUserAuth();
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [applyCode, setApplyCode] = useState("");
  const [applyStatus, setApplyStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);

  const jwt = getJwt();

  const fetchData = async () => {
    if (!jwt) return;
    setLoading(true);
    const [codeRes, referralsRes] = await Promise.all([
      fetch(`${API_BASE}/api/monetization/referrals/create`, { method: "POST", headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" } }),
      fetch(`${API_BASE}/api/monetization/referrals/my`, { headers: { Authorization: `Bearer ${jwt}` } }),
    ]);
    if (codeRes.ok) { const d = await codeRes.json(); setCode(d.code); }
    if (referralsRes.ok) { const d = await referralsRes.json(); setReferrals(d.referrals ?? []); }
    setLoading(false);
  };

  useEffect(() => { if (isLoggedIn) fetchData(); }, [isLoggedIn]);

  const referralLink = code ? `${APP_URL}/signup?ref=${code}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const applyReferral = async () => {
    if (!applyCode.trim() || !jwt) return;
    setApplyLoading(true);
    const res = await fetch(`${API_BASE}/api/monetization/referrals/apply`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({ code: applyCode.trim() }),
    });
    const data = await res.json() as { message?: string; error?: string };
    setApplyStatus({ ok: res.ok, msg: (data.message ?? data.error ?? "") });
    setApplyLoading(false);
  };

  const completedReferrals = referrals.filter(r => r.rewardGranted).length;

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(0,194,168,0.04)", border: "1px solid rgba(0,194,168,0.15)" }}>
        <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "#00C2A8" }} />
        <p className="font-semibold text-sm" style={{ color: "#1c1c1e" }}>Sign in to access your referral link</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,rgba(0,194,168,0.08) 0%,rgba(0,122,255,0.06) 100%)", border: "1px solid rgba(0,194,168,0.2)" }}>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#00C2A8,#007AFF)" }}>
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold" style={{ color: "#1c1c1e" }}>Refer & Earn</h3>
              <p className="text-xs" style={{ color: "#636366" }}>Invite a friend → you both get 1 month free</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 flex-1 px-3.5 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(60,60,67,0.15)" }}>
              <LinkIcon className="w-3.5 h-3.5 shrink-0" style={{ color: "#aeaeb2" }} />
              <span className="text-xs font-mono truncate" style={{ color: "#3c3c43" }}>
                {loading ? "Generating link..." : referralLink}
              </span>
            </div>
            <button
              onClick={copyLink}
              disabled={!code}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all hover:opacity-90"
              style={{ background: copied ? "#10b981" : "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#fff" }}
            >
              {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {code && (
            <p className="text-xs" style={{ color: "#636366" }}>
              Your referral code: <span className="font-bold font-mono" style={{ color: "#007AFF" }}>{code}</span>
            </p>
          )}
        </div>

        {completedReferrals > 0 && (
          <div className="px-5 pb-4">
            <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(0,194,168,0.12)", border: "1px solid rgba(0,194,168,0.2)" }}>
              <Crown className="w-4 h-4" style={{ color: "#00C2A8" }} />
              <p className="text-sm font-semibold" style={{ color: "#1c1c1e" }}>
                {completedReferrals} successful referral{completedReferrals !== 1 ? "s" : ""}
              </p>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#00C2A8", color: "#fff" }}>
                +{completedReferrals} month{completedReferrals !== 1 ? "s" : ""} free
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(60,60,67,0.1)" }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: "#1c1c1e" }}>Apply a Referral Code</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. AETHEX-123-ABC"
            value={applyCode}
            onChange={e => setApplyCode(e.target.value.toUpperCase())}
            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none font-mono"
            style={{ border: "1.5px solid rgba(60,60,67,0.2)", color: "#1c1c1e" }}
          />
          <button
            onClick={applyReferral}
            disabled={applyLoading || !applyCode.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}
          >
            {applyLoading ? "Applying…" : "Apply"}
          </button>
        </div>
        {applyStatus && (
          <p className="mt-2 text-xs font-medium" style={{ color: applyStatus.ok ? "#10b981" : "#ef4444" }}>
            {applyStatus.msg}
          </p>
        )}
      </div>

      {referrals.length > 0 && (
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: "1px solid rgba(60,60,67,0.1)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(60,60,67,0.08)" }}>
            <h3 className="font-semibold text-sm" style={{ color: "#1c1c1e" }}>Referral History</h3>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(60,60,67,0.06)" }}>
            {referrals.map(r => (
              <div key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium" style={{ color: "#1c1c1e" }}>
                    {r.referredEmail ?? "Pending sign-up"}
                  </p>
                  <p className="text-[10px]" style={{ color: "#aeaeb2" }}>
                    {new Date(r.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${r.rewardGranted ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>
                  {r.rewardGranted ? "Rewarded" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
