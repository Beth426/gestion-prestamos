import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12)

  await prisma.usuario.upsert({
    where: { email: 'admin@prestamos.local' },
    update: {},
    create: {
      email: 'admin@prestamos.local',
      nombre: 'Administrador',
      rol: 'ADMIN',
      passwordHash,
    },
  })

  console.log('Seed completado. Usuario: admin@prestamos.local / admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
