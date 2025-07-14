import { prisma } from '../src/lib/db'

async function checkTournaments() {
  try {
    console.log('🔍 Verificando torneos en la base de datos...\n')
    
    const tournaments = await prisma.tournament.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        players: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log(`📊 Total de torneos encontrados: ${tournaments.length}\n`)

    tournaments.forEach((tournament, index) => {
      console.log(`🏆 Torneo ${index + 1}:`)
      console.log(`   ID: ${tournament.id}`)
      console.log(`   Nombre: ${tournament.name}`)
      console.log(`   Estado: ${tournament.status}`)
      console.log(`   Organizador: ${tournament.organizer.name} (${tournament.organizer.email})`)
      console.log(`   Organizador ID: ${tournament.organizerId}`)
      console.log(`   Jugadores: ${tournament.players.length}`)
      console.log(`   Creado: ${tournament.createdAt}`)
      console.log('')
    })

    // Verificar el torneo específico
    const specificId = 'cmcmrm8230003c9t9bq6x2xde'
    console.log(`🔍 Buscando torneo específico: ${specificId}`)
    
    const specificTournament = await prisma.tournament.findUnique({
      where: { id: specificId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (specificTournament) {
      console.log('✅ Torneo encontrado:')
      console.log(`   ID: ${specificTournament.id}`)
      console.log(`   Nombre: ${specificTournament.name}`)
      console.log(`   Estado: ${specificTournament.status}`)
      console.log(`   Organizador: ${specificTournament.organizer.name}`)
      console.log(`   Organizador ID: ${specificTournament.organizerId}`)
    } else {
      console.log('❌ Torneo no encontrado')
    }

  } catch (error) {
    console.error('Error verificando torneos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTournaments() 