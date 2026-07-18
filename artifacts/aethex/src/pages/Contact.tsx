import { useState } from "react";
import { PageHero } from "@/components/PageHero";
import { Mail, User, FileText, MessageSquare, Send, CheckCircle, Bot } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function Contact() {
  const [form, setForm] = useState<ContactForm>({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ aiResponse: string; emailSent: boolean } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send message."); return; }
      setResult({ aiResponse: data.aiResponse, emailSent: data.emailSent });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const subjects = [
    "Product Query",
    "NEET PG / Medical Exam Help",
    "Order Support",
    "Cadus AI Feedback",
    "Partnership / Wholesale",
    "Technical Issue",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EE] pb-16">
      <PageHero
        tag="AI-Powered Support"
        title="Contact AETHEX"
        subtitle="Submit your query and Cadus AI will respond instantly. You'll also receive the response in your email."
        icon={<Mail className="w-7 h-7" style={{ color: "rgba(255,255,255,0.82)" }} />}
      />
      <div className="max-w-3xl mx-auto px-4 pt-8">

        {result ? (
          <div className="bg-white border border-black/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#00C2A8]/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#00C2A8]" />
              </div>
              <div>
                <h2 className="text-[#1c1c1e] font-bold text-lg">Cadus AI Response</h2>
                <p className="text-[#6c6c70] text-sm">
                  {result.emailSent ? "A copy has been sent to your email." : "Response generated below."}
                </p>
              </div>
            </div>
            <div className="bg-[#F5F3EE] border-l-2 border-[#00C2A8] rounded-r-xl p-5 text-[#1c1c1e] text-sm leading-relaxed whitespace-pre-wrap mb-6">
              {result.aiResponse}
            </div>
            <div className="text-xs text-[#8e8e93] mb-6">
              Cadus AI responses are for informational purposes only. Always consult a licensed medical professional for clinical decisions.
            </div>
            <button onClick={() => setResult(null)}
              className="w-full py-3 bg-black/5 hover:bg-black/10 border border-black/10 rounded-xl text-[#1c1c1e] font-medium transition-all">
              Submit Another Query
            </button>
          </div>
        ) : (
          <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#007AFF] to-[#00C2A8] px-8 py-5 border-b border-black/5">
              <div className="flex items-center gap-2 text-[#3c3c43] text-sm">
                <Bot className="w-4 h-4 text-[#00C2A8]" />
                Cadus AI will analyse your query and respond immediately
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
                    <input name="name" type="text" value={form.name} onChange={handleChange} required
                      placeholder="Dr. Priya Sharma"
                      className="w-full pl-10 pr-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8] focus:ring-1 focus:ring-[#00C2A8]/30 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
                    <input name="email" type="email" value={form.email} onChange={handleChange} required
                      placeholder="doctor@hospital.in"
                      className="w-full pl-10 pr-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8] focus:ring-1 focus:ring-[#00C2A8]/30 transition-all" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Subject</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
                  <select name="subject" value={form.subject} onChange={handleChange} required
                    className="w-full pl-10 pr-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] focus:outline-none focus:border-[#00C2A8] focus:ring-1 focus:ring-[#00C2A8]/30 transition-all appearance-none">
                    <option value="" className="bg-white">Select a subject…</option>
                    {subjects.map(s => <option key={s} value={s} className="bg-white">{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">
                  Your Query <span className="text-[#8e8e93] font-normal">({form.message.length}/2000)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-[#8e8e93]" />
                  <textarea name="message" value={form.message} onChange={handleChange} required rows={5}
                    maxLength={2000}
                    placeholder="Describe your question or issue in detail…"
                    className="w-full pl-10 pr-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8] focus:ring-1 focus:ring-[#00C2A8]/30 transition-all resize-none" />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{error}</div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#00C2A8] hover:bg-[#00D4B8] text-[#0D1117] font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0D1117]/30 border-t-white rounded-full animate-spin" />
                    Cadus AI is thinking…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send to Cadus AI
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#8e8e93]">
                Response delivered via Cadus AI + email confirmation. Usually instant.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
