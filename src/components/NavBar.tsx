"use client";

import { usePathname } from "next/navigation";
import { MessageIcon, ClockIcon, TargetIcon, CalendarIcon } from "@/components/Icons";

const NAV_ITEMS = [
  { href: "/", label: "Chat", Icon: MessageIcon },
  { href: "/history", label: "History", Icon: ClockIcon },
  { href: "/mistakes", label: "Mistakes", Icon: TargetIcon },
  { href: "/planner", label: "Planner", Icon: CalendarIcon },
];

export default function NavBar() {
  const pathname = usePathname();

  // Hide on auth pages
  if (pathname.startsWith("/auth")) return null;

  return (
    <nav className="flex items-center justify-around px-2 py-1.5 bg-zinc-950 border-t border-zinc-800">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
              isActive
                ? "text-amber-400 bg-amber-500/10"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <item.Icon size={18} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
