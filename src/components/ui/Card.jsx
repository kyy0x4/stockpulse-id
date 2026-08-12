import { motion } from 'framer-motion'

export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ duration: 0.25 }}
      className={`glass rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
