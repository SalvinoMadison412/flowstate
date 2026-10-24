"use client";

import { useVoiceCall } from "@/lib/useVoiceCall";
import { cn } from "@/lib/utils";

/** Red hang-up button, shown only while a call is connecting or live. */
export function EndCallButton({ className }: { className?: string }) {
  const { status, stop } = useVoiceCall();
  if (status !== "connecting" && status !== "live") return null;

  return (
    <button
      type="button"
      onClick={stop}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-red-700 px-[18px] text-lg font-medium text-white transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 rotate-[135deg]" fill="currentColor">
        <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1l-2.2 2.23Z" />
      </svg>
      End call
    </button>
  );
}
