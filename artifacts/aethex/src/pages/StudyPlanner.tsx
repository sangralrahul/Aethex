/**
 * /study-planner. Update 81: this page used to show a fixed sample week with April dates. It now builds the real
 * countdown plan: the exam and its date, the weeks left planned from the student's weakest subjects, and today's
 * tasks (src/components/study/StudyBits2.tsx, ExamPlan). The same plan is in My library.
 */
import { CalendarDays } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { PageHero } from "@/components/PageHero";
import { TodayCard, useStudySync } from "@/components/study/StudyBits";
import { ExamPlan } from "@/components/study/StudyBits2";

export default function StudyPlanner() {
  useSeo({ title: "Study planner: exam countdown plan | Aethex Study", description: "Set your exam date and get a week-by-week plan built from your weakest subjects, with today's tasks.", path: "/study-planner" });
  useStudySync();
  return (
    <div className="st-page" data-study="planner">
      <PageHero tag="Study planner" title="Your exam countdown" subtitle="Pick your exam and its date. We plan the weeks left from your weakest subjects and give you today's tasks." icon={<CalendarDays className="w-7 h-7" />} />
      <div className="ax-wrap st-planner"><TodayCard /><ExamPlan /></div>
    </div>
  );
}
