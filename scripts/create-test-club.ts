import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🏢 Creando club de prueba...')
  
  // Crear un club de prueba
  const club = await prisma.club.create({
    data: {
      name: 'Club de Poker Test',
      colorPrimary: '#2563eb',
      colorSecondary: '#f3f4f6',
      colorAccent: '#22c55e'
    }
  })
  
  console.log('✅ Club creado:', club.name)
  
  // Asociar el club al usuario admin
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@admin.com' }
  })
  
  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { clubId: club.id }
    })
    
    console.log('✅ Usuario admin asociado al club')
    console.log(`   Usuario: ${admin.email}`)
    console.log(`   Club: ${club.name}`)
  } else {
    console.log('❌ Usuario admin no encontrado')
  }
  
  console.log('\n🎉 Configuración completada!')
  console.log('🔑 Ahora puedes:')
  console.log('   1. Iniciar sesión con admin@admin.com / admin')
  console.log('   2. Crear jugadores que estarán asociados a tu club')
  console.log('   3. Solo verás los jugadores de tu club')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 