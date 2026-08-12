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
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
            {sub && (
              <p className={`mt-1 font-mono text-xs ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                {positive ? '▲' : '▼'} {sub}
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/15 text-emerald-400">
            <Icon size={18} />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
