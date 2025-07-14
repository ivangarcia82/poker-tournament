import { useEffect, useState } from 'react'
import { User } from '@/types'
import Toast from '../ui/Toast'

interface ClubPlayersProps {
  user: User
}

interface ClubPlayer {
  id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  deuda?: number
  pagado?: number
  balance?: number
}

export default function ClubPlayers({ user }: ClubPlayersProps) {
  const [players, setPlayers] = useState<ClubPlayer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPlayers = async () => {
    setLoading(true)
    try {
      // Usar el endpoint de balance
      const res = await fetch(`/api/club-players/balance`)
      if (res.ok) {
        setPlayers(await res.json())
      } else {
        setToast({ message: 'Error al cargar jugadores', type: 'error' })
      }
    } catch {
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlayers() }, [search])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setToast({ message: 'El nombre es obligatorio', type: 'error' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/club-players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setForm({ name: '', email: '', phone: '', notes: '' })
        setShowForm(false)
        setToast({ message: 'Jugador creado correctamente', type: 'success' })
        fetchPlayers()
      } else {
        const err = await res.json()
        setToast({ message: err.error || 'Error al crear jugador', type: 'error' })
      }
    } catch {
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (player: ClubPlayer) => {
    setEditId(player.id)
    setEditForm({ name: player.name, email: player.email || '', phone: player.phone || '', notes: player.notes || '' })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.name.trim()) {
      setToast({ message: 'El nombre es obligatorio', type: 'error' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/club-players/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      if (res.ok) {
        setToast({ message: 'Jugador actualizado correctamente', type: 'success' })
        setEditId(null)
        fetchPlayers()
      } else {
        const err = await res.json()
        setToast({ message: err.error || 'Error al actualizar jugador', type: 'error' })
      }
    } catch {
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este jugador?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/club-players/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setToast({ message: 'Jugador eliminado', type: 'success' })
        fetchPlayers()
      } else {
        const err = await res.json()
        setToast({ message: err.error || 'Error al eliminar jugador', type: 'error' })
      }
    } catch {
      setToast({ message: 'Error de conexión', type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h2 className="text-2xl font-bold mb-4">Jugadores del Club</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-80"
        />
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? 'Cancelar' : 'Agregar jugador'}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input
            type="text"
            placeholder="Nombre*"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="border rounded px-3 py-2 w-full md:w-48"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="border rounded px-3 py-2 w-full md:w-48"
          />
          <input
            type="text"
            placeholder="Teléfono"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="border rounded px-3 py-2 w-full md:w-40"
          />
          <input
            type="text"
            placeholder="Notas"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="border rounded px-3 py-2 w-full md:w-56"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            disabled={loading}
          >
            Guardar
          </button>
        </form>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {players.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-gray-400">No hay jugadores registrados.</td>
              </tr>
            )}
            {players.map(p => (
              <tr key={p.id}>
                {editId === p.id ? (
                  <>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                      <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="border rounded px-2 py-1 w-32" required />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                      <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="border rounded px-2 py-1 w-32" />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                      <input type="text" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="border rounded px-2 py-1 w-24" />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                      <input type="text" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className="border rounded px-2 py-1 w-40" />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">-</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded mr-2 text-xs">Guardar</button>
                      <button onClick={() => setEditId(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 py-1 rounded text-xs">Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{p.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{p.email || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{p.phone || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{p.notes || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 font-bold">${p.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <button onClick={() => handleEdit(p)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded mr-2 text-xs">Editar</button>
                      <button onClick={() => handleDelete(p.id)} className={`bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs ${deletingId === p.id ? 'opacity-50' : ''}`} disabled={deletingId === p.id}>Eliminar</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 