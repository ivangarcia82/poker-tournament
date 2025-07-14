import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const getStyles = () => {
    switch (type) {
      case 'success': 
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400'
      case 'error': 
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400'
      case 'warning': 
        return 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-yellow-400'
      default: 
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-400'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'error': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'warning': 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      default: 
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-sm border-2 border-white/20 flex items-center space-x-3 ${getStyles()}`}
      role="alert"
    >
      <div className="flex-shrink-0">
        <div className="inline-flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
          {getIcon()}
        </div>
      </div>
      <span className="font-medium text-sm">{message}</span>
      <button 
        onClick={onClose} 
        className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 bg-white/20 rounded-full hover:bg-white/30 transition-colors duration-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
} 