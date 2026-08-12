import { motion } from 'framer-motion'
import Card from '../ui/Card'

export default function StatCard({ icon: Icon, label, value, sub, positive, index, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + index * 0.07, duration: 0.45, ease: 'easeOut' }}
    >
      <Card hover className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-ink-faint font-medium">{label}</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
            {sub && (
              <p className={`mt-1 font-mono text-xs ${positive ? 'text-up' : 'text-down'}`}>
                {positive ? '▲' : '▼'} {sub}
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-up/20 to-up/10 border border-up/15 text-up">
            <Icon size={18} />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
