"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SamoyedIcon from "@/components/SamoyedIcon";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { CoinIcon, StarIcon, FireIcon, UserIcon, SparkleIcon, AlertIcon, SubjectIcon } from "@/components/Icons";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Subject = "Chemistry" | "Biology" | "Math" | "Computer Science";

const SUBJECTS: Subject[] = ["Chemistry", "Biology", "Math", "Computer Science"];

type Profile = {
  display_name: string;
  coins: number;
  xp: number;
  streak: number;
  title: string;
  icon_id: string;
};

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center max-w-2xl mx-auto px-4">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState<Subject>("Chemistry");
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [luckySprint, setLuckySprint] = useState<{
    active: boolean;
    multiplier: number;
    questionsRemaining: number;
  } | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mistakeFeedback, setMistakeFeedback] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user profile on mount, or use local defaults
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profile) setProfile(profile);
      } else {
        // Single-user mode — use local defaults
        setProfile({
          display_name: "Student",
          coins: 100,
          xp: 0,
          streak: 0,
          title: "Trainee",
          icon_id: "samoyed-basic",
        });
      }

      // Load conversation from URL if specified
      const urlConversationId = searchParams.get("conversationId");
      if (urlConversationId && user) {
        const { data: conv } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", urlConversationId)
          .single();

        if (conv) {
          setConversationId(conv.id);
          setMessages(conv.messages || []);
          setSubject(conv.subject as Subject);
        }
      }

      setInitialLoading(false);
    }

    load();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save conversation to Supabase when it changes
  async function saveConversation(msgs: Message[]) {
    if (!userId || !profile || msgs.length === 0) return;

    if (conversationId) {
      await supabase
        .from("conversations")
        .update({ messages: msgs, updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } else if (msgs.length > 0) {
      const userMsg = msgs.find((m) => m.role === "user");
      const { data } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          subject,
          title: userMsg?.content.slice(0, 60) || "New conversation",
          messages: msgs,
        })
        .select("id")
        .single();

      if (data) setConversationId(data.id);
    }
  }

  // Save profile changes to Supabase
  async function updateProfile(updates: Partial<Profile>) {
    if (!userId) return;
    await supabase.from("profiles").update(updates).eq("id", userId);
  }

  // Fetch past mistakes for the current subject to include in context
  async function getMistakeContext(): Promise<string | null> {
    if (!userId) return null;

    const { data: mistakes } = await supabase
      .from("mistake_log")
      .select("mistake_summary, topic_path, frequency")
      .eq("user_id", userId)
      .eq("subject", subject)
      .gte("frequency", 2)
      .order("last_occurred_at", { ascending: false })
      .limit(5);

    if (!mistakes || mistakes.length === 0) return null;

    const mistakeList = mistakes
      .map(
        (m) =>
          `- "${m.mistake_summary}" (topics: ${m.topic_path?.join(", ") || "general"}, repeated ${m.frequency}x)`
      )
      .join("\n");

    return `\n\nThe student has previously struggled with:\n${mistakeList}\nPlease pay extra attention when covering these areas.`;
  }

  // Log a mistake
  async function logMistake(summary: string, topics: string[]) {
    if (!userId) return;

    // Check if similar mistake already exists
    const { data: existing } = await supabase
      .from("mistake_log")
      .select("*")
      .eq("user_id", userId)
      .eq("subject", subject)
      .ilike("mistake_summary", `%${summary.slice(0, 30)}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      // Increment frequency
      await supabase
        .from("mistake_log")
        .update({
          frequency: existing[0].frequency + 1,
          last_occurred_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id);
    } else {
      // Create new entry
      await supabase.from("mistake_log").insert({
        user_id: userId,
        subject,
        topic_path: topics.length > 0 ? topics : ["general"],
        mistake_summary: summary,
      });
    }
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setMistakeFeedback(null);

    try {
      const difficulty = input.length > 50 ? "complex" : "simple";

      // Get past mistakes for this subject
      const mistakeContext = await getMistakeContext();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          subject,
          difficulty,
          mistakeContext,
        }),
      });

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      const aiMessage: Message = { role: "assistant", content: data.content };
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Update game state
      const multiplier = luckySprint?.active ? luckySprint.multiplier : 1;
      const earned = data.earnedCoins * multiplier;

      setProfile((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          coins: prev.coins + earned,
          xp: prev.xp + 10,
        };
        updateProfile({ coins: updated.coins, xp: updated.xp });
        return updated;
      });

      // Lucky Sprint logic
      if (difficulty === "complex" && !luckySprint?.active && Math.random() < 0.2) {
        setLuckySprint({ active: true, multiplier: 3, questionsRemaining: 5 });
      }

      if (luckySprint?.active) {
        const remaining = luckySprint.questionsRemaining - 1;
        if (remaining <= 0) {
          setLuckySprint(null);
        } else {
          setLuckySprint({ ...luckySprint, questionsRemaining: remaining });
        }
      }

      // Save conversation
      saveConversation(finalMessages);
    } catch {
      const errorMsg: Message = {
        role: "assistant",
        content: "Sorry, I couldn't process that. Let's try again!",
      };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  }

  // Show mistake logging prompt after last AI message
  function handleMistakeLog(msgIndex: number) {
    const aiMsg = messages[msgIndex];
    if (!aiMsg || aiMsg.role !== "assistant") return;

    // Extract potential topics from the user message before this AI response
    const userMsg = messages[msgIndex - 1];
    const userContent = userMsg?.content || "the previous topic";

    logMistake(
      `Struggled with: ${userContent.slice(0, 100)}`,
      [userContent.slice(0, 40)]
    );

    setMistakeFeedback(msgIndex);
  }

  if (initialLoading) {
    return (
      <div className="h-full flex items-center justify-center max-w-2xl mx-auto px-4">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden">
            <SamoyedIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="font-bold text-lg text-white">Learning Buddy</div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <FireIcon size={12} className="text-zinc-500" />
              {profile?.streak ?? 0}-day streak
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          <div className="flex items-center gap-1 bg-amber-500/10 rounded-xl px-2.5 py-1.5 border border-amber-500/20">
            <CoinIcon size={14} className="text-amber-400" />
            <span className="text-sm font-bold text-amber-400">{profile?.coins ?? 0}</span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 rounded-xl px-2.5 py-1.5 border border-white/5">
            <StarIcon size={14} className="text-zinc-500" />
            <span className="text-sm font-semibold text-white">{profile?.xp ?? 0}</span>
          </div>

          {/* User menu — shows profile info */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white border border-zinc-700 transition-colors"
            >
              <UserIcon size={16} />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-10 z-20 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
                  <div className="px-3.5 py-3">
                    <p className="text-sm font-medium text-white truncate">
                      {profile?.display_name || "Student"}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {profile?.title || "Trainee"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Subject tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              subject === s
                ? "bg-zinc-800 text-amber-400 border border-zinc-700"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            <SubjectIcon subject={s} size={14} className="inline mr-1" /> {s}
          </button>
        ))}
      </div>

      {/* Lucky Sprint Banner */}
      {luckySprint?.active && (
        <div className="mb-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparkleIcon size={18} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400">Lucky Sprint!</span>
              <span className="text-[10px] text-zinc-400">{luckySprint.questionsRemaining} questions left</span>
            </div>
            <span className="text-lg font-extrabold text-amber-400">×{luckySprint.multiplier}</span>
          </div>
          <div className="mt-1.5 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
              style={{ width: `${(luckySprint.questionsRemaining / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <SamoyedIcon className="w-16 h-16 opacity-20 mb-4" />
            <h2 className="text-lg font-semibold text-zinc-400 mb-1">
              Ask me anything about {subject}
            </h2>
            <p className="text-sm text-zinc-600 max-w-sm">
              I&apos;ll help you understand Cambridge CIE topics. Hard questions earn more 🪙 coins!
            </p>
            <div className="flex flex-wrap gap-2 mt-5 justify-center">
              {[
                "What is electrolysis?",
                "Explain DNA replication",
                "Solve 2x² + 3x - 5 = 0",
                "What is a binary search?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs text-zinc-500 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            <div
              className={`flex items-start gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-700/50 overflow-hidden shrink-0 mt-0.5">
                  <SamoyedIcon className="w-4 h-4" />
                </div>
              )}
              <div
                className={`rounded-xl px-3.5 py-2.5 max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-zinc-800/80 rounded-tr-sm border border-zinc-700/50"
                    : "bg-zinc-900/80 rounded-tl-sm border border-zinc-700/30"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-zinc-700 flex items-center justify-center text-white border border-zinc-600 shrink-0 mt-0.5">
                  <UserIcon size={14} />
                </div>
              )}
            </div>

            {/* Mistake logging button — shows below each AI response */}
            {msg.role === "assistant" && i > 0 && mistakeFeedback !== i && (
              <div className="flex justify-start ml-9 mt-1">
                <button
                  onClick={() => handleMistakeLog(i)}
                  className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors px-2 py-0.5 rounded bg-zinc-900/50 hover:bg-red-500/10"
                >
                  <AlertIcon size={12} className="inline mr-1" /> I didn&apos;t understand this
                </button>
              </div>
            )}
            {msg.role === "assistant" && mistakeFeedback === i && (
              <div className="flex justify-start ml-9 mt-1">
                <span className="text-[10px] text-green-500 px-2 py-0.5 rounded bg-green-500/10">
                  ✓ Tracked for review
                </span>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-700/50 overflow-hidden shrink-0 mt-0.5">
              <SamoyedIcon className="w-4 h-4" />
            </div>
            <div className="bg-zinc-900/80 rounded-xl rounded-tl-sm px-4 py-3 border border-zinc-700/30">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 bg-zinc-900 rounded-xl border border-zinc-800 px-3.5 py-2.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Ask about ${subject}...`}
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center hover:bg-amber-500/20 disabled:opacity-30 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-amber-400"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
