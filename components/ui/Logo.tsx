import { cn } from "@/lib/utils";

/** Flow State wordmark: Kaushan Script in the midnight→teal gradient, no icon. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        // pb/pr keep the script's swashes inside the clipped gradient box.
        "inline-block select-none bg-gradient-to-r from-[#0b1d3a] via-[#0f6e78] to-[#1a8fa3] bg-clip-text pb-1 pr-1 font-[family-name:var(--font-wordmark)] text-[1.75rem] leading-none text-transparent",
        className,
      )}
    >
      Flowstate
    </span>
  );
}
