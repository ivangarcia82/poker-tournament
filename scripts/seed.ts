import { PrismaClient } from '../src/generated/prisma'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Crear usuario administrador
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@poker.com' },
    update: {},
    create: {
      email: 'admin@poker.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN'
    }
  })

  // Crear usuario organizador
  const organizerPassword = await hashPassword('organizer123')
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@poker.com' },
    update: {},
    create: {
      email: 'organizer@poker.com',
      name: 'Organizador',
      password: organizerPassword,
      role: 'ORGANIZER'
    }
  })

  // Crear torneo de ejemplo
  const tournament = await prisma.tournament.create({
    data: {
      name: 'Torneo de Prueba',
      description: 'Un torneo de ejemplo para probar el sistema',
      buyIn: 50,
      addOn: 25,
      rake: 10,
      maxPlayers: 20,
      minPlayers: 6,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
      status: 'REGISTERING',
      organizerId: organizer.id,
      blindStructure: {
        create: [
          { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 20 },
          { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 20 },
          { level: 3, smallBlind: 100, bigBlind: 200, ante: 0, duration: 20 },
          { level: 4, smallBlind: 200, bigBlind: 400, ante: 25, duration: 20 },
          { level: 5, smallBlind: 300, bigBlind: 600, ante: 50, duration: 20 },
          { level: 6, smallBlind: 400, bigBlind: 800, ante: 75, duration: 20 },
          { level: 7, smallBlind: 500, bigBlind: 1000, ante: 100, duration: 20 },
          { level: 8, smallBlind: 1000, bigBlind: 2000, ante: 200, duration: 20 },
          { level: 9, smallBlind: 1500, bigBlind: 3000, ante: 300, duration: 20 },
          { level: 10, smallBlind: 2000, bigBlind: 4000, ante: 400, duration: 20 }
        ]
      }
    }
  })

  // Crear jugadores de ejemplo
  const players = await Promise.all([
    prisma.player.create({
      data: {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '+1234567890',
        chips: 5000,
        tournamentId: tournament.id
      }
    }),
    prisma.player.create({
      data: {
        name: 'María García',
        email: 'maria@example.com',
        phone: '+1234567891',
        chips: 5000,
        tournamentId: tournament.id
      }
    }),
    prisma.player.create({
      data: {
        name: 'Carlos López',
        email: 'carlos@example.com',
        phone: '+1234567892',
        chips: 5000,
        tournamentId: tournament.id
      }
    }),
    prisma.player.create({
      data: {
        name: 'Ana Rodríguez',
        email: 'ana@example.com',
        phone: '+1234567893',
        chips: 5000,
        tournamentId: tournament.id
      }
    }),
    prisma.player.create({
      data: {
        name: 'Luis Martínez',
        email: 'luis@example.com',
        phone: '+1234567894',
        chips: 5000,
        tournamentId: tournament.id
      }
    }),
    prisma.player.create({
      data: {
        name: 'Sofia Torres',
        email: 'sofia@example.com',
        phone: '+1234567895',
        chips: 5000,
        tournamentId: tournament.id
      }
    })
  ])

  // Crear transacciones de ejemplo
  await Promise.all(
    players.map(player =>
      prisma.transaction.create({
        data: {
          type: 'BUY_IN',
          amount: 50,
          description: `Buy-in para ${player.name}`,
          tournamentId: tournament.id,
          playerId: player.id,
          userId: organizer.id
        }
      })
    )
  )

  console.log('✅ Seed completado exitosamente!')
  console.log('👤 Usuario admin: admin@poker.com / admin123')
  console.log('👤 Usuario organizador: organizer@poker.com / organizer123')
  console.log('🎯 Torneo creado con 6 jugadores de ejemplo')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 