'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSWRConfig } from 'swr'
import { Dashboard } from '@/components/dashboard/dashboard'
import { GroupSpace } from '@/components/group/group-space'
import { SettingsView } from '@/components/settings/settings-view'
import { NotificationsView } from '@/components/notifications/notifications-view'
import { CreateGroupView } from '@/components/groups/create-group-view'
import { AddMembersView } from '@/components/groups/add-members-view'
import { ActivityView } from '@/components/activity/activity-view'
import { ProfileView } from '@/components/profile/profile-view'
import { PeopleView } from '@/components/friends/people-view'
import { InviteView } from '@/components/friends/invite-view'
import { PersonalLedger } from '@/components/personal/personal-ledger'
import { AddExpenseModal } from '@/components/expense/add-expense-modal'
import { SettleModal } from '@/components/settle/settle-modal'
import { DesktopSidebar } from '@/components/layout/desktop-sidebar'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { Group, Balance } from '@/lib/types'

type View = 'dashboard' | 'group' | 'settings' | 'notifications' | 'create-group' | 'add-members' | 'activity' | 'profile' | 'people' | 'stats' | 'personal'

function HomeContent() {
  const { mutate } = useSWRConfig()
  const [view, setView] = useState<View>('dashboard')
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedBalance, setSelectedBalance] = useState<Balance | null>(null)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showSettle, setShowSettle] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [addExpenseContext, setAddExpenseContext] = useState<{ groupId?: string } | null>(null)
  const searchParams = useSearchParams()
  const joinedGroupId = searchParams.get('joinedGroup')
  const initialView = searchParams.get('view') as View

  useEffect(() => {
    if (joinedGroupId) {
      // Fetch group details and select it
      fetch(`/api/groups/${joinedGroupId}`)
        .then(res => res.json())
        .then(group => {
          if (group && !group.error) {
            setSelectedGroup(group)
            setView('group')
          }
        })
    } else if (initialView) {
      setView(initialView)
    }
  }, [joinedGroupId, initialView])

  const { data: unreadNotifications } = useSWR<any[]>('/api/notifications?unread=true', fetcher)
  const unreadCount = unreadNotifications?.length || 0

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group)
    setView('group')
  }

  const handleBack = () => {
    setView('dashboard')
    setSelectedGroup(null)
  }

  const handleSettle = (balance: Balance) => {
    setSelectedBalance(balance)
    setShowSettle(true)
  }

  const handleAddExpense = (expense: any) => {
    console.log('New expense:', expense)
    // Revalidate relevant data
    mutate('/api/groups')
    mutate('/api/users/me/balances')
    if (expense.groupId) {
      mutate(`/api/groups/${expense.groupId}/expenses`)
      mutate(`/api/groups/${expense.groupId}/balances`)
    } else {
      mutate('/api/expenses/personal')
      mutate('/api/expenses/personal/stats')
    }
  }

  const handleSettleComplete = () => {
    console.log('Settled:', selectedBalance)
    // Revalidate balances
    mutate('/api/users/me/balances')
    mutate('/api/groups')
    if (selectedGroup) {
      mutate(`/api/groups/${selectedGroup._id || selectedGroup.id}/balances`)
    }
    setSelectedBalance(null)
  }

  return (
    <div className="flex min-h-screen bg-background relative overflow-x-clip">
      {/* Desktop Mesh Background Decorations */}
      <div className="hidden md:block fixed top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="hidden md:block fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      <DesktopSidebar 
        activeView={view} 
        onViewChange={(newView) => setView(newView)} 
        unreadCount={unreadCount}
      />

      <div className="flex-1 flex flex-col min-h-screen relative md:ml-72">
        <AnimatePresence mode="wait">
        {view === 'dashboard' ? (
          <Dashboard
            key="dashboard"
            onAddExpense={() => {
              setAddExpenseContext(null)
              setShowAddExpense(true)
            }}
            onSelectGroup={handleSelectGroup}
            onSettle={handleSettle}
            onOpenSettings={() => setView('settings')}
            onOpenNotifications={() => setView('notifications')}
            onCreateGroup={() => setView('create-group')}
            onOpenProfile={() => setView('profile')}
            onOpenActivity={() => setView('activity')}
            onOpenPeople={() => setView('people')}
            onOpenPersonal={() => setView('personal')}
          />
        ) : view === 'settings' ? (
          <SettingsView key="settings" onBack={() => setView('dashboard')} />
        ) : view === 'notifications' ? (
          <NotificationsView key="notifications" onBack={() => setView('dashboard')} />
        ) : view === 'create-group' ? (
          <CreateGroupView 
            key="create-group" 
            onBack={() => setView('dashboard')} 
            onComplete={() => {
              mutate('/api/groups')
              setView('dashboard')
            }} 
            onInviteFriend={() => setShowInvite(true)} 
          />
        ) : view === 'add-members' && selectedGroup ? (
          <AddMembersView key="add-members" groupId={selectedGroup._id || selectedGroup.id} onBack={() => setView('group')} onInviteFriend={() => setShowInvite(true)} />
        ) : selectedGroup ? (
          <GroupSpace
            key="group"
            group={selectedGroup}
            onBack={handleBack}
            onAddExpense={() => {
              setAddExpenseContext({ groupId: selectedGroup._id || selectedGroup.id })
              setShowAddExpense(true)
            }}
            onAddMembers={() => setView('add-members')}
          />
        ) : view === 'activity' ? (
          <ActivityView key="activity" onBack={() => setView('dashboard')} />
        ) : view === 'profile' ? (
          <ProfileView key="profile" onBack={() => setView('dashboard')} onOpenSettings={() => setView('settings')} onOpenActivity={() => setView('activity')} />
        ) : view === 'people' ? (
          <PeopleView 
            onSettle={(balance) => handleSettle(balance)}
            onInviteFriend={() => setShowInvite(true)}
          />
        ) : view === 'personal' ? (
          <PersonalLedger
            key="personal"
            onBack={() => setView('dashboard')}
            onAddExpense={() => {
              setAddExpenseContext(null)
              setShowAddExpense(true)
            }}
          />
        ) : null}
      </AnimatePresence>

      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => {
          setShowAddExpense(false)
          setAddExpenseContext(null)
        }}
        onAdd={handleAddExpense}
        defaultGroupId={addExpenseContext?.groupId}
      />

      <SettleModal
        isOpen={showSettle}
        balance={selectedBalance}
        onClose={() => {
          setShowSettle(false)
          setSelectedBalance(null)
        }}
        onSettle={handleSettleComplete}
      />

      {/* Invite Modal Overlay */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              onClick={() => setShowInvite(false)}
              className="absolute inset-0 bg-background/40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-background rounded-[2.5rem] shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col"
            >
              <InviteView 
                onBack={() => setShowInvite(false)} 
                groupId={selectedGroup?._id || selectedGroup?.id} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
