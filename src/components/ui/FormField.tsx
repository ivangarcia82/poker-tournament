import React from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  optional?: boolean
  optionalText?: string
  children: React.ReactNode
  error?: string
}

export default function FormField({ 
  label, 
  required = false, 
  optional = false, 
  optionalText = "(Opcional)",
  children, 
  error 
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && <span className="text-gray-500 ml-1">{optionalText}</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

interface InputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'label'> {
  label: string
  required?: boolean
  optional?: boolean
  optionalText?: string
  error?: string
}

export function InputField({ 
  label, 
  required = false, 
  optional = false, 
  optionalText = "(Opcional)",
  error,
  className = "w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm",
  ...props 
}: InputFieldProps) {
  return (
    <FormField 
      label={label} 
      required={required} 
      optional={optional} 
      optionalText={optionalText}
      error={error}
    >
      <input 
        className={className}
        {...props}
      />
    </FormField>
  )
}

interface TextAreaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'label'> {
  label: string
  required?: boolean
  optional?: boolean
  optionalText?: string
  error?: string
}

export function TextAreaField({ 
  label, 
  required = false, 
  optional = false, 
  optionalText = "(Opcional)",
  error,
  className = "w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none",
  ...props 
}: TextAreaFieldProps) {
  return (
    <FormField 
      label={label} 
      required={required} 
      optional={optional} 
      optionalText={optionalText}
      error={error}
    >
      <textarea 
        className={className}
        {...props}
      />
    </FormField>
  )
}

interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'label'> {
  label: string
  required?: boolean
  optional?: boolean
  optionalText?: string
  error?: string
  options: { value: string; label: string }[]
}

export function SelectField({ 
  label, 
  required = false, 
  optional = false, 
  optionalText = "(Opcional)",
  error,
  options,
  className = "w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm",
  ...props 
}: SelectFieldProps) {
  return (
    <FormField 
      label={label} 
      required={required} 
      optional={optional} 
      optionalText={optionalText}
      error={error}
    >
      <div className="relative">
        <select 
          className={className}
          {...props}
        >
          <option value="">Seleccionar...</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </FormField>
  )
} 