"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Subject = "Chemistry" | "Biology" | "Math" | "Computer Science";

const SUBJECTS: Subject[] = ["Chemistry", "Biology", "Math", "Computer Science"];
const SUBJECT_EMOJIS: Record<Subject, string> = {
  Chemistry: "⚡",
  Biology: "🧬",
  Math: "📐",
  "Computer Science": "💻",
};

function SamoyedIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <ellipse cx="28" cy="25" rx="14" ry="12" fill="#f5f5f5" />
      <ellipse cx="72" cy="25" rx="14" ry="12" fill="#f5f5f5" />
      <ellipse cx="50" cy="55" rx="32" ry="28" fill="#ffffff" />
      <ellipse cx="38" cy="48" rx="4.5" ry="5" fill="#1a1a1a" />
      <ellipse cx="62" cy="48" rx="4.5" ry="5" fill="#1a1a1a" />
      <circle cx="39.5" cy="46" r="1.8" fill="#ffffff" />
      <circle cx="63.5" cy="46" r="1.8" fill="#ffffff" />
      <ellipse cx="50" cy="58" rx="5" ry="3.5" fill="#1a1a1a" />
      <path d="M 41 62 Q 50 70 59 62" stroke="#1a1a1a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState<Subject>("Chemistry");
  const [isLoading, setIsLoading] = useState(false);
  const [coins, setCoins] = useState(120);
  const [xp, setXp] = useState(340);
  const [streak] = useState(3);
  const [luckySprint, setLuckySprint] = useState<{
    active: boolean;
    multiplier: number;
    questionsRemaining: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const difficulty = input.length > 50 ? "complex" : "simple";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          subject,
          difficulty,
        }),
      });

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      const aiMessage: Message = { role: "assistant", content: data.content };
      setMessages((prev) => [...prev, aiMessage]);

      const multiplier = luckySprint?.active ? luckySprint.multiplier : 1;
      const earned = data.earnedCoins * multiplier;
      setCoins((prev) => prev + earned);

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

      setXp((prev) => prev + 10);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that. Let's try again!" },
      ]);
    } finally {
      setIsLoading(false);
    }
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
            <div className="text-xs text-zinc-500">🔥 {streak}-day streak</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-500/10 rounded-xl px-2.5 py-1.5 border border-amber-500/20">
            <span className="text-amber-400 text-sm">🪙</span>
            <span className="text-sm font-bold text-amber-400">{coins}</span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 rounded-xl px-2.5 py-1.5 border border-white/5">
            <span className="text-zinc-500 text-sm">✦</span>
            <span className="text-sm font-semibold text-white">{xp}</span>
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
            {SUBJECT_EMOJIS[s]} {s}
          </button>
        ))}
      </div>

      {/* Lucky Sprint Banner */}
      {luckySprint?.active && (
        <div className="mb-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-base">🍀</span>
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
          <div
            key={i}
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
              <p className="text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-zinc-700 flex items-center justify-center text-xs text-white border border-zinc-600 shrink-0 mt-0.5">
                🧑
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
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={`Ask about ${subject}...`}
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center hover:bg-amber-500/20 disabled:opacity-30 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
