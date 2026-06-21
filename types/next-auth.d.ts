import type { Rol } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    rol: Rol
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    rol: Rol
  }
}
