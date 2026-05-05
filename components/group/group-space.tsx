'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Users, Settings, PieChart, MoreHorizontal, Edit2, BellOff, LogOut, Loader2, ChevronRight, Archive, ArchiveRestore, Activity } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import useSWR, { useSWRConfig } from 'swr'
import { fetcher } from '@/lib/fetcher'
import { ExpenseBubble } from './expense-bubble'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { EditExpenseModal } from '@/components/expense/edit-expense-modal'
import { categories } from '@/lib/constants'
import type { Group, Expense, Balance } from '@/lib/types'

interface GroupSpaceProps {
  group: Group
  onBack: () => void
  onAddExpense: () => void
  onAddMembers: () => void
}

export function GroupSpace({ group, onBack, onAddExpense, onAddMembers }: GroupSpaceProps) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'stats'>('expenses')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const { data: expensesData, isLoading: expensesLoading } = useSWR<any[]>(`/api/groups/${group.id}/expenses`, fetcher)
  const { data: groupBalancesData, isLoading: balancesLoading } = useSWR<Balance[]>(`/api/groups/${group.id}/balances`, fetcher)

  const expenses = (expensesData || []).map(e => ({
    id: e._id,
    title: e.title,
    amount: e.amount,
    paidBy: e.paidBy,
    splits: e.splits.map((s: any) => ({
      user: s.user,
      amountOwed: s.amountOwed,
      hasSettled: s.hasSettled
    })),
    category: e.category.toLowerCase(),
    emoji: categories.find(c => c.id === e.category.toLowerCase())?.emoji || '💰',
    date: e.createdAt,
    reactions: (e.reactions || []).reduce((acc: any[], curr: any) => {
      const existing = acc.find(r => r.emoji === curr.emoji)
      if (existing) {
        existing.users.push(curr.user)
      } else {
        acc.push({ emoji: curr.emoji, users: [curr.user] })
      }
      return acc
    }, [])
  })) as any[] 

  // Group expenses by date
  const groupedExpenses = expenses.reduce((acc: any[], expense) => {
    const date = new Date(expense.date)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    let label = ''
    if (date.toDateString() === today.toDateString()) {
      label = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday'
    } else {
      label = date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    }

    const lastGroup = acc[acc.length - 1]
    if (lastGroup && lastGroup.label === label) {
      lastGroup.items.push(expense)
    } else {
      acc.push({ label, items: [expense] })
    }
    return acc
  }, [])

  const { mutate } = useSWRConfig()

  const handleReact = async (expenseId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      })
      if (response.ok) {
        mutate(`/api/groups/${group.id}/expenses`)
      }
    } catch (error) {
      console.error('Reaction error:', error)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        mutate(`/api/groups/${group.id}/expenses`)
        mutate(`/api/groups/${group.id}/balances`)
        mutate('/api/groups') // Update main dashboard balances too
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete expense')
      }
    } catch (error) {
      console.error('Delete expense error:', error)
    }
  }

  const handleEditUpdate = () => {
    mutate(`/api/groups/${group.id}/expenses`)
    mutate(`/api/groups/${group.id}/balances`)
  }

  const getBalanceFontSize = (balance: number) => {
    const amountStr = Math.abs(balance).toFixed(2)
    if (amountStr.length > 12) return 'text-xl'
    if (amountStr.length > 10) return 'text-2xl'
    if (amountStr.length > 8) return 'text-3xl'
    return 'text-4xl'
  }

  const handleArchive = async () => {
    setIsArchiving(true)
    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !group.isArchived })
      })
      if (response.ok) {
        mutate('/api/groups')
        onBack()
      }
    } catch (error) {
      console.error('Archive error:', error)
    } finally {
      setIsArchiving(false)
      setShowArchiveConfirm(false)
    }
  }

  const isPositive = (group.userBalance || 0) > 0
  const isNegative = (group.userBalance || 0) < 0

  return (
    <div className="min-h-screen flex flex-col md:pb-8">
      {/* Mobile Header - Hidden on Desktop */}
      <header className="md:hidden sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-4">
          {/* Top row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl">
                  {group.emoji}
                </div>
                <div>
                  <h1 className="font-semibold">{group.name}</h1>
                  <button 
                    onClick={onAddMembers}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {group.members?.length || 0} members
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={onAddMembers}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Users className="w-5 h-5" />
              </motion.button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl border-border bg-card shadow-xl">
                  <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg p-2 hover:bg-secondary">
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                    <span>Edit Group</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg p-2 hover:bg-secondary">
                    <BellOff className="w-4 h-4 text-muted-foreground" />
                    <span>Mute Notifications</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowArchiveConfirm(true)}
                    className="gap-2 cursor-pointer rounded-lg p-2 hover:bg-secondary"
                  >
                    <Archive className="w-4 h-4 text-muted-foreground" />
                    <span>{group.isArchived ? 'Unarchive Group' : 'Archive Group'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowLeaveConfirm(true)}
                    className="gap-2 cursor-pointer rounded-lg p-2 hover:bg-negative/20 text-negative focus:text-negative focus:bg-negative/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Leave Group</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Balance summary */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl ${
              (group.userBalance || 0) === 0
                ? 'bg-secondary'
                : isPositive
                  ? 'bg-positive/10'
                  : 'bg-negative/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your balance in this group</span>
              <span className={`${getBalanceFontSize(group.userBalance || 0)} font-bold ${
                (group.userBalance || 0) === 0
                  ? 'text-muted-foreground'
                  : isPositive
                    ? 'text-positive'
                    : 'text-negative'
              }`}>
                {isPositive && '+'}
                {isNegative && '-'}
                ${Math.abs(group.userBalance ?? 0).toFixed(2)}
              </span>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {(['expenses', 'balances', 'stats'] as const).map(tab => (
              <motion.button
                key={tab}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      {/* Desktop Header - Visible only on Desktop */}
      <header className="hidden md:block sticky top-0 z-50 bg-background/50 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="p-3 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-3xl shadow-lg shadow-black/5">
                {group.emoji}
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{group.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {group.members?.length || 0} members
                  </span>
                  <div className="w-1 h-1 rounded-full bg-border" />
                  <span className={`text-sm font-bold ${isPositive ? 'text-positive' : isNegative ? 'text-negative' : 'text-muted-foreground'}`}>
                    {isPositive ? `You are owed $${group.userBalance?.toFixed(2)}` : isNegative ? `You owe $${Math.abs(group.userBalance || 0).toFixed(2)}` : 'You are all settled up'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddMembers}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-secondary/50 hover:bg-secondary font-bold transition-all"
            >
              <Users className="w-5 h-5" />
              Manage Members
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddExpense}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Expense
            </motion.button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <MoreHorizontal className="w-6 h-6" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-border bg-card shadow-2xl">
                <DropdownMenuItem className="gap-3 cursor-pointer rounded-xl p-3 hover:bg-secondary font-medium">
                  <Edit2 className="w-5 h-5 text-muted-foreground" />
                  <span>Edit Group</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowArchiveConfirm(true)}
                  className="gap-3 cursor-pointer rounded-xl p-3 hover:bg-secondary font-medium"
                >
                  <Archive className="w-5 h-5 text-muted-foreground" />
                  <span>{group.isArchived ? 'Unarchive Group' : 'Archive Group'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowLeaveConfirm(true)}
                  className="gap-3 cursor-pointer rounded-xl p-3 hover:bg-negative/10 text-negative font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Leave Group</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 pt-2 md:pt-10 pb-10">
        {/* Desktop Layout (Grid) */}
        <div className="hidden md:grid grid-cols-12 gap-10 items-start">
          {/* Left Column: Expenses */}
          <div className="md:col-span-7 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-0">
              <Activity className="w-5 h-5 text-primary" />
              Expenses
            </h2>

            <div className="space-y-0">
              {group.isArchived && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-secondary/30 border border-dashed border-border flex items-center gap-3 text-muted-foreground"
                >
                  <Archive className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-medium">This group is archived and in read-only mode.</p>
                </motion.div>
              )}

              {groupedExpenses.map((group, groupIdx) => (
                <div key={group.label}>
                  <div className={`flex items-center gap-4 ${groupIdx === 0 ? 'pt-2 pb-4' : 'pt-8 pb-4'}`}>
                    <div className="h-px flex-1 bg-border/40" />
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {group.label}
                    </span>
                    <div className="h-px flex-1 bg-border/40" />
                  </div>
                  <div className="space-y-4">
                    {group.items.map((expense, index) => (
                      <ExpenseBubble
                        key={expense.id}
                        expense={expense}
                        index={index}
                        onReact={handleReact}
                        onDelete={handleDeleteExpense}
                        onEdit={(exp) => {
                          setEditingExpense(exp)
                          setIsEditModalOpen(true)
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {expenses.length === 0 && !expensesLoading && (
                <div className="text-center py-20 glass-card rounded-3xl border-dashed">
                  <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
                    <Plus className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-bold">No expenses yet</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mt-2 text-sm">Start splitting expenses with your group members to see them here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Insights */}
          <div className="md:col-span-5 sticky top-32 space-y-8">
            <div className="glass-card rounded-3xl p-8 border border-primary/5 shadow-2xl shadow-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-accent" />
                Group Insights
              </h3>
              <div className="space-y-8">
                <GroupBalances group={group} />
                <div className="pt-8 border-t border-border/50">
                  <GroupStats group={group} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout (Tabs) - Restored to original state */}
        <div className="md:hidden">
          <AnimatePresence mode="wait">
            {group.isArchived && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 rounded-2xl bg-secondary/50 border border-dashed border-border flex flex-col items-center text-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                  <Archive className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-bold text-sm">Group Archived</p>
                  <p className="text-xs text-muted-foreground">This group is in read-only mode.</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'expenses' && (
              <motion.div
                key="expenses"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
              <div className="space-y-0">
                {groupedExpenses.map((group, groupIdx) => (
                  <div key={group.label}>
                    <div className={`flex items-center gap-4 ${groupIdx === 0 ? 'pt-2 pb-4' : 'pt-8 pb-4'}`}>
                      <div className="h-px flex-1 bg-border/40" />
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {group.label}
                      </span>
                      <div className="h-px flex-1 bg-border/40" />
                    </div>
                    <div className="space-y-4">
                      {group.items.map((expense, index) => (
                        <ExpenseBubble
                          key={expense.id}
                          expense={expense}
                          index={index}
                          onReact={handleReact}
                          onDelete={handleDeleteExpense}
                          onEdit={(exp) => {
                            setEditingExpense(exp)
                            setIsEditModalOpen(true)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
                {expenses.length === 0 && !expensesLoading && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No expenses yet.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'balances' && (
              <motion.div
                key="balances"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <GroupBalances group={group} />
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <GroupStats group={group} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Add Button - Mobile Only */}
      {!group.isArchived && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onAddExpense}
          className="md:hidden fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-2xl flex items-center justify-center z-50"
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      )}

      {/* Confirm Leave Modal */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={async () => {
          setIsLeaving(true)
          try {
            const response = await fetch(`/api/groups/${group.id}/leave`, { method: 'POST' })
            if (response.ok) {
              mutate('/api/groups')
              onBack()
            }
          } catch (error) {
            console.error('Leave group error:', error)
          } finally {
            setIsLeaving(false)
            setShowLeaveConfirm(false)
          }
        }}
        title="Leave Group?"
        message={`Are you sure you want to leave ${group.name}? You will no longer be able to see expenses or balances.`}
        confirmText="Leave Group"
        variant="danger"
        isLoading={isLeaving}
      />

      {/* Confirm Archive Modal */}
      <ConfirmModal
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={handleArchive}
        title={group.isArchived ? "Unarchive Group?" : "Archive Group?"}
        message={group.isArchived 
          ? `This will move ${group.name} back to your active dashboard.` 
          : `Are you sure you want to archive ${group.name}? It will be hidden from your main dashboard.`
        }
        confirmText={group.isArchived ? "Unarchive" : "Archive"}
        variant="default"
        isLoading={isArchiving}
      />

      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleEditUpdate}
        expense={editingExpense}
        groupMembers={group.members}
      />
    </div>
  )
}

function GroupBalances({ group }: { group: Group }) {
  const { data: balances, isLoading } = useSWR<Balance[]>(`/api/groups/${group.id}/balances`, fetcher)

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!balances || balances.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Everyone is settled up!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Who owes whom</h3>
      {balances.map((balance, index) => {
        const owes = balance.amount
        const initials = (balance.user?.name || '?')
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()

        return (
          <motion.div
            key={balance.user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${balance.user.color || 'bg-primary'} text-primary-foreground`}>
                  {initials}
                </div>
                <div>
                  <p className="font-medium">{balance.user?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">
                    {owes > 0 ? 'owes you' : 'you owe'}
                  </p>
                </div>
              </div>
              <span className={`text-lg font-bold ${owes > 0 ? 'text-positive' : 'text-negative'}`}>
                ${Math.abs(owes ?? 0).toFixed(2)}
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function GroupStats({ group }: { group: Group }) {
  const { data: statsData, isLoading } = useSWR<{ totalSpent: number; categories: any[] }>(
    `/api/groups/${group.id}/stats`, 
    fetcher
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  const stats = statsData || { totalSpent: 0, categories: [] }

  return (
    <div className="space-y-6">
      {/* Total spent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6 text-center"
      >
        <p className="text-sm text-muted-foreground mb-2">Total Group Spending</p>
        <p className={`${getBalanceFontSize(stats.totalSpent || 0)} font-bold`}>${(stats.totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </motion.div>

      {/* Category breakdown */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-accent" />
          <h3 className="font-semibold">Spending by Category</h3>
        </div>
        {(stats.categories?.length || 0) > 0 ? (
          <div className="space-y-3">
            {stats.categories.map((cat, index) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{cat.name}</span>
                  <span className="text-sm font-medium">${cat.amount.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percent}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`h-full rounded-full ${cat.color}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center py-4 text-sm text-muted-foreground">No expenses yet</p>
        )}
      </div>
    </div>
  )
}
