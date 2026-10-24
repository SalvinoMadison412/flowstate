import { forwardRef } from "react";
import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "filled" | "accent" | "outline" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-btn font-medium transition-[color,background-color,transform] duration-300 ease-[cubic-bezier(0.075,0.82,0.165,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  // Primary CTA: ink fill.
  filled: "bg-text-primary text-bg hover:bg-text-primary/85",
  // Second CTA: cyan fill with dark text (cyan is never text on white).
  accent: "bg-accent text-text-primary hover:bg-accent/85",
  outline: "bg-surface text-text-primary hover:bg-border-subtle",
  ghost: "bg-surface text-text-primary hover:bg-border-subtle",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-[18px] text-lg",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export const Button = forwardRef<HTMLButtonElement & HTMLAnchorElement, ButtonProps>(
  ({ variant = "filled", size = "md", className, children, ...props }, ref) => {
    const classes = cn(base, variants[variant], sizes[size], className);

    if ("href" in props && props.href !== undefined) {
      const { href, ...rest } = props;
      // Client-side nav keeps the shared layout, and any live call, mounted.
      if (href.startsWith("/"))
        return (
          <Link ref={ref} href={href} className={classes} {...rest}>
            {children}
          </Link>
        );
      return (
        <a ref={ref} href={href} className={classes} {...rest}>
          {children}
        </a>
      );
    }

    return (
      <button ref={ref} className={classes} {...(props as ButtonAsButton)}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
