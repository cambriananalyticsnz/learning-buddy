"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SamoyedIcon from "@/components/SamoyedIcon";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || "Student",
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If sign-up succeeded, create the user's profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          display_name: displayName || "Student",
          coins: 100,
          xp: 0,
          streak: 0,
          title: "Trainee",
          icon_id: "samoyed-basic",
        });

      if (!profileError) {
        // Auto-assign the free starting items
        await supabase.from("user_items").insert([
          { user_id: data.user.id, item_id: "title-trainee" },
          { user_id: data.user.id, item_id: "icon-samoyed-basic" },
        ]);
      }
    }

    // Check if user was auto-confirmed or needs email confirmation
    if (data.session) {
      // Auto-confirmed (email confirmation disabled)
      router.push("/");
      router.refresh();
    } else {
      // Needs email confirmation
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 mb-4 mx-auto">
            <span className="text-2xl">✉️</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-sm text-zinc-500">
            We sent a confirmation link to <strong className="text-zinc-300">{email}</strong>.
            Click the link to activate your account.
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-6 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5 mb-4">
            <SamoyedIcon className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-bold text-white">Create Account</h1>
          <p className="text-sm text-zinc-500 mt-1">Start your learning journey</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <label htmlFor="displayName" className="text-xs font-medium text-zinc-400 block mb-1">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>

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
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
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
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-xs text-zinc-600 text-center mt-5">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
