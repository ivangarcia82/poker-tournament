import { prisma } from '../src/lib/db'

async function main() {
  console.log('🔄 Actualizando roles de usuarios...')
  
  // Buscar usuarios con rol USER
  const usersWithUserRole = await prisma.user.findMany({
    where: {
      role: 'USER'
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  })

  console.log(`\n📋 Usuarios con rol USER encontrados: ${usersWithUserRole.length}`)
  usersWithUserRole.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email}) - Rol actual: ${user.role}`)
  })

  if (usersWithUserRole.length > 0) {
    console.log('\n🔄 Actualizando roles de USER a ORGANIZER...')
    
    const updateResult = await prisma.user.updateMany({
      where: {
        role: 'USER'
      },
      data: {
        role: 'ORGANIZER'
      }
    })

    console.log(`✅ ${updateResult.count} usuarios actualizados exitosamente`)
    
    // Verificar los cambios
    const updatedUsers = await prisma.user.findMany({
      where: {
        email: {
          in: usersWithUserRole.map(u => u.email)
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    console.log('\n📋 Usuarios después de la actualización:')
    updatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Rol: ${user.role}`)
    })
  } else {
    console.log('\n✅ No hay usuarios con rol USER para actualizar')
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