/**
 * /leaderboard. Update 81: this page used to show twenty invented students with random points. It now shows the real
 * leaderboard: best scores in Aethex mock tests (25+ questions, +4 / −1) of students who chose to show their name.
 */
import { Link } from "wouter";
import { Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { PageHero } from "@/components/PageHero";
import { BoardSettings, Leaderboard as Board } from "@/components/study/StudyBits2";

export default function Leaderboard() {
  useSeo({ title: "Leaderboard: NEET-PG mock test scores | Aethex Study", description: "The best NEET-PG mock test scores on Aethex Study this week, this month and all time.", path: "/leaderboard" });
  const { isLoggedIn } = useUserAuth();
  const mine = useQuery({ queryKey: ["study", "mock"], enabled: isLoggedIn, retry: 0, queryFn: async () => { const r = await fetch("/api/study/mock"); if (!r.ok) throw new Error("x"); return (await r.json()) as { board: { name: string; city: string | null; show: boolean } | null } } });
  return (
    <div className="st-page" data-study="leaderboard-page">
      <PageHero tag="Leaderboard" title="Top mock test scores" subtitle="Real results from Aethex mock tests. Take a test of 25 questions or more and choose to show your name." icon={<Trophy className="w-7 h-7" />} />
      <div className="ax-wrap st-lb-page">
        <Board />
        <aside className="st-card">
          <h2>Be on the board</h2>
          <BoardSettings current={mine.data?.board ?? null} />
          <Link href="/mock-test" className="st-btn full">Take a mock test</Link>
        </aside>
      </div>
    </div>
  );
}
