const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// Preparar la aplicación Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Crear servidor HTTP
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Configurar Socket.io manualmente
  const { Server } = require('socket.io')
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  })

  // Configurar eventos de Socket.io
  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id)

    // Unirse a una sala de torneo
    socket.on('join-tournament', (tournamentId) => {
      socket.join(`tournament-${tournamentId}`)
      console.log(`👥 Cliente ${socket.id} se unió al torneo ${tournamentId}`)
    })

    // Salir de una sala de torneo
    socket.on('leave-tournament', (tournamentId) => {
      socket.leave(`tournament-${tournamentId}`)
      console.log(`👋 Cliente ${socket.id} salió del torneo ${tournamentId}`)
    })

    // Actualizar reloj del torneo
    socket.on('update-clock', (data) => {
      socket.to(`tournament-${data.tournamentId}`).emit('clock-updated', data)
      console.log(`⏰ Reloj actualizado para torneo ${data.tournamentId}`)
    })

    // Desconexión
    socket.on('disconnect', () => {
      console.log('🔌 Cliente desconectado:', socket.id)
    })
  })

  // Hacer el io disponible globalmente para los endpoints
  global.io = io

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`🚀 Servidor listo en http://${hostname}:${port}`)
    console.log(`🔌 Socket.io configurado en el puerto ${port}`)
  })
}) 