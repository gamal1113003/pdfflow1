import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * orzix mark: a document sheet whose lines resolve into a forward arrow —
 * a page, moving.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <rect width="32" height="32" rx="9" fill="hsl(var(--primary))" />
      <path
        d="M11 8.5h6.4L22 13v10.5a1 1 0 0 1-1 1H11a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M17.2 8.7V13H21.6"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M7.5 16.6h11.2m0 0-3-3.1m3 3.1-3 3.1"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        className,
      )}
      aria-label="orzix home"
    >
      <LogoMark />
      {/* Five short lowercase letters carry less weight than a longer wordmark,
          so the type is set larger and tighter to balance the mark. */}
      <span className="font-display text-[1.9rem] font-bold leading-none tracking-[-0.02em] text-foreground">
        orzix
      </span>
    </Link>
  );
}
