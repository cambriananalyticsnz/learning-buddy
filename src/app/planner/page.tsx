"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SamoyedIcon from "@/components/SamoyedIcon";

type Subject = "Chemistry" | "Biology" | "Math" | "Computer Science";
type Level = "IGCSE" | "AS" | "A Level";

type Topic = {
  name: string;
  subtopics: string[];
  estimatedMinutes: number;
  isCompleted: boolean;
};

type Week = {
  weekNumber: number;
  title: string;
  topics: Topic[];
};

type StudyPlan = {
  id: string;
  subject: string;
  title: string;
  plan_data: { weeks: Week[] };
  progress: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
};

const SUBJECTS: Subject[] = ["Chemistry", "Biology", "Math", "Computer Science"];
const LEVELS: Level[] = ["IGCSE", "AS", "A Level"];

const SUBJECT_EMOJIS: Record<string, string> = {
  Chemistry: "⚡",
  Biology: "🧬",
  Math: "📐",
  "Computer Science": "💻",
};

export default function PlannerPage() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState<Subject>("Chemistry");
  const [newLevel, setNewLevel] = useState<Level>("IGCSE");
  const [newWeeks, setNewWeeks] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("study_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setPlans(data);
    setLoading(false);
  }

  async function generatePlan() {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newSubject,
          level: newLevel,
          durationWeeks: newWeeks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate plan");
      }

      if (data.parseError) {
        setError("Could not format the plan. Please try again.");
        setGenerating(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in first.");
        setGenerating(false);
        return;
      }

      const planTitle = `${newSubject} ${newLevel} Study Plan`;

      const { error: insertError } = await supabase
        .from("study_plans")
        .insert({
          user_id: user.id,
          subject: newSubject,
          title: planTitle,
          plan_data: { weeks: data.planData },
        });

      if (insertError) throw insertError;

      setShowCreate(false);
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function toggleTopic(planId: string, weekIdx: number, topicIdx: number) {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const progressKey = `w${weekIdx}_t${topicIdx}`;
    const newProgress = { ...plan.progress, [progressKey]: !plan.progress[progressKey] };

    // Update local state
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId ? { ...p, progress: newProgress } : p
      )
    );

    // Save to Supabase
    await supabase
      .from("study_plans")
      .update({ progress: newProgress, updated_at: new Date().toISOString() })
      .eq("id", planId);
  }

  async function deletePlan(id: string) {
    if (!confirm("Delete this study plan?")) return;
    await supabase.from("study_plans").delete().eq("id", id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }

  function calcProgress(plan: StudyPlan): string {
    const weeks = plan.plan_data?.weeks;
    if (!weeks) return "0%";

    let total = 0;
    let done = 0;
    weeks.forEach((week, wi) => {
      week.topics.forEach((_topic, ti) => {
        total++;
        if (plan.progress[`w${wi}_t${ti}`]) done++;
      });
    });

    return total > 0 ? `${Math.round((done / total) * 100)}%` : "0%";
  }

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden">
            <SamoyedIcon className="w-6 h-6" />
          </div>
          <h1 className="font-bold text-lg text-white">Study Planner</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors border border-amber-500/20"
        >
          + New Plan
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Create plan modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !generating && setShowCreate(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-base font-semibold text-white mb-4">Create Study Plan</h2>

            <label className="block text-xs text-zinc-500 mb-1.5">Subject</label>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setNewSubject(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    newSubject === s
                      ? "bg-zinc-800 text-amber-400 border border-zinc-700"
                      : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                  }`}
                >
                  {SUBJECT_EMOJIS[s]} {s}
                </button>
              ))}
            </div>

            <label className="block text-xs text-zinc-500 mb-1.5">Level</label>
            <div className="flex gap-1.5 mb-3">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setNewLevel(l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    newLevel === l
                      ? "bg-zinc-800 text-amber-400 border border-zinc-700"
                      : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <label className="block text-xs text-zinc-500 mb-1.5">Duration (weeks)</label>
            <input
              type="range"
              min={4}
              max={16}
              value={newWeeks}
              onChange={(e) => setNewWeeks(Number(e.target.value))}
              className="w-full mb-1 accent-amber-500"
            />
            <div className="text-center text-xs text-zinc-500 mb-4">{newWeeks} weeks</div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                disabled={generating}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-30"
              >
                Cancel
              </button>
              <button
                onClick={generatePlan}
                disabled={generating}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors border border-amber-500/20 disabled:opacity-30"
              >
                {generating ? "Generating..." : "Generate Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      ) : plans.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <SamoyedIcon className="w-16 h-16 opacity-20 mb-4" />
          <h2 className="text-lg font-semibold text-zinc-400 mb-1">
            No study plans yet
          </h2>
          <p className="text-sm text-zinc-600 max-w-sm mb-5">
            Create a personalised study plan for your Cambridge CIE exams.
            Plans are tailored to your subject and level.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors border border-amber-500/20"
          >
            Create your first plan
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl bg-zinc-900/80 border border-zinc-800 overflow-hidden"
            >
              {/* Plan header */}
              <div className="p-3 flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {SUBJECT_EMOJIS[plan.subject] || "📘"}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{plan.title}</h3>
                    <p className="text-[10px] text-zinc-500">
                      {calcProgress(plan)} complete
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deletePlan(plan.id)}
                  className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-red-500/20 flex items-center justify-center text-xs text-zinc-500 hover:text-red-400 transition-colors"
                >
                  🗑️
                </button>
              </div>

              {/* Progress bar */}
              <div className="px-3 pt-2 pb-1">
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
                    style={{ width: calcProgress(plan) }}
                  />
                </div>
              </div>

              {/* Weeks */}
              <div className="px-3 pb-3 space-y-2">
                {plan.plan_data?.weeks?.map((week, wi) => (
                  <details key={wi} className="group">
                    <summary className="flex items-center gap-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer list-none">
                      <span className="text-zinc-600 group-open:text-amber-400 transition-colors">▶</span>
                      <span className="font-medium">Week {week.weekNumber}</span>
                      <span className="text-zinc-600">—</span>
                      <span className="text-zinc-500">{week.title}</span>
                    </summary>
                    <div className="ml-4 space-y-1 mt-1">
                      {week.topics.map((topic, ti) => {
                        const progressKey = `w${wi}_t${ti}`;
                        const isDone = plan.progress[progressKey];

                        return (
                          <button
                            key={ti}
                            onClick={() => toggleTopic(plan.id, wi, ti)}
                            className={`w-full text-left flex items-center gap-2 p-2 rounded-lg transition-colors ${
                              isDone
                                ? "bg-green-500/5"
                                : "hover:bg-zinc-800/50"
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded border flex items-center justify-center text-[8px] transition-colors shrink-0 ${
                                isDone
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-zinc-600"
                              }`}
                            >
                              {isDone ? "✓" : ""}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-xs transition-colors ${
                                  isDone ? "text-zinc-500 line-through" : "text-zinc-200"
                                }`}
                              >
                                {topic.name}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {topic.subtopics?.map((sub, si) => (
                                  <span
                                    key={si}
                                    className={`text-[9px] px-1 py-0.5 rounded ${
                                      isDone
                                        ? "text-zinc-600 bg-zinc-800"
                                        : "text-zinc-600 bg-zinc-800"
                                    }`}
                                  >
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <span className="text-[9px] text-zinc-600 shrink-0">
                              {topic.estimatedMinutes || "—"}m
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
