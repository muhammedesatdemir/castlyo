import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Textarea } from "./textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

export interface FieldProps {
  label?: string
  error?: string
  className?: string
  children?: React.ReactNode
}

export function Field({ label, error, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {/* LABEL HER ZAMAN RENDER EDİLİR - KOŞULSUZ */}
      <label className="text-sm font-medium text-slate-700 block">
        {label || ""}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

export interface UInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const UInput = React.forwardRef<HTMLInputElement, UInputProps>(
  ({ label, error, placeholder, className, ...props }, ref) => {
    return (
      <Field label={label} error={error}>
        <Input
          ref={ref}
          placeholder={placeholder || " "}
          className={className}
          {...props}
        />
      </Field>
    )
  }
)
UInput.displayName = "UInput"

export interface UTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const UTextarea = React.forwardRef<HTMLTextAreaElement, UTextareaProps>(
  ({ label, error, placeholder, className, ...props }, ref) => {
    return (
      <Field label={label} error={error}>
        <Textarea
          ref={ref}
          placeholder={placeholder || " "}
          className={className}
          {...props}
        />
      </Field>
    )
  }
)
UTextarea.displayName = "UTextarea"

export interface USelectProps {
  label?: string
  error?: string
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

export function USelect({ 
  label, 
  error, 
  placeholder, 
  value, 
  onValueChange, 
  disabled, 
  children, 
  className 
}: USelectProps) {
  return (
    <Field label={label} error={error}>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder || " "} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    </Field>
  )
}

// Phone input wrapper with Turkish format
export interface UPhoneProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string
  error?: string
  value?: string
  onValueChange?: (value: string) => void
}

export const UPhone = React.forwardRef<HTMLInputElement, UPhoneProps>(
  ({ label, error, placeholder, value, onValueChange, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value || '')

    React.useEffect(() => {
      setDisplayValue(value || '')
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      setDisplayValue(inputValue)
      onValueChange?.(inputValue)
    }

    return (
      <Field label={label} error={error}>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
            +90
          </div>
          <Input
            ref={ref}
            type="tel"
            placeholder={placeholder || " "}
            value={displayValue}
            onChange={handleChange}
            className={cn("pl-12", className)}
            {...props}
          />
        </div>
      </Field>
    )
  }
)
UPhone.displayName = "UPhone"
