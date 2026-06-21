import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { Rol } from '@prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email as string, eliminadoEn: null },
        })
        if (!usuario || !usuario.passwordHash) return null

        const ok = await bcrypt.compare(credentials.password as string, usuario.passwordHash)
        if (!ok) return null

        return { id: usuario.id, email: usuario.email, name: usuario.nombre, rol: usuario.rol }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.rol = (user as { rol: Rol }).rol
      return token
    },
    session({ session, token }) {
      if (session.user) (session.user as { rol?: Rol }).rol = token.rol as Rol
      return session
    },
  },
})
