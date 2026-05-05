'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface AnimatedBalanceProps {
  amount: number
  showPulse?: boolean
}

export function AnimatedBalance({ amount, showPulse = true }: AnimatedBalanceProps) {
  const [displayAmount, setDisplayAmount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const isPositive = amount > 0
  const isNegative = amount < 0
  const isNeutral = amount === 0

  useEffect(() => {
    setIsAnimating(true)
    const duration = 1500
    const steps = 60
    const increment = amount / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = (step / steps) * amount
      setDisplayAmount(current)
      
      if (step >= steps) {
        clearInterval(timer)
        setDisplayAmount(amount)
        setTimeout(() => setIsAnimating(false), 500)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [amount])

  const getStatusText = () => {
    if (isNeutral) return "All settled up!"
    if (isPositive) return "You are owed"
    return "You owe"
  }

  const getIcon = () => {
    if (isNeutral) return <Minus className="w-6 h-6" />
    if (isPositive) return <TrendingUp className="w-6 h-6" />
    return <TrendingDown className="w-6 h-6" />
  }

  const getFontSize = () => {
    const digits = (Math.abs(amount) || 0).toFixed(0).length
    if (digits > 8) return 'text-4xl md:text-3xl lg:text-4xl'
    if (digits > 6) return 'text-5xl md:text-4xl lg:text-5xl'
    if (digits > 4) return 'text-6xl md:text-5xl lg:text-6xl'
    return 'text-7xl md:text-5xl lg:text-6xl'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex flex-col items-center justify-center py-8 w-full max-w-full"
    >
      {/* Background glow effect */}
      <AnimatePresence>
        {showPulse && !isNeutral && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`absolute inset-0 rounded-3xl blur-3xl ${
              isPositive ? 'bg-positive/20' : 'bg-negative/20'
            }`}
          />
        )}
      </AnimatePresence>

      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
          isNeutral 
            ? 'bg-neutral/20 text-neutral-foreground' 
            : isPositive 
              ? 'bg-positive/20 text-positive' 
              : 'bg-negative/20 text-negative'
        }`}
      >
        {getIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </motion.div>

      <motion.div
        className="relative z-10 w-full text-center px-4"
        animate={isAnimating ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <span className={`${getFontSize()} font-black tracking-tighter leading-none inline-block max-w-full break-all ${
          isNeutral 
            ? 'text-muted-foreground' 
            : isPositive 
              ? 'text-positive' 
              : 'text-negative'
        }`}>
          {isNegative ? '-' : isPositive ? '+' : ''}$
          <motion.span
            key={displayAmount}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
          >
            {(Math.abs(displayAmount ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.span>
        </span>
      </motion.div>

      {/* Net balance label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mt-4 text-lg"
      >
        Net Balance
      </motion.p>

      {/* Emotional feedback */}
      <AnimatePresence>
        {isNeutral && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 text-center"
          >
            <p className="text-2xl mb-1">No debts, just vibes</p>
            <p className="text-muted-foreground">You&apos;re all caught up!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
