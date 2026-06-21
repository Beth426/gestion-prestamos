import { auth } from '@/lib/auth'
import type { Rol } from '@prisma/client'

export async function getSession() {
  return auth()
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('No autenticado')
  }
  return session
}

export async function requireRol(...roles: Rol[]) {
  const session = await requireAuth()
  const userRol = (session.user as { rol?: Rol }).rol
  if (!userRol || !roles.includes(userRol)) {
    throw new Error('Sin permisos suficientes')
  }
  return session
}
