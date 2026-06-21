import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SignOutButton } from './_sign-out-button'

export default async function PerfilPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-zinc-500">Nombre</p>
            <p className="font-medium">{session.user?.name}</p>
          </div>
          <div>
            <p className="text-zinc-500">Email</p>
            <p>{session.user?.email}</p>
          </div>
          <div>
            <p className="text-zinc-500">Rol</p>
            <p className="font-medium">{session.user?.rol}</p>
          </div>
        </CardContent>
      </Card>
      <SignOutButton />
    </div>
  )
}
