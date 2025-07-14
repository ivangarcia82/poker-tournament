import { PrismaClient } from '../src/generated/prisma'
import { verifyToken } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verificando usuarios en tokens...')
  
  // Obtener todos los usuarios
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      clubId: true
    }
  })

  console.log(`\n📋 Usuarios en la base de datos: ${users.length}`)
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`)
  })

  // Verificar si hay usuarios con tokens que no existen
  console.log('\n🔑 Verificando tokens...')
  
  // Simular verificación de token (esto es solo para debug)
  const testEmails = ['admin@admin.com', 'ivanalex.gp35@gmail.com']
  
  for (const email of testEmails) {
    const user = users.find(u => u.email === email)
    if (user) {
      console.log(`✅ Usuario ${email} existe con ID: ${user.id}`)
    } else {
      console.log(`❌ Usuario ${email} NO existe en la base de datos`)
    }
  }

  // Verificar usuarios sin club
  const usersWithoutClub = users.filter(u => !u.clubId)
  console.log(`\n🏢 Usuarios sin club: ${usersWithoutClub.length}`)
  usersWithoutClub.forEach(user => {
    console.log(`- ${user.name} (${user.email})`)
  })

  // Verificar usuarios con club
  const usersWithClub = users.filter(u => u.clubId)
  console.log(`\n✅ Usuarios con club: ${usersWithClub.length}`)
  usersWithClub.forEach(user => {
    console.log(`- ${user.name} (${user.email}) - Club ID: ${user.clubId}`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 