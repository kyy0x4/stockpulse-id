import { motion } from 'framer-motion'

export default function ProgressBar({ value, color = '#22c55e', className = '' }) {
  return (
    <div className={`h-1.5 w-full rounded-full bg-white/8 overflow-hidden ${className}`}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
    </div>
  )
}
