'use client'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Session } from 'next-auth'

export function Topbar({ session }: { session: Session }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium leading-none">{session.user?.name}</p>
          <p className="text-xs text-zinc-500">{(session.user as { rol?: string }).rol}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: '/login' })}
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  )
}
