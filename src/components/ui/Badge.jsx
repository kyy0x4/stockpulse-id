import * as React from "react"
import { cn } from "cn"

/*
 * MARKETIQ Badge — extends shadcn with the legacy `tone` API that the
 * whole app already uses (green/red/amber/blue/…). Also supports the
 * standard shadcn `variant` prop so both usages work.
 */
const toneMap = {
  green: "bg-up/10 text-up border-up/20",
  red: "bg-down/10 text-down border-down/20",
  amber: "bg-hold/10 text-hold border-hold/20",
  yellow: "bg-hold/10 text-hold border-hold/20",
  blue: "bg-accent/10 text-accent border-accent/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  neutral: "bg-card text-ink/70 border-line-strong",
}

function Badge({ tone, variant = "default", className = "", dot = false, ...props }) {
  // When a MARKETIQ tone is provided, use it; otherwise fall back to shadcn variant styling.
  const classes = tone
    ? cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-all duration-200",
        toneMap[tone] || toneMap.neutral,
        className
      )
    : cn(
        "inline-flex w-fit shrink-0 items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all",
        variant === "default" && "bg-primary text-primary-foreground border-transparent",
        variant === "secondary" && "bg-secondary text-secondary-foreground border-transparent",
        variant === "destructive" && "bg-destructive text-destructive-foreground border-transparent",
        variant === "outline" && "border text-foreground bg-transparent",
        className
      )

  return (
    <span data-slot="badge" className={classes} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {props.children}
    </span>
  )
}

export { Badge }
export default Badge
