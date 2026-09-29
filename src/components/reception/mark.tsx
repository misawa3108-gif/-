import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M7 22c5.4-1.1 8.4-7 12.6-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-primary-foreground"
      />
      <circle cx="22.4" cy="12.2" r="2.4" className="fill-primary-foreground" />
    </svg>
  );
}
