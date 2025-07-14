import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🔗 Asignando usuario a club...')
  
  const email = process.argv[2]
  if (!email) {
    console.log('❌ Uso: npx tsx scripts/assign-user-to-club.ts <email>')
    console.log('Ejemplo: npx tsx scripts/assign-user-to-club.ts pruebafinal@prueba.mx')
    process.exit(1)
  }

  // Buscar el usuario
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, clubId: true }
  })

  if (!user) {
    console.log(`❌ Usuario con email ${email} no encontrado`)
    process.exit(1)
  }

  console.log(`👤 Usuario encontrado: ${user.name} (${user.email})`)
  console.log(`   Rol: ${user.role}`)
  console.log(`   Club actual: ${user.clubId || 'Ninguno'}`)

  if (user.clubId) {
    console.log('✅ Usuario ya tiene un club asignado')
    process.exit(0)
  }

  // Buscar clubs disponibles
  const clubs = await prisma.club.findMany({
    select: { id: true, name: true }
  })

  if (clubs.length === 0) {
    console.log('❌ No hay clubs disponibles')
    console.log('💡 Ejecuta: npx tsx scripts/create-test-club.ts')
    process.exit(1)
  }

  console.log('\n🏢 Clubs disponibles:')
  clubs.forEach((club, index) => {
    console.log(`${index + 1}. ${club.name} (${club.id})`)
  })

  // Asignar al primer club (o puedes modificar para elegir)
  const selectedClub = clubs[0]
  console.log(`\n🔗 Asignando usuario al club: ${selectedClub.name}`)

  await prisma.user.update({
    where: { id: user.id },
    data: { clubId: selectedClub.id }
  })

  console.log('✅ Usuario asignado exitosamente al club')
  console.log(`   Usuario: ${user.email}`)
  console.log(`   Club: ${selectedClub.name}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 