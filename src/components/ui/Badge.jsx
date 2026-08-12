const tones = {
  green: 'bg-up/10 text-up border-up/20',
  red: 'bg-down/10 text-down border-down/20',
  amber: 'bg-warning/10 text-warning border-warning/20',
  blue: 'bg-info/10 text-info border-info/20',
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  neutral: 'bg-card text-ink/70 border-line-strong',
}

export default function Badge({ tone = 'neutral', children, className = '', dot = false }) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border'
  return (
    <span className={`${base} ${tones[tone]} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
