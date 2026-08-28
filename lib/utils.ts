/** Minimal className joiner — no clsx dependency for a handful of conditionals. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
