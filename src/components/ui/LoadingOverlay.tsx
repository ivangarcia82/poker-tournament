import LoadingSpinner from './LoadingSpinner'

interface LoadingOverlayProps {
  isLoading: boolean
  text?: string
  className?: string
}

export default function LoadingOverlay({ 
  isLoading, 
  text = 'Cargando...',
  className = '' 
}: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
        <div className="relative">
          <LoadingSpinner size="lg" text={text} />
        </div>
      </div>
    </div>
  )
} 