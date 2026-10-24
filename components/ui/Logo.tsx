import { cn } from "@/lib/utils";

type LogoProps = {
  /** "full" = icon + wordmark, "icon" = F mark only (favicon / avatar crop). */
  variant?: "full" | "icon";
  className?: string;
  /** Accent the circuit dot in cyan instead of monochrome. Off by default. */
  accentDot?: boolean;
};

/**
 * Flow State logo mark: white-on-transparent PNG (public/logo-mark.png); the
 * `logo-mark` class inverts it on light pages (see globals.css). `accentDot` is kept for callers but no longer applies.
 */
export function FlowStateIcon({
  className,
}: {
  className?: string;
  accentDot?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-mark.png"
      alt="Flow State"
      width={512}
      height={512}
      className={cn("logo-mark h-8 w-8 object-contain", className)}
    />
  );
}

export function Logo({ variant = "full", className, accentDot = false }: LogoProps) {
  if (variant === "icon") {
    return <FlowStateIcon className={className} accentDot={accentDot} />;
  }

  return (
    <span
      className={cn(
        "inline-flex select-none items-center gap-2.5 text-text-primary",
        className,
      )}
    >
      <FlowStateIcon className="h-9 w-9 shrink-0" />
      <span className="text-[1.35rem] font-semibold leading-none tracking-tight2">
        Flowstate
      </span>
    </span>
  );
}
