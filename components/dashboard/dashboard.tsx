'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Bell, Settings, Search, User, Activity, Loader2, Archive, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { AnimatedBalance } from './animated-balance'
import { BalanceCard } from './balance-card'
import { GroupCard } from './group-card'
import { WeeklySummary } from './weekly-summary'
import type { Balance, Group } from '@/lib/types'

interface DashboardProps {
  onAddExpense: () => void
  onSelectGroup: (group: Group) => void
  onSettle: (balance: Balance) => void
  onOpenSettings: () => void
  onOpenNotifications: () => void
  onCreateGroup: () => void
  onOpenProfile: () => void
  onOpenActivity: () => void
  onOpenPeople: () => void
  onOpenPersonal: () => void
}

export function Dashboard({ 
  onAddExpense, 
  onSelectGroup, 
  onSettle,
  onOpenSettings,
  onOpenNotifications,
  onCreateGroup,
  onOpenProfile,
  onOpenActivity,
  onOpenPeople,
  onOpenPersonal
}: DashboardProps) {
  const [showArchived, setShowArchived] = useState(false)

  const { data: groupsData, error: groupsError, isLoading: groupsLoading } = useSWR<any[]>('/api/groups', fetcher)
  const { data: balancesData, error: balancesError, isLoading: balancesLoading } = useSWR<Balance[]>('/api/users/me/balances', fetcher)
  const { data: unreadNotifications } = useSWR<any[]>('/api/notifications?unread=true', fetcher)
  const { data: personalStats } = useSWR<any>('/api/expenses/personal/stats', fetcher)
  
  const hasUnread = (unreadNotifications?.length || 0) > 0
  const balances = balancesData || []
  const groups = (groupsData || []).map(g => ({
    id: g.id || g._id,
    name: g.name,
    emoji: g.emoji,
    type: g.type || 'home',
    members: g.members || [],
    totalExpenses: g.totalExpenses || 0,
    userBalance: g.userBalance || 0,
    isArchived: g.isArchived || false
  })) as Group[]

  const activeGroups = groups.filter(g => !g.isArchived)
  const archivedGroups = groups.filter(g => g.isArchived)

  const netBalance = balances.reduce((sum, b) => sum + b.amount, 0)
  const activeBalances = balances.filter(b => Math.abs(b.amount) > 0.01)

  if (groupsLoading || balancesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <header className="md:hidden sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 relative shrink-0 shadow-sm rounded-xl overflow-hidden">
                <Image 
                  src="/desktoplogo.png" 
                  alt="Sharely" 
                  fill 
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tight gradient-text leading-none">Sharely</h1>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.15em] mt-1">Split expenses</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Search className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={onOpenProfile}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <User className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                onClick={onOpenNotifications}
              >
                <Bell className="w-5 h-5" />
                {hasUnread && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-2 h-2 bg-negative rounded-full"
                  />
                )}
              </motion.button>
              <motion.button
                onClick={onOpenSettings}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg md:max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Balance & People */}
          <div className="md:col-span-4 space-y-8">
            <section className="py-8 md:py-0 space-y-6">
              <AnimatedBalance amount={netBalance} />
              
              {/* Personal Summary Card */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onOpenPersonal}
                className="w-full glass-card rounded-3xl p-5 text-left group hover:border-primary/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Personal Tracker</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-black">${(personalStats?.totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground">Private spending this month</p>
                  </div>
                  {personalStats?.categories?.[0] && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{personalStats.categories[0].name}</p>
                      <p className="text-sm font-bold text-primary">{Math.round(personalStats.categories[0].percent)}%</p>
                    </div>
                  )}
                </div>
              </motion.button>
            </section>

            {/* Balances Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">People</h2>
                <button 
                  onClick={onOpenPeople}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  See all
                </button>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {activeBalances.slice(0, 5).map((balance, index) => (
                    <BalanceCard
                      key={balance.user.id}
                      balance={balance}
                      index={index}
                      onSettle={onSettle}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>

            {/* Weekly Summary on Desktop Left */}
            <div className="hidden md:block">
              <WeeklySummary />
            </div>
          </div>

          {/* Right Column: Groups & Summary */}
          <div className="md:col-span-8 space-y-8">
            {/* Quick Summary Pills */}
            <section className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide md:mx-0 md:px-0 md:mt-10">
              <motion.div
                key="owe-you"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-shrink-0 px-4 py-2 rounded-full bg-positive/20 text-positive text-sm font-medium"
              >
                {activeBalances.filter(b => b.amount > 0).length} owe you
              </motion.div>
              <motion.div
                key="you-owe"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-shrink-0 px-4 py-2 rounded-full bg-negative/20 text-negative text-sm font-medium"
              >
                {activeBalances.filter(b => b.amount < 0).length} you owe
              </motion.div>
              <motion.div
                key="active-groups"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-shrink-0 px-4 py-2 rounded-full bg-secondary text-muted-foreground text-sm font-medium"
              >
                {activeGroups.length} active groups
              </motion.div>
            </section>

            {/* Groups Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your Groups</h2>
                <button onClick={onCreateGroup} className="text-sm text-primary hover:text-primary/80 transition-colors">
                  + Create new group
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeGroups.map((group, index) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    index={index}
                    onClick={onSelectGroup}
                  />
                ))}
              </div>

              {archivedGroups.length > 0 && (
                <div className="mt-12 mb-8">
                  <motion.button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`flex items-center justify-between w-full p-4 rounded-2xl border transition-all ${
                      showArchived 
                        ? 'bg-secondary/50 border-border shadow-inner' 
                        : 'bg-gradient-to-r from-secondary/50 to-transparent border-transparent hover:border-border/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${showArchived ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'} transition-colors`}>
                        <Archive className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">Archived Groups</p>
                        <p className="text-xs text-muted-foreground">
                          {archivedGroups.length} {archivedGroups.length === 1 ? 'group' : 'groups'} saved
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: showArchived ? 180 : 0 }}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                  </motion.button>
                  
                  <AnimatePresence>
                    {showArchived && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible p-1"
                      >
                        {archivedGroups.map((group, index) => (
                          <motion.div 
                            key={group.id} 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 0.7 }}
                            whileHover={{ opacity: 1 }}
                            className="transition-opacity"
                          >
                            <GroupCard
                              group={group}
                              index={index}
                              onClick={onSelectGroup}
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* Weekly Summary on Mobile Bottom */}
            <div className="md:hidden">
              <WeeklySummary />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Add Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onAddExpense}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-2xl flex items-center justify-center z-50 hover:shadow-primary/20 transition-all border-4 border-background"
      >
        <Plus className="w-8 h-8 md:w-10 md:h-10" />
      </motion.button>
    </div>
  )
}
