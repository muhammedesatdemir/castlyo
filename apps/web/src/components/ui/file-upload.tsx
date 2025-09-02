'use client'

import { useState, useRef } from 'react'
import { Button } from './button'
import { Card } from './card'
import { Upload, X, FileImage, File, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in bytes
  maxFiles?: number
  className?: string
  folder: 'profiles' | 'portfolios' | 'documents' | 'jobs'
}

export function FileUpload({
  onFilesChange,
  accept = 'image/*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  className,
  folder
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `Dosya boyutu ${Math.round(maxSize / 1024 / 1024)}MB'dan büyük olamaz`
    }

    const allowedTypes: Record<string, string[]> = {
      profiles: ['image/jpeg', 'image/png', 'image/webp'],
      portfolios: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/mov', 'video/avi'],
      documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      jobs: ['image/jpeg', 'image/png', 'image/webp']
    }

    if (!allowedTypes[folder].includes(file.type)) {
      return `Bu dosya türü desteklenmiyor: ${file.type}`
    }

    return null
  }

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return

    const fileArray = Array.from(newFiles)
    const validFiles: File[] = []
    let errorMessage = ''

    // Check total file count
    if (!multiple && fileArray.length > 1) {
      setError('Sadece bir dosya seçebilirsiniz')
      return
    }

    if (files.length + fileArray.length > maxFiles) {
      setError(`En fazla ${maxFiles} dosya seçebilirsiniz`)
      return
    }

    // Validate each file
    for (const file of fileArray) {
      const validation = validateFile(file)
      if (validation) {
        errorMessage = validation
        break
      }
      validFiles.push(file)
    }

    if (errorMessage) {
      setError(errorMessage)
      return
    }

    const updatedFiles = multiple ? [...files, ...validFiles] : validFiles
    setFiles(updatedFiles)
    setError(null)
    onFilesChange(updatedFiles)
  }

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="h-8 w-8 text-blue-500" />
    }
    return <File className="h-8 w-8 text-gray-500" />
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Card
        className={cn(
          'border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          error ? 'border-red-500 bg-red-50' : ''
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Dosya yüklemek için tıklayın veya sürükleyip bırakın
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {accept} - Maksimum {formatFileSize(maxSize)}
        </p>
        {multiple && (
          <p className="text-xs text-gray-400">
            En fazla {maxFiles} dosya seçebilirsiniz
          </p>
        )}
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Seçilen Dosyalar:</h4>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              {getFileIcon(file)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(index)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
