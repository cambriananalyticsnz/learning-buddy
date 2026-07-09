"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SamoyedIcon from "@/components/SamoyedIcon";
import { SubjectIcon, AlertIcon, CheckIcon } from "@/components/Icons";

type Mistake = {
  id: string;
  subject: string;
  topic_path: string[];
  mistake_summary: string;
  frequency: number;
  last_occurred_at: string;
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-NZ", { month: "short", day: "numeric" });
}

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("mistake_log")
        .select("*")
        .eq("user_id", user.id)
        .order("last_occurred_at", { ascending: false })
        .limit(50);

      if (data) setMistakes(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    await supabase.from("mistake_log").delete().eq("id", id);
    setMistakes((prev) => prev.filter((m) => m.id !== id));
    setDeleting(null);
  }

  // Group mistakes by subject
  const grouped = mistakes.reduce<Record<string, Mistake[]>>((acc, m) => {
    if (!acc[m.subject]) acc[m.subject] = [];
    acc[m.subject].push(m);
    return acc;
  }, {});

  const subjectOrder = Object.keys(grouped);

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden">
            <SamoyedIcon className="w-6 h-6" />
          </div>
          <h1 className="font-bold text-lg text-white">Mistake Journal</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      ) : mistakes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <SamoyedIcon className="w-16 h-16 opacity-20 mb-4" />
          <h2 className="text-lg font-semibold text-zinc-400 mb-1">
            No mistakes tracked yet
          </h2>
          <p className="text-sm text-zinc-600 max-w-sm mb-5">
            When you get something wrong during a chat, you can mark it for review.
            It will appear here so you can track your weak areas.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors border border-amber-500/20"
          >
            Start learning
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {subjectOrder.map((subject) => (
            <div key={subject}>
              <div className="flex items-center gap-2 mb-2">
                <SubjectIcon subject={subject} size={18} className="text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-300">{subject}</h2>
                <span className="text-xs text-zinc-600">
                  ({grouped[subject].length})
                </span>
              </div>
              <div className="space-y-2">
                {grouped[subject].map((mistake) => (
                  <div
                    key={mistake.id}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-100">
                          {mistake.mistake_summary}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {mistake.topic_path?.map((topic, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
                          <span className="flex items-center gap-1">
                            <AlertIcon size={10} className="text-zinc-600" />
                            ×{mistake.frequency}
                          </span>
                          <span>
                            Last: {formatDate(mistake.last_occurred_at)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(mistake.id)}
                        disabled={deleting === mistake.id}
                        className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-green-500/20 flex items-center justify-center text-zinc-500 hover:text-green-400 transition-colors shrink-0 disabled:opacity-30"
                        title="Mark as resolved"
                      >
                        {deleting === mistake.id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <CheckIcon size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
