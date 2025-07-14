const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixTournamentTime() {
  try {
    const tournamentId = 'cmcnoxvnd0004c9v4nbr2p1ul'
    
    // Obtener el torneo actual
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        blindStructure: true
      }
    })
    
    if (!tournament) {
      console.log('❌ Torneo no encontrado')
      return
    }
    
    console.log('📊 Estado actual del torneo:')
    console.log('- ID:', tournament.id)
    console.log('- Nombre:', tournament.name)
    console.log('- Status:', tournament.status)
    console.log('- StartTime actual:', tournament.startTime)
    console.log('- Blind structure:', tournament.blindStructure.length, 'niveles')
    
    // Calcular un startTime realista (hace 10 minutos)
    const now = new Date()
    const realisticStartTime = new Date(now.getTime() - (10 * 60 * 1000)) // 10 minutos atrás
    
    console.log('\n🕐 Calculando startTime realista...')
    console.log('- Ahora:', now.toISOString())
    console.log('- StartTime propuesto:', realisticStartTime.toISOString())
    
    // Actualizar el torneo
    const updatedTournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        startTime: realisticStartTime
      }
    })
    
    console.log('\n✅ Torneo actualizado:')
    console.log('- Nuevo startTime:', updatedTournament.startTime)
    
    // Probar el endpoint público
    const response = await fetch(`http://localhost:3000/api/tournaments/${tournamentId}/public`)
    if (response.ok) {
      const data = await response.json()
      console.log('\n📊 Datos del endpoint público:')
      console.log('- TimeRemaining:', data.timeRemaining, 'segundos')
      console.log('- Formato tiempo:', formatTime(data.timeRemaining))
      console.log('- CurrentLevel:', data.currentLevel)
      console.log('- IsPaused:', data.isPaused)
      console.log('- ActivePlayers:', data.activePlayers)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function formatTime(seconds) {
  if (seconds < 0) return '00:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

fixTournamentTime() 