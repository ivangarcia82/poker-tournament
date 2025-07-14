interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'white'
  text?: string
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary', 
  text,
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const variantClasses = {
    primary: 'text-blue-600',
    white: 'text-white'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className={`${sizeClasses[size]} rounded-full border-2 border-gray-200 bg-white/50 backdrop-blur-sm shadow-lg`}>
            <div className={`${sizeClasses[size]} rounded-full border-2 border-transparent border-t-current animate-spin ${variantClasses[variant]}`}></div>
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 animate-pulse"></div>
        </div>
        {text && (
          <span className={`text-sm font-medium ${variantClasses[variant]} bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`}>
            {text}
          </span>
        )}
      </div>
    </div>
  )
} 