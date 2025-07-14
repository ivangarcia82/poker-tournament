import { useState, useEffect } from 'react'
import { Tournament } from '@/types'
import Toast from '../ui/Toast'

interface TournamentSnapshotsProps {
  tournament: Tournament
  onUpdate: () => void
}

interface Snapshot {
  id: string
  createdAt: string
  description: string
  status: string
  isAutomatic: boolean
  players: any[]
}

export default function TournamentSnapshots({ tournament, onUpdate }: TournamentSnapshotsProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [description, setDescription] = useState('')
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    loadSnapshots()
  }, [tournament.id])

  const loadSnapshots = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/snapshots`)
      if (response.ok) {
        const data = await response.json()
        setSnapshots(data)
      }
    } catch (error) {
      console.error('Error cargando snapshots:', error)
    }
  }

  const createSnapshot = async () => {
    if (!description.trim()) {
      setToast({ message: 'Ingresa una descripción', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      })

      if (response.ok) {
        setToast({ message: 'Snapshot creado exitosamente', type: 'success' })
        setDescription('')
        setShowCreateForm(false)
        loadSnapshots()
        onUpdate()
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Error creando snapshot', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'text-green-600'
      case 'PAUSED': return 'text-yellow-600'
      case 'FINISHED': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">📸 Snapshots del Torneo</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          {showCreateForm ? 'Cancelar' : 'Crear Snapshot'}
        </button>
      </div>

      {/* Formulario para crear snapshot */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-3">Crear Snapshot Manual</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el estado actual del torneo..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={createSnapshot}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Snapshot'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de snapshots */}
      <div className="space-y-4">
        {snapshots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay snapshots disponibles</p>
            <p className="text-sm">Los snapshots automáticos se crean en momentos clave del torneo</p>
          </div>
        ) : (
          snapshots.map((snapshot) => (
            <div key={snapshot.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{snapshot.description}</h4>
                  <p className="text-sm text-gray-500">
                    {formatDate(snapshot.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getStatusColor(snapshot.status)}`}>
                    {snapshot.status}
                  </span>
                  {snapshot.isAutomatic ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Automático
                    </span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Manual
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Jugadores:</span>
                  <span className="ml-1 font-medium">{snapshot.players?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Estado:</span>
                  <span className={`ml-1 font-medium ${getStatusColor(snapshot.status)}`}>
                    {snapshot.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <span className="ml-1 font-medium">
                    {snapshot.isAutomatic ? 'Automático' : 'Manual'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">ID:</span>
                  <span className="ml-1 font-mono text-xs">{snapshot.id.slice(-8)}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      // TODO: Implementar restauración desde snapshot
                      setToast({ message: 'Función de restauración en desarrollo', type: 'info' })
                    }}
                    className="text-sm bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded"
                  >
                    Restaurar
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implementar descarga del snapshot
                      setToast({ message: 'Función de descarga en desarrollo', type: 'info' })
                    }}
                    className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                  >
                    Descargar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Información sobre snapshots */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">ℹ️ Información sobre Snapshots</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Los snapshots automáticos se crean al iniciar, pausar, reanudar o finalizar el torneo</li>
          <li>• Los snapshots manuales se pueden crear en cualquier momento</li>
          <li>• Los snapshots antiguos (más de 30 días) se eliminan automáticamente</li>
          <li>• Cada snapshot incluye el estado completo del torneo y todos los jugadores</li>
        </ul>
      </div>
    </div>
  )
} 