import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function generateTestLogs() {
  try {
    // Obtener el primer torneo disponible
    const tournament = await prisma.tournament.findFirst({
      include: {
        players: {
          take: 3
        }
      }
    })

    if (!tournament) {
      console.log('❌ No se encontró ningún torneo')
      return
    }

    console.log(`🎯 Generando logs para torneo: ${tournament.name}`)

    // Obtener un usuario administrador
    const user = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    })

    if (!user) {
      console.log('❌ No se encontró ningún usuario administrador')
      return
    }

    const testLogs = [
      {
        action: 'CREATE_TOURNAMENT',
        details: `Creó el torneo "${tournament.name}"`,
        tournamentId: tournament.id,
        userId: user.id
      },
      {
        action: 'ADD_PLAYER',
        details: 'Agregó jugador "Juan Pérez" al torneo',
        tournamentId: tournament.id,
        userId: user.id,
        playerId: tournament.players[0]?.id
      },
      {
        action: 'ADD_PLAYER',
        details: 'Agregó jugador "María García" al torneo',
        tournamentId: tournament.id,
        userId: user.id,
        playerId: tournament.players[1]?.id
      },
      {
        action: 'START_TOURNAMENT',
        details: 'Inició el torneo',
        tournamentId: tournament.id,
        userId: user.id
      },
      {
        action: 'ADD_REBUY',
        details: 'Agregó recompra sencilla a Juan Pérez',
        tournamentId: tournament.id,
        userId: user.id,
        playerId: tournament.players[0]?.id
      },
      {
        action: 'ADD_ADDON',
        details: 'Agregó add-on a María García',
        tournamentId: tournament.id,
        userId: user.id,
        playerId: tournament.players[1]?.id
      },
      {
        action: 'PAUSE_TOURNAMENT',
        details: 'Pausó el torneo',
        tournamentId: tournament.id,
        userId: user.id
      },
      {
        action: 'RESUME_TOURNAMENT',
        details: 'Reanudó el torneo',
        tournamentId: tournament.id,
        userId: user.id
      },
      {
        action: 'EDIT_PLAYER',
        details: 'Actualizó fichas de Juan Pérez a 15,000',
        tournamentId: tournament.id,
        userId: user.id,
        playerId: tournament.players[0]?.id
      },
      {
        action: 'REGISTER_PAYMENT',
        details: 'Registró pago de $50 por efectivo para Juan Pérez',
        tournamentId: tournament.id,
        userId: user.id,
        playerId: tournament.players[0]?.id
      },
      {
        action: 'ASSIGN_BONUS',
        details: 'Asignó bono "Lucky Chip" a María García',
        tournamentId: tournament.id,
        userId: user.id,
        playerId: tournament.players[1]?.id
      },
      {
        action: 'CHANGE_LEVEL',
        details: 'Avanzó al nivel 2 (Blinds: 25/50)',
        tournamentId: tournament.id,
        userId: user.id
      },
      {
        action: 'DELETE_PLAYER',
        details: 'Eliminó completamente a "Carlos López" del torneo',
        tournamentId: tournament.id,
        userId: user.id,
        playerId: tournament.players[2]?.id
      }
    ]

    // Crear los logs con fechas escalonadas
    for (let i = 0; i < testLogs.length; i++) {
      const log = testLogs[i]
      const createdAt = new Date()
      createdAt.setMinutes(createdAt.getMinutes() - (testLogs.length - i) * 5) // Cada 5 minutos

      await prisma.auditLog.create({
        data: {
          ...log,
          createdAt
        }
      })

      console.log(`✅ Creado log: ${log.action}`)
    }

    console.log(`🎉 Se generaron ${testLogs.length} logs de prueba`)
    console.log(`📊 Puedes ver el historial en: http://localhost:3000/tournament/${tournament.id}`)

  } catch (error) {
    console.error('❌ Error generando logs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateTestLogs() 