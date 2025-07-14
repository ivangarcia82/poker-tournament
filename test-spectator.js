const fetch = require('node-fetch')

async function testSpectatorEndpoint() {
  try {
    // Probar el endpoint público
    const response = await fetch('http://localhost:3000/api/tournaments/cmcnoxvnd0004c9v4nbr2p1ul/public')
    
    console.log('Status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('📊 Datos del torneo:')
      console.log('- ID:', data.id)
      console.log('- Nombre:', data.name)
      console.log('- Estado:', data.status)
      console.log('- Nivel actual:', data.currentLevel)
      console.log('- Tiempo restante:', data.timeRemaining, 'segundos')
      console.log('- Formato tiempo:', formatTime(data.timeRemaining))
      console.log('- Pausado:', data.isPaused)
      console.log('- Jugadores activos:', data.activePlayers)
      console.log('- Total jugadores:', data.totalPlayers)
      console.log('- Total fichas:', data.totalChips)
      console.log('- Promedio fichas:', data.averageChips)
      
      if (data.debug) {
        console.log('\n🔍 Debug info:')
        console.log('- Start time:', data.debug.startTime)
        console.log('- Paused time remaining:', data.debug.pausedTimeRemaining)
        console.log('- Paused at:', data.debug.pausedAt)
        console.log('- Status:', data.debug.status)
        console.log('- Blind structure length:', data.debug.blindStructureLength)
      }
    } else {
      const error = await response.text()
      console.error('Error:', error)
    }
  } catch (error) {
    console.error('Error de conexión:', error)
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

testSpectatorEndpoint() 