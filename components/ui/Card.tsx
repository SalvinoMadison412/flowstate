import { cn } from "@/lib/utils";

type CardProps = {
  className?: string;
  children: React.ReactNode;
  /** Elevate + lift + brighten border on hover. */
  interactive?: boolean;
  /** Use the elevated surface token instead of the base card surface. */
  elevated?: boolean;
};

export function Card({
  className,
  children,
  interactive = false,
  elevated = false,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-subtle p-6",
        elevated ? "bg-surface-elevated" : "bg-surface",
        interactive &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-text-muted hover:shadow-card-lift",
        className,
      )}
    >
      {children}
    </div>
  );
}
