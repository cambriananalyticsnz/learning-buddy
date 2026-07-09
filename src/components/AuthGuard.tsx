"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);

      if (!user && !pathname.startsWith("/auth")) {
        router.push("/auth/login");
      }
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user && !pathname.startsWith("/auth")) {
        router.push("/auth/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  // Auth pages render immediately (they handle auth state themselves)
  if (pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-xs text-zinc-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirecting
  if (!user) {
    return null;
  }

  // Authenticated — render children
  return <>{children}</>;
}
