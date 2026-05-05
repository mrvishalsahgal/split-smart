'use client'

import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Settings, 
  LogOut, 
  Bell, 
  User,
  PlusCircle,
  PieChart
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'

interface DesktopSidebarProps {
  activeView: string
  onViewChange: (view: any) => void
  unreadCount: number
}

export function DesktopSidebar({ activeView, onViewChange, unreadCount }: DesktopSidebarProps) {
  const { data: session } = useSession()
  const user = session?.user
  
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : '??'

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'people', label: 'People', icon: Users },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'stats', label: 'Analytics', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 bg-card/30 backdrop-blur-xl border-r border-border/50 p-6 z-50">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 relative flex items-center justify-center">
          <Image 
            src="/desktoplogo.png" 
            alt="Sharely Logo" 
            width={40} 
            height={40} 
            className="object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight gradient-text leading-none mb-1">Sharely</h1>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest leading-none">Split expenses.<br/>Not friendships</p>
        </div>
      </div>
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all group ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                <span className="font-semibold">{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <span className="bg-negative text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-background">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User & Sign Out */}
      <div className="mt-auto pt-6 border-t border-border/30 space-y-4">
        <button 
          onClick={() => onViewChange('profile')}
          className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-secondary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
            {initials}
          </div>
          <div className="text-left overflow-hidden">
            <p className="text-sm font-bold truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || 'user@example.com'}</p>
          </div>
        </button>

        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 p-3 rounded-2xl text-negative hover:bg-negative/10 transition-colors font-semibold"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
