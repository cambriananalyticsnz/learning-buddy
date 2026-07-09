export default function SamoyedIcon({ className = "w-6 h-6" }: { className?: string }) {
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
