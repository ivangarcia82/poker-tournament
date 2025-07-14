import { NextRequest } from 'next/server'
import { configureSocketServer } from '@/lib/socket'

// Este endpoint maneja las conexiones WebSocket
export async function GET(request: NextRequest) {
  // En Next.js App Router, necesitamos manejar WebSocket de manera diferente
  // Este endpoint es principalmente para configuración
  return new Response('WebSocket endpoint', { status: 200 })
}

// Para WebSocket en Next.js, necesitamos configurar el servidor HTTP
// Esto se hace en un archivo separado o en el servidor principal 