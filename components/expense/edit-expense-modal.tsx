'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Users, ChevronRight, ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { categories } from '@/lib/constants'

interface EditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  expense: any
  groupMembers: any[]
}

interface CustomSplitAmounts {
  [userId: string]: string
}

export function EditExpenseModal({ isOpen, onClose, onUpdate, expense, groupMembers }: EditExpenseModalProps) {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal')
  const [customAmounts, setCustomAmounts] = useState<CustomSplitAmounts>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(0) // 0: Info, 1: Split

  useEffect(() => {
    if (isOpen && expense) {
      setDescription(expense.description || expense.title || '')
      setAmount(expense.amount?.toString() || '')
      setSelectedCategory(expense.category?.toLowerCase() || 'other')
      
      // Initialize members and splits
      const memberIds = (expense.splits || []).map((s: any) => s.user?._id || s.user?.id || s.user)
      setSelectedMembers(memberIds)
      
      // Check if it was a custom split
      const isCustom = expense.splits?.some((s: any, i: number, arr: any[]) => {
        if (i === 0) return false
        return Math.abs(s.amountOwed - arr[0].amountOwed) > 0.01
      })
      
      setSplitType(isCustom ? 'custom' : 'equal')
      
      const amounts: CustomSplitAmounts = {}
      expense.splits?.forEach((s: any) => {
        amounts[s.user?._id || s.user?.id || s.user] = s.amountOwed.toString()
      })
      setCustomAmounts(amounts)
      
      setStep(0)
    }
  }, [isOpen, expense])

  const totalAmount = parseFloat(amount || '0')
  const customTotal = Object.values(customAmounts).reduce((sum, val) => sum + parseFloat(val || '0'), 0)
  const remainingAmount = totalAmount - customTotal
  const isCustomSplitValid = splitType === 'equal' || Math.abs(remainingAmount) < 0.01

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const splitData = selectedMembers.map(userId => ({
        user: userId,
        amountOwed: splitType === 'equal' 
          ? totalAmount / selectedMembers.length 
          : parseFloat(customAmounts[userId] || '0'),
        hasSettled: userId === (expense.paidBy?._id || expense.paidBy?.id || expense.paidBy) // Keep payer settled
      }))

      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: description,
          description,
          amount: totalAmount,
          category: selectedCategory,
          splits: splitData
        })
      })

      if (!response.ok) throw new Error('Failed to update expense')
      
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Update expense error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleMember = (id: string) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter(m => m !== id))
      const newAmounts = { ...customAmounts }
      delete newAmounts[id]
      setCustomAmounts(newAmounts)
    } else {
      setSelectedMembers([...selectedMembers, id])
    }
  }

  if (!expense) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full sm:w-[480px] bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button onClick={() => setStep(0)} className="p-2 rounded-full hover:bg-secondary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-lg font-semibold text-foreground">
                  {step === 0 ? 'Edit Details' : 'Adjust Split'}
                </h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {step === 0 ? (
                <>
                  {/* Amount */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">Amount</p>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-3xl font-bold text-muted-foreground">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="text-5xl font-bold bg-transparent outline-none w-40 text-center text-foreground"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full py-3 px-4 rounded-xl bg-secondary border border-border/50 outline-none focus:ring-2 ring-primary/50 transition-all text-foreground"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all border ${
                            selectedCategory === cat.id
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-secondary/50 border-transparent hover:border-border text-muted-foreground'
                          }`}
                        >
                          <span className="text-xl">{cat.emoji}</span>
                          <span className="text-[10px] font-bold uppercase">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Split Type Toggle */}
                  <div className="flex gap-1 p-1 bg-secondary rounded-xl">
                    <button
                      onClick={() => setSplitType('equal')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        splitType === 'equal' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      Equal
                    </button>
                    <button
                      onClick={() => setSplitType('custom')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        splitType === 'custom' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Members List */}
                  <div className="space-y-2">
                    {groupMembers.map((member) => {
                      const memberId = member._id || member.id
                      const isSelected = selectedMembers.includes(memberId)
                      const initials = member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                      const perPersonEqual = totalAmount / selectedMembers.length

                      return (
                        <div key={memberId} className={`rounded-xl overflow-hidden border transition-all ${
                          isSelected ? 'bg-primary/5 border-primary/20' : 'bg-secondary/30 border-transparent'
                        }`}>
                          <button
                            onClick={() => toggleMember(memberId)}
                            className="w-full flex items-center gap-3 p-3"
                          >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${member.color || 'bg-primary'} text-primary-foreground`}>
                              {initials}
                            </div>
                            <span className="flex-1 text-left font-medium text-sm text-foreground">
                              {memberId === currentUserId ? 'You' : member.name}
                            </span>
                            {isSelected && splitType === 'equal' && (
                              <span className="text-xs text-muted-foreground">${perPersonEqual.toFixed(2)}</span>
                            )}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                          </button>
                          
                          {isSelected && splitType === 'custom' && (
                            <div className="px-3 pb-3">
                              <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border/50">
                                <span className="text-muted-foreground text-sm">$</span>
                                <input
                                  type="number"
                                  value={customAmounts[memberId] || ''}
                                  onChange={(e) => setCustomAmounts({ ...customAmounts, [memberId]: e.target.value })}
                                  placeholder="0.00"
                                  className="flex-1 bg-transparent outline-none text-sm font-medium text-foreground"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border/50 bg-secondary/30">
              {step === 0 ? (
                <button
                  onClick={() => setStep(1)}
                  disabled={!amount || !description}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  Continue to Split <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="space-y-4">
                  {splitType === 'custom' && !isCustomSplitValid && (
                    <p className="text-center text-xs text-negative font-medium">
                      Total split (${customTotal.toFixed(2)}) doesn't match amount (${totalAmount.toFixed(2)})
                    </p>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={selectedMembers.length === 0 || !isCustomSplitValid || isSubmitting}
                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
