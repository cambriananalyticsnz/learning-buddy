"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SamoyedIcon from "@/components/SamoyedIcon";

type Conversation = {
  id: string;
  subject: string;
  title: string;
  created_at: string;
  updated_at: string;
};

const SUBJECT_EMOJIS: Record<string, string> = {
  Chemistry: "⚡",
  Biology: "🧬",
  Math: "📐",
  "Computer Science": "💻",
};

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
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
        .from("conversations")
        .select("id, subject, title, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (data) setConversations(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    setDeleting(id);
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
  }

  function handleOpen(id: string) {
    router.push(`/?conversationId=${id}`);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-NZ", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden">
            <SamoyedIcon className="w-6 h-6" />
          </div>
          <h1 className="font-bold text-lg text-white">Conversation History</h1>
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
      ) : conversations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <SamoyedIcon className="w-16 h-16 opacity-20 mb-4" />
          <h2 className="text-lg font-semibold text-zinc-400 mb-1">
            No conversations yet
          </h2>
          <p className="text-sm text-zinc-600 max-w-sm mb-5">
            Your chat history will appear here once you start learning.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors border border-amber-500/20"
          >
            Start a conversation
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleOpen(conv.id)}
              className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-base shrink-0">
                {SUBJECT_EMOJIS[conv.subject] || "📝"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {conv.title}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {conv.subject} · {formatDate(conv.updated_at)}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(conv.id, e)}
                disabled={deleting === conv.id}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-red-500/20 flex items-center justify-center text-xs text-zinc-500 hover:text-red-400 transition-colors shrink-0 disabled:opacity-30"
              >
                🗑️
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
