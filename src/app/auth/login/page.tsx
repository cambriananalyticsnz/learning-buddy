"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function SamoyedIcon({ className = "w-10 h-10" }: { className?: string }) {
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 mb-4">
            <SamoyedIcon className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-bold text-white">Learning Buddy</h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to continue learning</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label htmlFor="email" className="text-xs font-medium text-zinc-400 block mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-xs font-medium text-zinc-400 block mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-xs text-zinc-600 text-center mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-amber-400 hover:text-amber-300 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
