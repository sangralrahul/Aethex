/**
 * Crew stats and badges: your level, badges with progress, activity across Crew features, and the
 * Quiz Battle leaderboard. Everything is counted on this device.
 */
import { Award, Lock, Trophy } from "lucide-react";
import { badges, crewLevel, quizLeaderboard, readQuizResults, type CrewStats } from "@/lib/cadus/crew";

const LABELS: [keyof CrewStats, string][] = [["chats", "chats with assistants"], ["assistantsUsed", "different assistants"], ["quizBattles", "quiz battles"], ["drillDays", "daily drills"], ["bestStreak", "best streak (days)"], ["caseRounds", "case rounds"], ["roomMessages", "room messages"], ["notes", "notes saved"], ["cardsReviewed", "cards reviewed"], ["ratings", "answers rated"]];

export default function CrewStatsView({ stats }: { stats: CrewStats }) {
  const bs = badges(stats);
  const earned = bs.filter((b) => b.earned).length;
  const lvl = crewLevel(earned);
  const board = quizLeaderboard(readQuizResults());
  return (
    <section className="cx-page cx-lab cx-crewstats">
      <header className="cx-page-h"><div><h1>Crew Stats &amp; Badges</h1><p>Your progress across Crew: chats, quizzes, drills, case rounds, notes and more. Counted only on this device.</p></div></header>
      <div className="cx-cmp-out cx-ac-in" data-cs2="level"><h3 className="cx-lab-h3"><Award size={18} /> {lvl.title}</h3><p>{earned} of {bs.length} badges{lvl.next !== null ? ` · ${lvl.next - earned} more to the next level` : " · top level reached"}</p></div>
      <div className="cx-sim-stats cx-cs2-tiles">{LABELS.map(([k, l]) => <div key={k}><b data-cs2-stat={k}>{stats[k]}</b><small>{l}</small></div>)}</div>
      <h4>Badges</h4>
      <div className="cx-badges" data-cs2="badges">{bs.map((b) => (
        <div key={b.id} className={`cx-badge-c ${b.earned ? "on" : ""}`} data-badge={b.id} data-earned={String(b.earned)}>
          <span className="ic">{b.earned ? <Award size={20} /> : <Lock size={18} />}</span>
          <b>{b.name}</b><small>{b.desc}</small>
          <span className="bar"><i style={{ width: `${Math.round(b.progress * 100)}%` }} /></span>
          <small>{Math.min(b.value, b.target)}/{b.target}</small>
        </div>
      ))}</div>
      {board.length > 0 && (
        <>
          <h4><Trophy size={14} /> Quiz Battle leaderboard</h4>
          <table className="cx-c23-table" data-cs2="board"><thead><tr><th>Player</th><th>Best</th><th>Games</th><th>Accuracy</th></tr></thead><tbody>{board.map((b) => <tr key={b.name}><td>{b.name}</td><td>{b.best}</td><td>{b.games}</td><td>{b.accuracy}%</td></tr>)}</tbody></table>
        </>
      )}
    </section>
  );
}
