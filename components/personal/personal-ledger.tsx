'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Wallet, 
  TrendingUp, 
  Calendar,
  Loader2,
  ChevronRight,
  PieChart as PieChartIcon
} from 'lucide-react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { ExpenseBubble } from '../group/expense-bubble'
import { categories } from '@/lib/constants'

interface PersonalLedgerProps {
  onBack: () => void
  onAddExpense: () => void
}

export function PersonalLedger({ onBack, onAddExpense }: PersonalLedgerProps) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'stats'>('expenses')
  
  const { data: expenses, isLoading: expensesLoading, mutate: mutateExpenses } = useSWR<any[]>('/api/expenses/personal', fetcher)
  const { data: stats, isLoading: statsLoading } = useSWR<any>('/api/expenses/personal/stats', fetcher)

  const handleDeletePersonalExpense = async (id: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (response.ok) {
        mutateExpenses()
      }
    } catch (error) {
      console.error('Delete personal expense error:', error)
    }
  }

  // Group expenses by date
  const groupedExpenses = expenses?.reduce((groups: any, expense) => {
    const date = new Date(expense.createdAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(expense)
    return groups
  }, {}) || {}

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-card border-b border-border/50 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 rounded-full hover:bg-secondary transition-colors md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Personal Ledger
              </h1>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Private Tracking</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
            <button 
              onClick={onAddExpense}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Private Expense
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto w-full px-4 mt-6">
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'expenses' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'stats' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Insights
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 pb-24 md:pb-12">
        <AnimatePresence mode="wait">
          {activeTab === 'expenses' ? (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {expensesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Fetching your private ledger...</p>
                </div>
              ) : Object.keys(groupedExpenses).length > 0 ? (
                Object.entries(groupedExpenses).map(([date, items]: [string, any]) => (
                  <div key={date} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">{date}</h3>
                      <div className="h-px w-full bg-border/50" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((expense: any, index: number) => (
                        <ExpenseBubble
                          key={expense.id || expense._id}
                          expense={expense}
                          index={index}
                          onReact={() => {}} // No reactions for personal expenses
                          onDelete={handleDeletePersonalExpense}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">No private expenses</h3>
                    <p className="text-muted-foreground text-sm">Start tracking your personal spending here.</p>
                  </div>
                  <button 
                    onClick={onAddExpense}
                    className="px-6 py-3 rounded-2xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-all"
                  >
                    Add Your First Expense
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card rounded-3xl p-6 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Spent</p>
                  <p className="text-3xl font-black text-foreground">
                    ${(stats?.totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="glass-card rounded-3xl p-6 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Expenses</p>
                  <p className="text-3xl font-black text-foreground">{expenses?.length || 0}</p>
                </div>
                <div className="glass-card rounded-3xl p-6 space-y-2 bg-primary/5">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Monthly Average</p>
                  <p className="text-3xl font-black text-primary">
                    ${((stats?.totalSpent || 0) / Math.max(1, (expenses?.length || 1) / 30)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Category Chart */}
              <div className="glass-card rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-xl bg-accent/20 text-accent">
                    <PieChartIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">Category Breakdown</h3>
                </div>
                
                <div className="space-y-6">
                  {stats?.categories?.map((cat: any, index: number) => (
                    <div key={cat.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{cat.name}</span>
                          <span className="text-xs text-muted-foreground font-medium">{cat.percent.toFixed(1)}%</span>
                        </div>
                        <span className="font-black">${cat.amount.toFixed(2)}</span>
                      </div>
                      <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percent}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={`h-full rounded-full ${cat.color}`}
                        />
                      </div>
                    </div>
                  ))}
                  {(!stats?.categories || stats.categories.length === 0) && (
                    <p className="text-center text-muted-foreground py-10">No spending data to analyze yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Add Button - Mobile */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onAddExpense}
        className="md:hidden fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-2xl flex items-center justify-center z-50 border-4 border-background"
      >
        <Plus className="w-8 h-8" />
      </motion.button>
    </div>
  )
}
