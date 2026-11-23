import { motion } from 'framer-motion'

export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.01 } : undefined}
      transition={{ duration: 0.25 }}
      className={`card ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}