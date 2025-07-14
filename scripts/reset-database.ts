import { PrismaClient } from '../src/generated/prisma'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Reseteando base de datos...')
  
  // Eliminar todos los datos en orden (por las relaciones)
  console.log('Eliminando datos existentes...')
  
  await prisma.playerPayment.deleteMany()
  await prisma.playerBonus.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.player.deleteMany()
  await prisma.prize.deleteMany()
  await prisma.bonus.deleteMany()
  await prisma.blindStructure.deleteMany()
  await prisma.tournamentSnapshot.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.tournament.deleteMany()
  await prisma.clubPlayer.deleteMany()
  await prisma.user.deleteMany()
  await prisma.club.deleteMany()
  
  console.log('✅ Todos los datos eliminados')
  
  // Crear usuario admin
  console.log('👤 Creando usuario administrador...')
  
  const adminPassword = await hashPassword('admin')
  const admin = await prisma.user.create({
    data: {
      email: 'admin@admin.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN'
    }
  })
  
  console.log('✅ Usuario admin creado:')
  console.log(`   Email: ${admin.email}`)
  console.log(`   Contraseña: admin`)
  console.log(`   Rol: ${admin.role}`)
  
  console.log('\n🎉 Base de datos reseteada exitosamente!')
  console.log('🔑 Credenciales de acceso:')
  console.log('   Email: admin@admin.com')
  console.log('   Contraseña: admin')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el reset:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 