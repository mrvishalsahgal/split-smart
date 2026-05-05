'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Trash2, Pencil } from 'lucide-react'
import type { Expense, User } from '@/lib/types'
import { useSession } from 'next-auth/react'

interface ExpenseBubbleProps {
  expense: any // Using any for now to avoid deep type issues
  index: number
  onReact: (expenseId: string, emoji: string) => void
  onDelete?: (expenseId: string) => void
  onEdit?: (expense: any) => void
}

const reactionEmojis = ['👍', '😂', '💸', '😋', '🔥']

export function ExpenseBubble({ expense, index, onReact, onDelete, onEdit }: ExpenseBubbleProps) {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const [isExpanded, setIsExpanded] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  
  const payer = expense.paidBy
  const isPaidByMe = (payer?._id || payer?.id) === currentUserId
  const myShare = expense.splits?.find((s: any) => (s.user?._id || s.user?.id) === currentUserId)
  
  const timeAgo = (expense.date || expense.createdAt) ? getTimeAgo(new Date(expense.date || expense.createdAt)) : 'recently'
  
  const canModify = isPaidByMe && (expense.date || expense.createdAt) && 
    (new Date().getTime() - new Date(expense.date || expense.createdAt).getTime()) < 24 * 60 * 60 * 1000
  
  const payerInitials = payer?.name
    ? payer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : '??'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`flex gap-3 group ${isPaidByMe ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${expense?.paidBy?.color || 'bg-primary'} text-primary-foreground`}>
        {payerInitials}
      </div>

      {/* Bubble */}
      <div className={`flex-1 max-w-[80%] ${isPaidByMe ? 'items-end' : 'items-start'}`}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          onDoubleClick={() => setShowReactions(true)}
          className={`glass-card rounded-2xl p-4 cursor-pointer ${
            isPaidByMe 
              ? 'rounded-tr-md bg-primary/10' 
              : 'rounded-tl-md'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{expense.emoji}</span>
              <div>
                <p className="font-medium">{expense?.description || expense?.title || 'Expense'}</p>
                <p className="text-xs text-muted-foreground">
                  {isPaidByMe ? 'You' : (expense?.paidBy?.name || 'Someone')} paid • {timeAgo}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">${(expense?.amount ?? 0).toFixed(2)}</p>
              {myShare && !isPaidByMe && myShare.amountOwed > 0 && (
                <p className={`text-xs font-semibold ${myShare.hasSettled ? 'text-positive' : 'text-negative'}`}>
                  {myShare.hasSettled ? 'Paid' : `You owe $${myShare.amountOwed.toFixed(2)}`}
                </p>
              )}
              {canModify && (
                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-all">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(expense)
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Are you sure you want to delete this expense?')) {
                          onDelete(expense.id)
                        }
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-negative hover:bg-negative/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expand button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
            <span>Split {(expense.splits?.length || 0)} ways</span>
          </button>

          {/* Split breakdown */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                  {expense.splits?.map((split: any) => (
                    <SplitRow
                      key={split.user?._id || split.user?.id}
                      user={split.user}
                      amount={split.amountOwed}
                      settled={split.hasSettled}
                      isPayer={(split.user?._id || split.user?.id) === (payer?._id || payer?.id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reactions */}
          {(expense?.reactions || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {expense.reactions.map((reaction: any, i: number) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onReact(expense.id, reaction.emoji)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-sm hover:bg-secondary/80 transition-colors border border-white/5"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-xs text-muted-foreground">{reaction.users?.length || 0}</span>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Reaction picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="flex gap-1 mt-2 p-2 glass-card rounded-full"
            >
              {reactionEmojis.map(emoji => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    onReact(expense.id, emoji)
                    setShowReactions(false)
                  }}
                  className="w-10 h-10 rounded-full hover:bg-secondary flex items-center justify-center text-xl transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function SplitRow({ 
  user, 
  amount, 
  isPayer = false, 
  settled 
}: { 
  user: any
  amount: number
  isPayer?: boolean
  settled: boolean
}) {
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : '??'

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${user?.color || 'bg-primary'} text-primary-foreground`}>
          {initials}
        </div>
        <span className="text-sm">{user?.name || 'Unknown'}</span>
        {isPayer && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-positive/20 text-positive">
            paid
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${settled ? 'text-positive' : 'text-muted-foreground'}`}>
          ${(amount ?? 0).toFixed(2)}
        </span>
        {settled && !isPayer && (
          <Check className="w-4 h-4 text-positive" />
        )}
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
