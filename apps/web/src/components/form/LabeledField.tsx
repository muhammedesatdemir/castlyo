import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  name: string
  label: string
  as?: "input" | "textarea"
  inputProps?: React.ComponentProps<"input"> & React.ComponentProps<"textarea">
  className?: string
  error?: string
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  disabled?: boolean
  readOnly?: boolean
  type?: string
  placeholder?: string
}

export function LabeledField({ 
  name, 
  label, 
  as = "input", 
  inputProps = {}, 
  className,
  error,
  value,
  onChange,
  onBlur,
  disabled = false,
  readOnly = false,
  type = "text",
  placeholder
}: Props) {
  const fieldId = `field-${name}`
  
  return (
    <div className={cn("space-y-1", className)}>
      {/* LABEL HER ZAMAN RENDER EDİLİR - KOŞULSUZ */}
      <label 
        htmlFor={fieldId}
        className="text-sm font-medium text-slate-700 block"
      >
        {label}
      </label>
      
      {/* INPUT/TEXTAREA */}
      {as === "textarea" ? (
        <Textarea
          id={fieldId}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder || " "}
          className={cn(
            "w-full rounded-lg px-3 py-2 ring-1 bg-white",
            disabled ? "ring-neutral-200/70" : "ring-neutral-300 focus:outline-none focus:ring-2"
          )}
          {...inputProps}
        />
      ) : (
        <Input
          id={fieldId}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder || " "}
          className={cn(
            "w-full rounded-lg px-3 py-2 ring-1 bg-white",
            disabled ? "ring-neutral-200/70" : "ring-neutral-300 focus:outline-none focus:ring-2"
          )}
          {...inputProps}
        />
      )}
      
      {/* ERROR MESSAGE */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
