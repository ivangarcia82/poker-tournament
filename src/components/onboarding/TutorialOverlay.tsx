import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTutorial } from './TutorialContext'

const steps = [
  {
    title: 'Bienvenido a Poker Tournament Manager',
    description: 'Gestiona torneos, jugadores y reportes de forma moderna y visual. Te guiaremos paso a paso. Haz clic en “Siguiente” para comenzar.',
    selector: null
  },
  {
    title: 'Menú principal',
    description: 'Este es el menú principal. Haz clic en “Torneos” para continuar. El resto de la interfaz está bloqueada hasta que completes este paso.',
    selector: '#nav'
  },
  {
    title: 'Crear tu primer torneo',
    description: 'Haz clic en “Crear Torneo” para iniciar tu primer torneo. Solo este botón está habilitado.',
    selector: '.create-tournament-btn'
  },
  {
    title: 'Ver detalles del torneo',
    description: 'Haz clic en “Ver Detalles” del torneo que acabas de crear para ver estadísticas y reportes.',
    selector: '.tournament-list .ver-detalles-btn'
  },
  {
    title: 'Agregar tu primer jugador',
    description: 'Haz clic en “Agregar Jugador” y completa el formulario. El resto de la interfaz está bloqueada.',
    selector: '.add-player-btn'
  },
  {
    title: '¡Listo!',
    description: '¡Felicidades! Has completado el tutorial. Ahora puedes explorar todas las funciones de la app.',
    selector: null
  }
]

function getRect(selector: string | null): DOMRect | null {
  if (!selector) return null
  const el = document.querySelector(selector)
  return el ? el.getBoundingClientRect() : null
}

export default function TutorialOverlay({ onComplete, onSkip }: { onComplete: () => void, onSkip: () => void }) {
  const { step, next, prev, skip, isActive } = useTutorial()
  const overlayRef = useRef<HTMLDivElement>(null)
  const currentStep = steps[step]
  const rect = typeof window !== 'undefined' ? getRect(currentStep.selector) : null

  useEffect(() => {
    if (!isActive) return
    if (currentStep.selector && rect) {
      window.scrollTo({
        top: rect.top + window.scrollY - 100,
        behavior: 'smooth'
      })
    }
  }, [step, isActive])

  if (!isActive) return null

  return createPortal(
    <div className="fixed inset-0 z-[1000] pointer-events-auto">
      {/* Overlay oscuro que bloquea todo excepto el área resaltada */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" />
      {/* Overlay de resaltado */}
      {rect && (
        <div
          className="absolute border-4 border-blue-500 rounded-2xl pointer-events-none shadow-2xl"
          style={{
            left: rect.left - 8,
            top: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.4), 0 0 24px 4px #3b82f6'
          }}
        />
      )}
      {/* Tooltip */}
      <div
        ref={overlayRef}
        className="fixed z-[1001] left-1/2 top-24 -translate-x-1/2 bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center animate-fade-in"
        style={{ maxWidth: '95vw' }}
      >
        <h2 className="text-2xl font-bold mb-2 text-blue-700">{currentStep.title}</h2>
        <p className="text-gray-700 mb-6">{currentStep.description}</p>
        <div className="flex justify-between">
          {step > 0 ? (
            <button className="px-4 py-2 text-gray-500 hover:text-blue-600" onClick={prev}>Anterior</button>
          ) : <span />}
          {step < steps.length - 1 ? (
            <button className="px-6 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 font-semibold" onClick={next}>Siguiente</button>
          ) : (
            <button className="px-6 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 font-semibold" onClick={onComplete}>Finalizar</button>
          )}
        </div>
        <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500" onClick={onSkip} title="Saltar tutorial">✕</button>
        <div className="mt-4 text-xs text-gray-400">Paso {step + 1} de {steps.length}</div>
      </div>
    </div>,
    document.body
  )
} 