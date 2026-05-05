'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('SW registered: ', registration)
          },
          (registrationError) => {
            console.log('SW registration failed: ', registrationError)
          }
        )
      })
    }

    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setInstallPrompt(e)
      // Show the install button
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return

    // Show the prompt
    installPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)

    // We've used the prompt, and can't use it again, throw it away
    setInstallPrompt(null)
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border shadow-xl rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-none mb-1">Install Sharely</h3>
            <p className="text-xs text-muted-foreground">Add to home screen for better experience</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleInstallClick} className="rounded-full">
            Install
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setIsVisible(false)} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
