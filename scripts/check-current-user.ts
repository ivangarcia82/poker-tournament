import { prisma } from '../src/lib/db'

async function main() {
  console.log('🔍 Verificando usuarios en la base de datos...')
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log('\n📋 Usuarios encontrados:')
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email}) - Rol: ${user.role}`)
  })

  console.log('\n🎯 Roles disponibles en el sistema:')
  console.log('- ADMIN: Acceso completo')
  console.log('- ORGANIZER: Puede crear torneos y gestionar jugadores')
  console.log('- STAFF: Puede gestionar jugadores del club')
  console.log('- USER: Usuario básico')

  if (users.length === 0) {
    console.log('\n⚠️  No hay usuarios en la base de datos')
    console.log('💡 Ejecuta: npm run db:seed para crear usuarios de prueba')
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 