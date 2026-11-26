import * as React from "react"
import { motion } from 'framer-motion'
import { cn } from "cn"

/*
 * MARKETIQ Card — shadcn-compatible API built on the app's `card` CSS
 * class (dark slate surface + brand border). The `Card` root keeps the
 * hover scale behaviour the old component had.
 */
function Card({ className, hover = false, ...props }) {
  return (
    <motion.div
      data-slot="card"
      whileHover={hover ? { scale: 1.01 } : undefined}
      transition={{ duration: 0.25 }}
      className={cn("card rounded-xl border bg-card text-card-foreground", className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 p-6 has-[data-slot=card-title]:gap-2 [&>[data-slot=card-description]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-semibold leading-none", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }) {
  return (
    <div data-slot="card-content" className={cn("p-6 pt-0", className)} {...props} />
  )
}

function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
export default Card
